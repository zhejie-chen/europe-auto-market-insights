<template>
  <div class="flex flex-col w-full h-full relative gap-6">
    
    <!-- 加载态 -->
    <div v-if="loading" class="h-full flex flex-col justify-center items-center text-slate-400 gap-2 absolute inset-0 bg-white/50 z-10">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
      <span class="text-xs">加载结构数据...</span>
    </div>

    <!-- Chart 1：车型形态结构 (Body Types) -->
    <div class="flex-1 flex flex-col min-h-[220px]">
      <div class="flex items-center gap-2 mb-2 pl-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">车型销量构成 (SUV vs 轿车)</h4>
      </div>
      <v-chart class="w-full flex-1" v-if="bodyChartOptions" :option="bodyChartOptions" autoresize :key="'body-' + chartKey" />
    </div>

    <!-- 中间分割线 -->
    <div class="w-full h-px bg-slate-100"></div>

    <!-- Chart 2：能源结构 (Power Types) -->
    <div class="flex-1 flex flex-col min-h-[220px]">
      <div class="flex items-center gap-2 mb-2 pl-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">新能源结构构成 (BEV vs PHEV)</h4>
      </div>
      <v-chart class="w-full flex-1" v-if="powerChartOptions" :option="powerChartOptions" autoresize :key="'power-' + chartKey" />
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent])

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  country: { type: String, required: true }
})

const loading = ref(true)
const rawDict = ref({})
const timeSeries = ref([])
const chartKey = ref(0)

const fetchData = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('year, month, metric_name, metric_value')
    .eq('dimension_level', '国家')
    .eq('country', props.country)
    .gte('year', props.year - 1)
    .in('metric_name', [
      '总销量', 
      'SUV_销量', 
      '轿车_销量', 
      'BEV_销量', 
      'PHEV_销量'
    ])

  if (error || !data) {
    console.error("加载国家宏观结构数据失败：", error)
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
    dict[key][row.metric_name] = Number(row.metric_value) || 0
  })

  timeSeries.value = Object.keys(dict).sort((a, b) => {
    const [yA, mA] = a.split('-').map(Number)
    const [yB, mB] = b.split('-').map(Number)
    if (yA !== yB) return yA - yB
    return mA - mB
  })
  
  rawDict.value = dict
  chartKey.value++
  loading.value = false
}

// =============== 共用常量与 12个月视窗切割 ===============
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

// ============== 车型构成图表 (Body Types) ==============
const bodyChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  const suvData = xLabels.map(k => rawDict.value[k]['SUV_销量'] || 0)
  const sedanData = xLabels.map(k => rawDict.value[k]['轿车_销量'] || 0)
  const otherBodyData = xLabels.map(k => {
    const total = rawDict.value[k]['总销量'] || 0
    const suv = rawDict.value[k]['SUV_销量'] || 0
    const sedan = rawDict.value[k]['轿车_销量'] || 0
    return Math.max(0, total - suv - sedan)
  })

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
        const total = d['总销量'] || 0
        const suv = d['SUV_销量'] || 0
        const sedan = d['轿车_销量'] || 0
        const other = Math.max(0, total - suv - sedan)
        
        const suvRatio = total > 0 ? ((suv / total) * 100).toFixed(1) + '%' : '-'
        const sedanRatio = total > 0 ? ((sedan / total) * 100).toFixed(1) + '%' : '-'
        
        return `
          <div style="font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">${d.year}年${d.month}月 车型结构</div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; margin-bottom:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:4px;"></span>SUV销量 (${suvRatio})</span>
             <span style="font-weight:bold; margin-left:16px;">${suv.toLocaleString()}</span>
          </div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; margin-bottom:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;margin-right:4px;"></span>轿车销量 (${sedanRatio})</span>
             <span style="font-weight:bold; margin-left:16px;">${sedan.toLocaleString()}</span>
          </div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; color:#94a3b8; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;margin-right:4px;"></span>其他车型</span>
             <span style="font-weight:bold;">${other.toLocaleString()}</span>
          </div>
        `
      }
    },
    legend: { data: ['SUV', '轿车', '其他车型'], bottom: 0, icon: 'circle', itemHeight: 8 },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
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
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'SUV',
        type: 'bar',
        stack: 'bodyType',
        barWidth: '40%',
        itemStyle: { color: '#3b82f6' },
        data: suvData,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.08)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: '轿车',
        type: 'bar',
        stack: 'bodyType',
        barWidth: '40%',
        itemStyle: { color: '#8b5cf6' },
        data: sedanData
      },
      {
        name: '其他车型',
        type: 'bar',
        stack: 'bodyType',
        barWidth: '40%',
        itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] },
        data: otherBodyData
      }
    ]
  }
})

// ============== 能源结构图表 (Power Types) ==============
const powerChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  const bevData = xLabels.map(k => rawDict.value[k]['BEV_销量'] || 0)
  const phevData = xLabels.map(k => rawDict.value[k]['PHEV_销量'] || 0)
  const otherPowerData = xLabels.map(k => {
    const total = rawDict.value[k]['总销量'] || 0
    const bev = rawDict.value[k]['BEV_销量'] || 0
    const phev = rawDict.value[k]['PHEV_销量'] || 0
    return Math.max(0, total - bev - phev)
  })

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
        const total = d['总销量'] || 0
        const bev = d['BEV_销量'] || 0
        const phev = d['PHEV_销量'] || 0
        const other = Math.max(0, total - bev - phev)
        
        const bevRatio = total > 0 ? ((bev / total) * 100).toFixed(1) + '%' : '-'
        const phevRatio = total > 0 ? ((phev / total) * 100).toFixed(1) + '%' : '-'
        
        return `
          <div style="font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">${d.year}年${d.month}月 能源结构</div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; margin-bottom:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span>BEV纯电 (${bevRatio})</span>
             <span style="font-weight:bold; margin-left:16px;">${bev.toLocaleString()}</span>
          </div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; margin-bottom:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#06b6d4;margin-right:4px;"></span>PHEV插混 (${phevRatio})</span>
             <span style="font-weight:bold; margin-left:16px;">${phev.toLocaleString()}</span>
          </div>
          <div style="font-size: 13px; display:flex; justify-content:space-between; color:#94a3b8; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
             <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#cbd5e1;margin-right:4px;"></span>内燃机与其他</span>
             <span style="font-weight:bold;">${other.toLocaleString()}</span>
          </div>
        `
      }
    },
    legend: { data: ['BEV', 'PHEV', '其他动力'], bottom: 0, icon: 'circle', itemHeight: 8 },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
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
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'BEV',
        type: 'bar',
        stack: 'powerType',
        barWidth: '40%',
        itemStyle: { color: '#10b981' },
        data: bevData,
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(245, 158, 11, 0.08)' },
          data: [ [ { xAxis: highlightLabel }, { xAxis: highlightLabel } ] ]
        }
      },
      {
        name: 'PHEV',
        type: 'bar',
        stack: 'powerType',
        barWidth: '40%',
        itemStyle: { color: '#06b6d4' },
        data: phevData
      },
      {
        name: '其他动力',
        type: 'bar',
        stack: 'powerType',
        barWidth: '40%',
        itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] },
        data: otherPowerData
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country], fetchData, { immediate: true })
</script>
