<template>
  <div class="flex flex-col w-full h-full relative gap-6">
    
    <!-- 加载态 -->
    <div v-if="loading" class="h-full flex flex-col justify-center items-center text-slate-400 gap-2 absolute inset-0 bg-white/50 z-10">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
      <span class="text-xs">加载电动化数据...</span>
    </div>

    <!-- Chart 1：新能源技术路线大盘走势 -->
    <div class="flex-1 flex flex-col min-h-[220px]">
      <div class="flex items-center gap-2 mb-2 pl-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">新能源放量与双技术路线走势 (BEV & PHEV)</h4>
      </div>
      <v-chart class="w-full flex-1" v-if="trendChartOptions" :option="trendChartOptions" autoresize :key="'trend-' + chartKey" />
    </div>

    <!-- 中间分割线 -->
    <div class="w-full h-px bg-slate-100"></div>

    <!-- Chart 2：当月主力厂牌排行 -->
    <div class="flex-1 flex flex-col min-h-[250px]">
      <div class="flex items-center justify-between mb-2 pl-2 pr-4">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          <h4 class="text-sm font-bold text-slate-600">{{ year }}年{{ month }}月 当地新能源主力厂牌 (Top 10)</h4>
        </div>
        <div class="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
           <button 
             @click="rankType = 'group'"
             class="px-3 py-1 rounded-md transition-colors"
             :class="rankType === 'group' ? 'bg-white shadow-sm font-bold text-emerald-600' : 'text-slate-500 hover:text-slate-700'"
           >集团</button>
           <button 
             @click="rankType = 'brand'"
             class="px-3 py-1 rounded-md transition-colors"
             :class="rankType === 'brand' ? 'bg-white shadow-sm font-bold text-emerald-600' : 'text-slate-500 hover:text-slate-700'"
           >品牌</button>
        </div>
      </div>
      <v-chart class="w-full flex-1" v-if="rankChartOptions" :option="rankChartOptions" autoresize :key="'rank-' + chartKey + rankType" />
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent])

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  country: { type: String, required: true }
})

const loading = ref(true)
const rawDict = ref({})
const timeSeries = ref([])
const chartKey = ref(0) 

const rankType = ref('group')
const topGroups = ref([])
const topBrands = ref([])

const fetchData = async () => {
  loading.value = true
  
  // 1. 获取国家级别的时序大盘与路线数据
  const { data: tsData, error: tsError } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('year, month, metric_name, metric_value')
    .eq('dimension_level', '国家')
    .eq('country', props.country)
    .gte('year', props.year - 1)
    .in('metric_name', [
      'BEV_销量', 
      'PHEV_销量', 
      '新能源_渗透率%', 
      '新能源_同比增速%'
    ])

  if (tsError) {
    console.error("加载电动化时序数据失败：", tsError)
  } else {
    const dict = {}
    tsData.forEach(row => {
      const yStr = row.year.toString().slice(-2)
      const mStr = row.month.toString().padStart(2, '0')
      const key = `${yStr}-${mStr}`
      
      if (!dict[key]) {
        dict[key] = { year: row.year, month: row.month }
      }
      dict[key][row.metric_name] = Number(row.metric_value) || 0
    })

    timeSeries.value = Object.keys(dict).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number)
      const [yB, mB] = b.split('-').map(Number)
      if (yA !== yB) return yA - yB
      return mA - mB
    })
    rawDict.value = dict
  }

  // 2. 获取当月特定品牌和集团的新能源销量排行
  const { data: rankData, error: rankError } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('dimension_level, group_name, brand_name, metric_value')
    .in('dimension_level', ['集团', '品牌'])
    .eq('country', props.country)
    .eq('year', props.year)
    .eq('month', props.month)
    .eq('metric_name', '新能源销量')

  if (rankError) {
    console.error("加载电动化横截面排名数据失败：", rankError)
  } else {
    const gList = []
    const bList = []
    rankData.forEach(d => {
      if (d.dimension_level === '集团') {
        gList.push({ name: d.group_name, value: Number(d.metric_value) || 0 })
      } else if (d.dimension_level === '品牌') {
        bList.push({ name: d.brand_name, value: Number(d.metric_value) || 0 })
      }
    })
    // 过滤掉 ALL 等总计项（如果存在），然后排序取 Top 10
    topGroups.value = gList.filter(d => d.name && d.name !== 'ALL' && d.name !== 'Unknown').sort((a, b) => b.value - a.value).slice(0, 10)
    topBrands.value = bList.filter(d => d.name && d.name !== 'ALL' && d.name !== 'Unknown').sort((a, b) => b.value - a.value).slice(0, 10)
  }

  chartKey.value++
  loading.value = false
}

const activeWindowLabels = computed(() => {
  const targetYearStr = props.year.toString().slice(-2)
  const targetMonthStr = props.month.toString().padStart(2, '0')
  const highlightLabel = `${targetYearStr}-${targetMonthStr}` 
  let labels = timeSeries.value
  const targetIndex = labels.indexOf(highlightLabel)
  if (targetIndex !== -1) {
    labels = labels.slice(Math.max(0, targetIndex - 11), targetIndex + 1)
  } else {
    labels = labels.slice(-12)
  }
  return { labels, highlightLabel }
})

// ============== Chart 1：技术路线走势 ==============
const trendChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  const bevData = xLabels.map(k => rawDict.value[k]['BEV_销量'] || 0)
  const phevData = xLabels.map(k => rawDict.value[k]['PHEV_销量'] || 0)
  const penData = xLabels.map(k => rawDict.value[k]['新能源_渗透率%'] || 0)
  const yoyData = xLabels.map(k => rawDict.value[k]['新能源_同比增速%'] || 0)

  // 为了显示顶部总数构建的占位数据
  const sumData = xLabels.map((k, idx) => bevData[idx] + phevData[idx])

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' },
      formatter: (params) => {
        const xKey = params[0].axisValue
        const d = rawDict.value[xKey] || {}
        
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px; color: #0f172a;">${d.year}年${d.month}月 新能源大盘</div>`
        
        const bev = d['BEV_销量'] || 0
        const phev = d['PHEV_销量'] || 0
        const total = bev + phev
        const pen = d['新能源_渗透率%'] || 0
        const yoy = d['新能源_同比增速%'] || 0

        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>⚡ 当月新能源总销量</span>
          <span style="font-weight: 700; color: #0f172a;">${total.toLocaleString()} 辆</span>
        </div>`
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span>BEV纯电</span>
          <span style="font-weight: 700; color: #10b981;">${bev.toLocaleString()} 辆</span>
        </div>`
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#06b6d4;margin-right:4px;"></span>PHEV插混</span>
          <span style="font-weight: 700; color: #06b6d4;">${phev.toLocaleString()} 辆</span>
        </div>`
        
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
          <span>📈 总体渗透率</span>
          <span style="font-weight: 700; color: #ef4444;">${pen}%</span>
        </div>`
        const yoyColor = yoy >= 0 ? '#10b981' : '#f43f5e'
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; font-size: 13px;">
          <span>📊 同比增速</span>
          <span style="font-weight: 700; color: ${yoyColor};">${yoy > 0 ? '+' : ''}${yoy}%</span>
        </div>`
        
        return html
      }
    },
    legend: {
      data: ['BEV纯电', 'PHEV插混', '渗透率%', '同比增速%'],
      bottom: 0,
      icon: 'circle',
      itemHeight: 8
    },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { 
        color: '#64748b',
        formatter: (value) => value === highlightLabel ? `{active|${value}}` : value,
        rich: { active: { color: '#d97706', fontWeight: 'bold' } }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '销量',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: '百分比(%)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { formatter: '{value}%', color: '#64748b' },
        splitLine: { show: false }
      },
      {
        type: 'value',
        show: false // 用于独立同比增速
      }
    ],
    series: [
      {
        name: 'BEV纯电',
        type: 'bar',
        stack: 'nev',
        yAxisIndex: 0,
        barWidth: '35%',
        itemStyle: { color: '#10b981' },
        data: bevData,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.08)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: 'PHEV插混',
        type: 'bar',
        stack: 'nev',
        yAxisIndex: 0,
        barWidth: '35%',
        itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] },
        data: phevData
      },
      {
        name: '总计',
        type: 'bar',
        barGap: '-100%',
        barWidth: '35%',
        itemStyle: { color: 'transparent' },
        data: sumData,
        yAxisIndex: 0,
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'bold',
          formatter: (p) => p.value ? p.value.toLocaleString() : ''
        }
      },
      {
        name: '渗透率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3, shadowColor: 'rgba(239, 68, 68, 0.3)', shadowBlur: 8, shadowOffsetY: 4 },
        data: penData
      },
      {
        name: '同比增速%',
        type: 'line',
        yAxisIndex: 2,
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2, type: 'dashed' },
        data: yoyData
      }
    ]
  }
})

// ============== Chart 2：厂牌横向排行榜 ==============
const rankChartOptions = computed(() => {
  const dataList = rankType.value === 'group' ? topGroups.value : topBrands.value
  if (dataList.length === 0) return null
  
  // 倒序排列以确保横向柱状图最大值在上方
  const reversed = [...dataList].reverse()
  const names = reversed.map(d => d.name)
  const vals = reversed.map(d => d.value)
  const maxValue = Math.max(...vals, 1)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155', fontSize: 13 },
      formatter: (params) => {
        const val = params[0].value
        const name = params[0].name
        return `<div style="font-weight:bold; margin-bottom:4px;">${name}</div>
                <div style="display:flex; justify-content:space-between; gap:20px;">
                  <span>当月新能源销量</span>
                  <span style="font-weight:bold; color:#10b981;">${val.toLocaleString()} 辆</span>
                </div>`
      }
    },
    grid: { left: '3%', right: '10%', bottom: '0%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      show: false // 隐藏X轴，靠柱子右侧的数字体现数值
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 12,
        width: 100,
        overflow: 'truncate'
      }
    },
    series: [
      {
        type: 'bar',
        data: vals,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          // 使用绿色渐变
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#059669' }
            ]
          }
        },
        showBackground: true,
        backgroundStyle: {
          color: '#f1f5f9',
          borderRadius: [0, 8, 8, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#0f172a',
          fontWeight: 'bold',
          formatter: (p) => p.value.toLocaleString(),
          offset: [5, 0]
        }
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country], fetchData, { immediate: true })
</script>
