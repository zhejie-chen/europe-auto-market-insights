<template>
  <div class="flex flex-col w-full h-full relative gap-8">
    
    <!-- 加载态 -->
    <div v-if="loading" class="h-full flex flex-col justify-center items-center text-slate-400 gap-2 absolute inset-0 bg-white/50 z-10">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <span class="text-xs">加载集团总体数据...</span>
    </div>

    <!-- 顶部核心KPI卡片区 -->
    <div class="flex items-center gap-4 px-2" v-if="!loading && topData">
      <div class="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex-1 flex flex-col">
        <span class="text-xs font-bold text-indigo-400">当月市场第一集团</span>
        <div class="flex items-end justify-between mt-1">
          <span class="text-lg font-black text-indigo-700">{{ topData.salesTopName || '-' }}</span>
          <span class="text-sm font-bold text-slate-600">{{ topData.salesTopVol ? topData.salesTopVol.toLocaleString() : 0 }} 辆</span>
        </div>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex-1 flex flex-col">
        <span class="text-xs font-bold text-emerald-400">当月新能源第一集团</span>
        <div class="flex items-end justify-between mt-1">
          <span class="text-lg font-black text-emerald-700">{{ topData.nevTopName || '-' }}</span>
          <span class="text-sm font-bold text-slate-600">{{ topData.nevTopVol ? topData.nevTopVol.toLocaleString() : 0 }} 辆</span>
        </div>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex-1 flex flex-col">
        <span class="text-xs font-bold text-amber-500">电动化转型先锋 (非纯电品牌)</span>
        <div class="flex items-end justify-between mt-1">
          <span class="text-lg font-black text-amber-700">{{ topData.penTopName || '-' }}</span>
          <span class="text-sm font-bold text-slate-600">渗透率 {{ topData.penTopVal || 0 }}%</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[350px]">
      
      <!-- Chart 1: 集团销量与增速 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2 pl-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <h4 class="text-sm font-bold text-slate-600">主力集团销量与同比变化 (Top 12)</h4>
        </div>
        <v-chart class="w-full flex-1 min-h-[300px]" v-if="salesChartOptions" :option="salesChartOptions" autoresize :key="'sales-' + chartKey" />
      </div>

      <!-- Chart 2: 集团新能源表现 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center gap-2 mb-2 pl-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <h4 class="text-sm font-bold text-slate-600">主力集团新能源放量与渗透率 (按新能源销量倒序)</h4>
        </div>
        <v-chart class="w-full flex-1 min-h-[300px]" v-if="nevChartOptions" :option="nevChartOptions" autoresize :key="'nev-' + chartKey" />
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
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent])

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  country: { type: String, required: true }
})

const loading = ref(true)
const groupDataMap = ref({})
const chartKey = ref(0)
const topData = ref(null)

const fetchData = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('group_name, metric_name, metric_value')
    .eq('dimension_level', '集团')
    .eq('country', props.country)
    .eq('year', props.year)
    .eq('month', props.month)
    .in('metric_name', [
      '销量', 
      '同比增速%', 
      '新能源销量', 
      '新能源_渗透率%'
    ])

  if (error) {
    console.error("加载集团总体数据失败：", error)
    loading.value = false
    return
  }

  const map = {}
  data.forEach(d => {
    if (!d.group_name || d.group_name === 'ALL' || d.group_name === 'Unknown') return
    
    if (!map[d.group_name]) {
      map[d.group_name] = { name: d.group_name, sales: 0, yoy: 0, nev: 0, pen: 0 }
    }
    
    const val = Number(d.metric_value) || 0
    if (d.metric_name === '销量') map[d.group_name].sales = val
    if (d.metric_name === '同比增速%') map[d.group_name].yoy = val
    if (d.metric_name === '新能源销量') map[d.group_name].nev = val
    if (d.metric_name === '新能源_渗透率%') map[d.group_name].pen = val
  })

  groupDataMap.value = map

  // 计算顶部简报数据
  const list = Object.values(map)
  if (list.length > 0) {
    const listBySales = [...list].sort((a, b) => b.sales - a.sales)
    const listByNev = [...list].sort((a, b) => b.nev - a.nev)
    // 对于转型先锋，找一个不是纯电起家（非渗透率永远100%比如特斯拉）但是渗透率很高的
    // 这里简单找销量>1000 且 渗透率<100 且 渗透率最大的前三名中的第一名，如果没有就取渗透率最高的
    const penCandidates = list.filter(d => d.sales > 500 && d.pen < 99).sort((a, b) => b.pen - a.pen)
    
    topData.value = {
      salesTopName: listBySales[0]?.name,
      salesTopVol: listBySales[0]?.sales,
      nevTopName: listByNev[0]?.name,
      nevTopVol: listByNev[0]?.nev,
      penTopName: penCandidates.length > 0 ? penCandidates[0].name : (list.sort((a,b)=>b.pen-a.pen)[0]?.name),
      penTopVal: penCandidates.length > 0 ? penCandidates[0].pen : (list.sort((a,b)=>b.pen-a.pen)[0]?.pen)
    }
  }

  chartKey.value++
  loading.value = false
}

// 销量与增速 (取 Top 12)
const salesChartOptions = computed(() => {
  const list = Object.values(groupDataMap.value).sort((a, b) => b.sales - a.sales).slice(0, 12)
  if (list.length === 0) return null

  const xLabels = list.map(d => d.name)
  const salesData = list.map(d => d.sales)
  const yoyData = list.map(d => d.yoy)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' },
      formatter: (params) => {
        const name = params[0].axisValue
        const sales = params[0].value
        const yoy = params[1].value
        const yoyColor = yoy >= 0 ? '#10b981' : '#f43f5e'
        
        return `
          <div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px; color: #0f172a;">${name}</div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6366f1;margin-right:4px;"></span>总销量</span>
            <span style="font-weight:bold">${sales.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
            <span>📈 同比增速</span>
            <span style="font-weight:bold; color:${yoyColor}">${yoy > 0 ? '+' : ''}${yoy}%</span>
          </div>
        `
      }
    },
    legend: { data: ['总销量', '同比增速%'], bottom: 0, icon: 'circle', itemHeight: 8 },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { interval: 0, rotate: 30, color: '#64748b', fontSize: 11, width: 80, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
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
        show: false
      }
    ],
    series: [
      {
        name: '总销量',
        type: 'bar',
        barWidth: '45%',
        itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
        data: salesData
      },
      {
        name: '同比增速%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        itemStyle: { color: '#10b981' },
        lineStyle: { width: 2, type: 'dashed' },
        data: yoyData
      }
    ]
  }
})

// 新能源销量与渗透率 (取 Top 12)
const nevChartOptions = computed(() => {
  const list = Object.values(groupDataMap.value).sort((a, b) => b.nev - a.nev).slice(0, 12)
  if (list.length === 0) return null

  const xLabels = list.map(d => d.name)
  const nevData = list.map(d => d.nev)
  const penData = list.map(d => d.pen)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' },
      formatter: (params) => {
        const name = params[0].axisValue
        const nev = params[0].value
        const pen = params[1].value
        
        return `
          <div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px; color: #0f172a;">${name}</div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; margin-bottom:4px;">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:4px;"></span>新能源销量</span>
            <span style="font-weight:bold">${nev.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; gap:20px; font-size:13px; border-top: 1px dashed #e2e8f0; padding-top:4px; margin-top:4px;">
            <span>⚡ 新能源渗透率</span>
            <span style="font-weight:bold; color:#ef4444">${pen}%</span>
          </div>
        `
      }
    },
    legend: { data: ['新能源销量', '渗透率%'], bottom: 0, icon: 'circle', itemHeight: 8 },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { interval: 0, rotate: 30, color: '#64748b', fontSize: 11, width: 80, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
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
        name: '百分比',
        show: false
      }
    ],
    series: [
      {
        name: '新能源销量',
        type: 'bar',
        barWidth: '45%',
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        data: nevData
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
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country], fetchData, { immediate: true })
</script>
