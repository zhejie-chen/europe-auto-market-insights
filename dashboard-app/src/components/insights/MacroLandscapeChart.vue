<template>
  <div class="flex flex-col w-full h-full relative gap-6">
    
    <!-- 加载态 -->
    <div v-if="loading" class="h-full flex flex-col justify-center items-center text-slate-400 gap-2 absolute inset-0 bg-white/50 z-10">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      <span class="text-xs">加载竞争格局数据...</span>
    </div>

    <!-- Chart 1：市场头部集中度 -->
    <div class="flex-1 flex flex-col min-h-[220px]">
      <div class="flex items-center gap-2 mb-2 pl-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">头部品牌集中度演变 (Top 5 品牌份额)</h4>
      </div>
      <v-chart class="w-full flex-1" v-if="topChartOptions" :option="topChartOptions" autoresize :key="'top-' + chartKey" />
    </div>

    <!-- 中间分割线 -->
    <div class="w-full h-px bg-slate-100"></div>

    <!-- Chart 2：中国品牌大盘表现 -->
    <div class="flex-1 flex flex-col min-h-[220px]">
      <div class="flex items-center gap-2 mb-2 pl-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">中国品牌在当地的市场表现 (销量与市占率)</h4>
      </div>
      <v-chart class="w-full flex-1" v-if="cnChartOptions" :option="cnChartOptions" autoresize :key="'cn-' + chartKey" />
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
const chartKey = ref(0) // 用于强制重新渲染

const fetchData = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('year, month, metric_name, metric_value')
    .eq('dimension_level', '国家')
    .eq('country', props.country)
    .gte('year', props.year - 1)
    .in('metric_name', [
      '中国品牌_销量', 
      '中国品牌_市占率%', 
      '中国品牌_同比增速%',
      'CN_Top1_品牌', 'CN_Top1_市占率%', 'CN_Top1_销量',
      'CN_Top2_品牌', 'CN_Top2_市占率%', 'CN_Top2_销量',
      'CN_Top3_品牌', 'CN_Top3_市占率%', 'CN_Top3_销量',
      'Top1_品牌', 'Top1_市占率%',
      'Top2_品牌', 'Top2_市占率%',
      'Top3_品牌', 'Top3_市占率%',
      'Top4_品牌', 'Top4_市占率%',
      'Top5_品牌', 'Top5_市占率%',
      '市场集中度_HHI'
    ])

  if (error || !data) {
    console.error("加载竞争格局数据失败：", error)
    loading.value = false
    return
  }

  const dict = {}
  data.forEach(row => {
    const yStr = row.year.toString().slice(-2)
    const mStr = row.month.toString().padStart(2, '0')
    const key = `${yStr}-${mStr}`
    
    if (!dict[key]) {
      dict[key] = { year: row.year, month: row.month }
    }
    // 名称是字符串，销量和市占率是数字
    if (row.metric_name.includes('品牌') && !row.metric_name.includes('中国品牌_')) {
       dict[key][row.metric_name] = row.metric_value // 字符串 (品牌名)
    } else {
       dict[key][row.metric_name] = Number(row.metric_value) || 0
    }
  })

  // 按年月排序 (长表转宽表后的时间序列提取)
  const keys = Object.keys(dict).sort((a, b) => {
    const [yA, mA] = a.split('-').map(Number)
    const [yB, mB] = b.split('-').map(Number)
    if (yA !== yB) return yA - yB
    return mA - mB
  })
  
  rawDict.value = dict
  timeSeries.value = keys
  chartKey.value++
  loading.value = false
}

// ============== 共用逻辑：视窗截取 ==============
const activeWindowLabels = computed(() => {
  const targetYearStr = props.year.toString().slice(-2)
  const targetMonthStr = props.month.toString().padStart(2, '0')
  const highlightLabel = `${targetYearStr}-${targetMonthStr}` // "26-02"

  let labels = timeSeries.value
  const targetIndex = labels.indexOf(highlightLabel)
  // 如果找到了目标月份，往前看 12 个月（最长）
  if (targetIndex !== -1) {
    labels = labels.slice(Math.max(0, targetIndex - 11), targetIndex + 1)
  } else {
    // 没找到（可能是异常情况），就取最后 12 个月
    labels = labels.slice(-12)
  }
  return { labels, highlightLabel }
})

// ============== Chart 1：中国品牌表现 ==============
const cnChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  const cnSalesData = xLabels.map(k => rawDict.value[k]['中国品牌_销量'] || 0)
  const cnShareData = xLabels.map(k => rawDict.value[k]['中国品牌_市占率%'] || 0)
  const cnYoyData = xLabels.map(k => rawDict.value[k]['中国品牌_同比增速%'] || 0)

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
        const xKey = params[0].axisValue
        const d = rawDict.value[xKey] || {}
        
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px; color: #0f172a;">${d.year}年${d.month}月 中国品牌表现</div>`
        
        const sales = d['中国品牌_销量'] || 0
        const share = d['中国品牌_市占率%'] || 0
        const yoy = d['中国品牌_同比增速%'] || 0
        
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>🇨🇳 总销量</span>
          <span style="font-weight: 700; color: #f59e0b;">${sales.toLocaleString()} 辆</span>
        </div>`
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>📈 市场份额</span>
          <span style="font-weight: 700; color: #ef4444;">${share}%</span>
        </div>`
        const yoyColor = yoy >= 0 ? '#10b981' : '#f43f5e'
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 8px; font-size: 13px;">
          <span>📊 同比增速</span>
          <span style="font-weight: 700; color: ${yoyColor};">${yoy > 0 ? '+' : ''}${yoy}%</span>
        </div>`

        // 附加 Top 3 中国品牌情况
        if (d['CN_Top1_品牌'] || d['CN_Top2_品牌'] || d['CN_Top3_品牌']) {
          html += `<div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-top: 8px; margin-bottom: 4px; font-weight: bold;">当月中国品牌销量 Top3</div>`
          if (d['CN_Top1_品牌']) html += `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span>1. ${d['CN_Top1_品牌']}</span><span style="font-weight:600;">${d['CN_Top1_销量'] || '-'} 辆</span></div>`
          if (d['CN_Top2_品牌']) html += `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span>2. ${d['CN_Top2_品牌']}</span><span style="font-weight:600;">${d['CN_Top2_销量'] || '-'} 辆</span></div>`
          if (d['CN_Top3_品牌']) html += `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>3. ${d['CN_Top3_品牌']}</span><span style="font-weight:600;">${d['CN_Top3_销量'] || '-'} 辆</span></div>`
        }
        
        return html
      }
    },
    legend: {
      data: ['中国品牌销量', '市占率%', '同比增速%'],
      bottom: 0,
      icon: 'circle'
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
        show: false // 专门隐藏的坐标轴，用来给 同比增速 使用以免压平市占率曲线
      }
    ],
    series: [
      {
        name: '中国品牌销量',
        type: 'bar',
        yAxisIndex: 0,
        barWidth: '35%',
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        data: cnSalesData,
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'bold',
          formatter: (p) => p.value ? p.value.toLocaleString() : ''
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.08)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: '市占率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#ef4444' },
        lineStyle: { width: 3, shadowColor: 'rgba(239, 68, 68, 0.3)', shadowBlur: 8, shadowOffsetY: 4 },
        data: cnShareData
      },
      {
        name: '同比增速%',
        type: 'line',
        yAxisIndex: 2,
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 2, type: 'dashed' },
        data: cnYoyData
      }
    ]
  }
})

// ============== Chart 2：头部集中度 ==============
const topChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  
  const top1ShareData = xLabels.map(k => rawDict.value[k]['Top1_市占率%'] || 0)
  const top2ShareData = xLabels.map(k => rawDict.value[k]['Top2_市占率%'] || 0)
  const top3ShareData = xLabels.map(k => rawDict.value[k]['Top3_市占率%'] || 0)
  const top4ShareData = xLabels.map(k => rawDict.value[k]['Top4_市占率%'] || 0)
  const top5ShareData = xLabels.map(k => rawDict.value[k]['Top5_市占率%'] || 0)
  
  // 计算 Top5 总份额用于显示在柱子顶部
  const top5SumData = xLabels.map(k => {
    const d = rawDict.value[k] || {}
    const sum = (d['Top1_市占率%'] || 0) + (d['Top2_市占率%'] || 0) + (d['Top3_市占率%'] || 0) + (d['Top4_市占率%'] || 0) + (d['Top5_市占率%'] || 0)
    return Number(sum.toFixed(1))
  })
  
  // HHI 指数
  const hhiData = xLabels.map(k => rawDict.value[k]['市场集中度_HHI'] || 0)

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
        
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px; color: #0f172a;">${d.year}年${d.month}月 市场集中度</div>`
        
        // 渲染动态 Top5 品牌名称及其市场份额
        if (d['Top1_品牌']) {
          html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:4px;"></span>1. ${d['Top1_品牌']}</span>
            <span style="font-weight:600">${d['Top1_市占率%'] || 0}%</span>
          </div>`
        }
        if (d['Top2_品牌']) {
          html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;margin-right:4px;"></span>2. ${d['Top2_品牌']}</span>
            <span style="font-weight:600">${d['Top2_市占率%'] || 0}%</span>
          </div>`
        }
        if (d['Top3_品牌']) {
          html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#06b6d4;margin-right:4px;"></span>3. ${d['Top3_品牌']}</span>
            <span style="font-weight:600">${d['Top3_市占率%'] || 0}%</span>
          </div>`
        }
        if (d['Top4_品牌']) {
          html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span>4. ${d['Top4_品牌']}</span>
            <span style="font-weight:600">${d['Top4_市占率%'] || 0}%</span>
          </div>`
        }
        if (d['Top5_品牌']) {
          html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:4px;"></span>5. ${d['Top5_品牌']}</span>
            <span style="font-weight:600">${d['Top5_市占率%'] || 0}%</span>
          </div>`
        }
        
        let top5Sum = (d['Top1_市占率%'] || 0) + (d['Top2_市占率%'] || 0) + (d['Top3_市占率%'] || 0) + (d['Top4_市占率%'] || 0) + (d['Top5_市占率%'] || 0)
        html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px; margin-bottom: 4px;">
            <span style="font-weight:bold;">Top 5 品牌总份额</span>
            <span style="font-weight:bold; color:#0f172a;">${top5Sum.toFixed(1)}%</span>
        </div>`
        
        const hhi = d['市场集中度_HHI']
        if (hhi) {
           html += `<div style="display:flex; justify-content:space-between; gap:20px; font-size:12px; color:#64748b; margin-top:6px;">
             <span>市场 HHI 指数</span>
             <span>${parseInt(hhi)}</span>
           </div>`
        }

        return html
      }
    },
    legend: { 
      data: ['Top 1', 'Top 2', 'Top 3', 'Top 4', 'Top 5', 'HHI 指数'], 
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
        name: '市场份额 (%)',
        max: 100,
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: 'HHI',
        axisLabel: { show: false }, // 隐藏 HHI 刻度，靠 tooltip 看
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Top 1',
        type: 'bar',
        stack: 'topShare',
        barWidth: '40%',
        itemStyle: { color: '#3b82f6' },
        data: top1ShareData,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.08)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: 'Top 2',
        type: 'bar',
        stack: 'topShare',
        barWidth: '40%',
        itemStyle: { color: '#8b5cf6' },
        data: top2ShareData
      },
      {
        name: 'Top 3',
        type: 'bar',
        stack: 'topShare',
        barWidth: '40%',
        itemStyle: { color: '#06b6d4' },
        data: top3ShareData
      },
      {
        name: 'Top 4',
        type: 'bar',
        stack: 'topShare',
        barWidth: '40%',
        itemStyle: { color: '#10b981' },
        data: top4ShareData
      },
      {
        name: 'Top 5',
        type: 'bar',
        stack: 'topShare',
        barWidth: '40%',
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        data: top5ShareData
      },
      {
        name: 'HHI 指数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        itemStyle: { color: '#cbd5e1' },
        lineStyle: { width: 2, type: 'dashed' },
        data: hhiData
      },
      {
        name: 'Top 5 总份额',
        type: 'bar',
        barGap: '-100%',
        barWidth: '40%',
        itemStyle: { color: 'transparent' },
        data: top5SumData,
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'bold',
          formatter: '{c}%'
        }
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country], fetchData, { immediate: true })
</script>
