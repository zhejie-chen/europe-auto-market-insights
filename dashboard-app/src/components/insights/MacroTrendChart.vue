<template>
  <div class="flex flex-col w-full h-full relative">
    <!-- 顶栏：标题与叙事对比 KPI -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h3 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
          月度大盘趋势
        </h3>
      </div>
      
      <!-- Mini-KPI 徽章群 -->
      <div v-if="latestData" class="flex flex-wrap gap-3">
        <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end min-w-[90px]">
           <span class="text-[10px] text-slate-400 font-bold tracking-wider">YTD累计销量</span>
           <span class="font-black text-slate-700 text-sm">{{ formatNumber(latestData['YTD_销量']) }}</span>
        </div>
        <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end min-w-[90px]">
           <span class="text-[10px] text-slate-400 font-bold tracking-wider">YTD累计同比</span>
           <span class="font-black text-sm" :class="latestData['YTD_同比增速%'] >= 0 ? 'text-emerald-500' : 'text-rose-500'">
             {{ formatGrowth(latestData['YTD_同比增速%']) }}
           </span>
        </div>
        <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex flex-col items-end min-w-[90px]">
           <span class="text-[10px] text-slate-400 font-bold tracking-wider">当月环比增速</span>
           <span class="font-black text-sm" :class="latestData['总销量_环比增速%'] >= 0 ? 'text-emerald-500' : 'text-rose-500'">
             {{ formatGrowth(latestData['总销量_环比增速%']) }}
           </span>
        </div>
      </div>
    </div>

    <!-- ECharts 图表容器 -->
    <div class="flex-1 min-h-[300px]">
      <v-chart v-if="!loading && chartOptions" class="w-full h-full" :option="chartOptions" autoresize :key="chartKey" />
      <div v-else class="h-full flex flex-col justify-center items-center text-slate-400 gap-2">
        <div class="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span class="text-xs">加载图表数据...</span>
      </div>
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
const rawDict = ref({}) // { '25-01': { '总销量': 100, ... } }
const timeSeries = ref([]) // ['25-01', '25-02']
const latestData = ref(null)
const chartKey = ref(0) // 强制重新渲染的 key

const formatNumber = (num) => {
  if (num === null || num === undefined) return '-'
  return num.toLocaleString()
}

const formatGrowth = (num) => {
  if (num === null || num === undefined) return '-'
  return `${num >= 0 ? '+' : ''}${num}%`
}

const fetchData = async () => {
  loading.value = true
  
  const targetYearStr = props.year.toString().slice(-2)
  const targetMonthStr = props.month.toString().padStart(2, '0')
  const highlightLabel = `${targetYearStr}-${targetMonthStr}` // "26-02"

  const { data, error } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('year, month, metric_name, metric_value')
    .eq('dimension_level', '国家')
    .eq('country', props.country)
    .gte('year', props.year - 1)
    .in('metric_name', [
      '总销量', 
      '总销量_同比增速%', 
      '总销量_环比增速%', 
      'YTD_销量', 
      'YTD_同比增速%',
      '新能源_销量'
    ])

  if (error || !data) {
    console.error("加载国家宏观趋势数据失败：", error)
    loading.value = false
    return
  }

  // 长表转宽表
  const dict = {}
  data.forEach(row => {
    const yStr = row.year.toString().slice(-2)
    const mStr = row.month.toString().padStart(2, '0')
    const key = `${yStr}-${mStr}`
    
    if (!dict[key]) {
      dict[key] = { year: row.year, month: row.month }
    }
    dict[key][row.metric_name] = Number(row.metric_value) || 0
  })

  // 按年月排序
  const keys = Object.keys(dict).sort((a, b) => {
    const [yA, mA] = a.split('-').map(Number)
    const [yB, mB] = b.split('-').map(Number)
    if (yA !== yB) return yA - yB
    return mA - mB
  })
  
  rawDict.value = dict
  timeSeries.value = keys
  latestData.value = dict[highlightLabel] || null
  
  chartKey.value++
  loading.value = false
}

const chartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null
  
  const targetYearStr = props.year.toString().slice(-2)
  const targetMonthStr = props.month.toString().padStart(2, '0')
  const highlightLabel = `${targetYearStr}-${targetMonthStr}` // "26-02"

  let xLabels = timeSeries.value
  const targetIndex = xLabels.indexOf(highlightLabel)
  if (targetIndex !== -1) {
    xLabels = xLabels.slice(Math.max(0, targetIndex - 11), targetIndex + 1)
  } else {
    xLabels = xLabels.slice(-12)
  }
  const volumeData = xLabels.map(k => rawDict.value[k]['总销量'] || 0)
  const nevData = xLabels.map(k => rawDict.value[k]['新能源_销量'] || 0)
  const otherData = xLabels.map((k, idx) => Math.max(0, volumeData[idx] - nevData[idx]))
  const yoyData = xLabels.map(k => rawDict.value[k]['总销量_同比增速%'] || 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      textStyle: { color: '#334155' },
      formatter: (params) => {
        const xKey = params[0].axisValue // e.g. "26-02"
        const d = rawDict.value[xKey] || {}
        const vol = d['总销量'] || 0
        const nev = d['新能源_销量'] || 0
        const other = Math.max(0, vol - nev)
        const nevRatio = vol > 0 ? ((nev / vol) * 100).toFixed(1) + '%' : '-'
        const yoy = d['总销量_同比增速%']
        const mom = d['总销量_环比增速%']
        
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px; color: #0f172a;">${d.year}年${d.month}月 大盘详情</div>`
        
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>📦 当月总销量</span>
          <span style="font-weight: 700; color: #3b82f6;">${vol ? vol.toLocaleString() : '-'} 辆</span>
        </div>`

        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span>新能源销量 (渗透率 ${nevRatio})</span>
          <span style="font-weight: 700; color: #10b981;">${nev ? nev.toLocaleString() : '-'} 辆</span>
        </div>`

        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:4px;"></span>其他动力销量</span>
          <span style="font-weight: 700; color: #3b82f6;">${other ? other.toLocaleString() : '-'} 辆</span>
        </div>`
        
        const yoyColor = yoy >= 0 ? '#10b981' : '#f43f5e'
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
          <span>📈 同比增速 (YoY)</span>
          <span style="font-weight: 700; color: ${yoyColor};">${yoy ? (yoy >= 0 ? '+' : '') + yoy + '%' : '-'}</span>
        </div>`

        const momColor = mom >= 0 ? '#10b981' : '#f43f5e'
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; font-size: 13px;">
          <span>📊 环比增速 (MoM)</span>
          <span style="font-weight: 700; color: ${momColor};">${mom ? (mom >= 0 ? '+' : '') + mom + '%' : '-'}</span>
        </div>`
        
        return html
      }
    },
    legend: {
      data: ['新能源', '其他动力', '同比增速%'],
      bottom: 0,
      icon: 'circle'
    },
    grid: { left: '2%', right: '2%', bottom: '12%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { 
        color: '#64748b',
        formatter: (value) => value === highlightLabel ? `{active|${value}}` : value,
        rich: { active: { color: '#d97706', fontWeight: 'bold', fontSize: 13 } }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '销量 (辆)',
        nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, 20] },
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: '同比 (%)',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { formatter: '{value}%', color: '#64748b' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '新能源',
        type: 'bar',
        stack: 'total',
        yAxisIndex: 0,
        barWidth: '40%',
        itemStyle: { color: '#10b981' },
        data: nevData,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.12)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: '其他动力',
        type: 'bar',
        stack: 'total',
        yAxisIndex: 0,
        barWidth: '40%',
        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        data: otherData
      },
      {
        name: '同比增速%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#f43f5e' },
        lineStyle: { width: 3, shadowColor: 'rgba(244, 63, 94, 0.3)', shadowBlur: 8, shadowOffsetY: 4 },
        data: yoyData
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country], fetchData, { immediate: true })
</script>
