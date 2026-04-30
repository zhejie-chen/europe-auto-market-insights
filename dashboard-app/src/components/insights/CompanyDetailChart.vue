<template>
  <div class="flex flex-col w-full h-full relative gap-6">
    <!-- 加载态 -->
    <div v-if="loading" class="h-full flex flex-col justify-center items-center text-slate-400 gap-2 absolute inset-0 bg-white/50 z-10">
      <div class="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
      <span class="text-xs">加载车企体量与结构数据...</span>
    </div>

    <!-- 顶部标题与视图切换卡 -->
    <div class="flex items-center justify-between mb-0 pl-2 pr-2">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        <h4 class="text-sm font-bold text-slate-600">{{ companyName }} 数据洞察</h4>
      </div>
      <!-- 二级图表 / 视图模式切换入口 -->
      <div class="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
         <button 
           @click="viewMode = 'group'"
           class="px-3 py-1 rounded-md transition-colors"
           :class="viewMode === 'group' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-slate-500 hover:text-slate-700'"
         >集团大盘图表</button>
         <button 
           @click="viewMode = 'brands'"
           class="px-3 py-1 rounded-md transition-colors flex items-center gap-1"
           :class="viewMode === 'brands' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-slate-500 hover:text-slate-700'"
         >
           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
           旗下品牌全览
         </button>
      </div>
    </div>

    <!-- 模式 A: 集团总体概览 (原有的三张图表) -->
    <div v-if="viewMode === 'group'" class="flex flex-col gap-6 flex-1">
      
      <!-- 上半部分：集团整体走势 -->
      <div class="flex-1 flex flex-col min-h-[220px]">
        <v-chart class="w-full flex-1 min-h-[200px]" v-if="trendChartOptions" :option="trendChartOptions" autoresize :key="'trend-' + chartKey" />
      </div>

      <!-- 中间分割线 -->
      <div class="w-full h-px bg-slate-100"></div>

      <!-- 下半部分：内部结构 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[180px]">
        <!-- Chart 2：当月品牌主导 -->
        <div class="flex flex-col h-full border-r border-slate-100 pr-4">
          <div class="flex items-center gap-2 mb-2 pl-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11v9h-5v-6h-4v6H5v-9M9 21H5a2 2 0 01-2-2v-9a2 2 0 012-2h4a2 2 0 012 2v9a2 2 0 01-2 2z"></path></svg>
            <h4 class="text-sm font-bold text-slate-600">子品牌销量比重 (Doughnut)</h4>
          </div>
          <v-chart class="w-full flex-1" v-if="brandPieChartOptions" :option="brandPieChartOptions" autoresize :key="'brand-pie-' + chartKey" />
        </div>

        <!-- Chart 3：当月产品结构 (电动化与SUV) -->
        <div class="flex flex-col h-full pl-2">
          <div class="flex items-center gap-2 mb-4 pl-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <h4 class="text-sm font-bold text-slate-600">战略基盘渗透率推进</h4>
          </div>
          
          <div class="flex-1 flex flex-col justify-center gap-6 pr-4">
             <!-- SUV 进度条 -->
             <div class="flex flex-col w-full">
               <div class="flex justify-between items-end mb-1">
                 <span class="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                   <span class="w-2 h-2 rounded-full bg-blue-500"></span> SUV车型占比
                 </span>
                 <span class="text-xs font-bold text-slate-500">{{ curSUVShare }}% <span class="font-normal text-slate-400">({{ curSUVVol.toLocaleString() }} 辆)</span></span>
               </div>
               <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 transition-all duration-1000 ease-out" :style="{ width: curSUVShare + '%' }"></div>
               </div>
             </div>

             <!-- NEV 进度条 -->
             <div class="flex flex-col w-full">
               <div class="flex justify-between items-end mb-1">
                 <span class="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                   <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 新能源(NEV)渗透率
                 </span>
                 <span class="text-xs font-bold text-slate-500">{{ curNEVShare }}% <span class="font-normal text-slate-400">({{ curNEVVol.toLocaleString() }} 辆)</span></span>
               </div>
               <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 transition-all duration-1000 ease-out" :style="{ width: curNEVShare + '%' }"></div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式 B: 旗下品牌详细信息网格 (二级视图入口) -->
    <div v-else class="flex flex-col flex-1 pb-4">
       <div class="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8 content-start h-full max-h-[500px]">
          <!-- 空状态 -->
          <div v-if="detailedBrands.length === 0" class="col-span-1 md:col-span-2 text-center text-slate-400 py-10">
            当月无可下钻的品牌数据
          </div>

          <!-- 牌子卡片 -->
          <div v-for="(b, idx) in detailedBrands" :key="idx" class="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:shadow-md">
             <!-- 顶部条: 牌子名与销量 -->
             <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                <div class="font-black text-slate-800 text-lg flex items-center gap-2">
                   <span class="w-2 h-4 rounded-sm" :class="idx === 0 ? 'bg-rose-500' : 'bg-blue-500'"></span>
                   {{ b.name }}
                </div>
                <div class="flex items-center gap-4 text-xs font-bold">
                   <div class="flex flex-col items-end">
                     <span class="text-slate-400">销量 (辆)</span>
                     <span class="text-slate-800 text-base tabular-nums">{{ b.total.toLocaleString() }}</span>
                   </div>
                </div>
             </div>
             
             <!-- 核心数据条 -->
             <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 rounded-lg p-2 px-3 flex flex-col justify-center">
                  <span class="text-slate-400 font-bold mb-0.5">同比增速</span>
                  <span class="font-black text-sm" :class="b.yoy >= 0 ? 'text-emerald-500' : 'text-rose-500'">{{ b.yoy >= 0 ? '+' : ''}}{{ b.yoy }}%</span>
                </div>
                <div class="bg-slate-50 rounded-lg p-2 px-3 flex flex-col justify-center">
                  <span class="text-slate-400 font-bold mb-0.5">NEV 渗透率</span>
                  <span class="font-black text-sm text-slate-700">{{ b.nev || 0 }}%</span>
                </div>
             </div>

             <!-- 畅销车型 -->
             <div class="flex flex-col gap-1.5 mt-1 border-t border-slate-50 pt-3">
                <span class="text-xs font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  当月核心畅销车型基盘
                </span>
                
                <div v-if="b.m1" class="flex items-center justify-between bg-white border border-slate-100 shadow-sm rounded-md px-3 py-1.5 opacity-90 text-[13px]">
                   <span class="font-bold text-slate-700 flex items-center gap-2"><span class="text-amber-500">🥇</span> {{ b.m1 }}</span>
                   <span class="text-slate-500 font-bold tabular-nums">{{ b.v1.toLocaleString() }}</span>
                </div>
                
                <div v-if="b.m2" class="flex items-center justify-between bg-white border border-slate-100 shadow-sm rounded-md px-3 py-1.5 opacity-90 text-[13px]">
                   <span class="font-bold text-slate-700 flex items-center gap-2"><span class="text-slate-400">🥈</span> {{ b.m2 }}</span>
                   <span class="text-slate-500 font-bold tabular-nums">{{ b.v2.toLocaleString() }}</span>
                </div>

                <div v-if="!b.m1 && !b.m2" class="text-xs text-slate-400 italic py-1 px-2">
                  无车型明细数据披露
                </div>
             </div>
          </div>
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
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, PieChart, TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent])

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  country: { type: String, required: true },
  companyName: { type: String, required: true }
})

const loading = ref(true)
const viewMode = ref('group') // 'group' 或者 'brands'

const rawTrendDict = ref({})
const timeSeries = ref([])
const detailedBrands = ref([])
const chartKey = ref(0)

const curSUVVol = ref(0)
const curSUVShare = ref(0)
const curNEVVol = ref(0)
const curNEVShare = ref(0)

const getAliases = (name) => {
  if (!name) return []
  if (name.includes('上汽')) return ['上汽', '上汽集团', '上海汽车工业(集团)总公司', 'SAIC']
  if (name.includes('丰田')) return ['丰田', '丰田集团', 'Toyota', 'Toyota Group']
  if (name.includes('大众')) return ['大众', '大众集团', 'Volkswagen Group', 'VW Group']
  if (name.includes('比亚迪')) return ['比亚迪', '比亚迪汽车', '比亚迪集团', '比亚迪汽车(BYD)', 'BYD']
  if (name.includes('零跑')) return ['零跑', '零跑汽车', '零跑汽车 (Leapmotor)', 'Leapmotor']
  if (name.includes('宝马')) return ['宝马', '宝马集团', 'BMW Group']
  if (name.includes('吉利')) return ['吉利', '吉利汽车', '吉利控股集团', 'Geely']
  if (name.includes('本田')) return ['本田', '本田集团', 'Honda']
  if (name.includes('福特')) return ['福特', '福特集团', 'Ford']
  if (name.includes('日产')) return ['日产', '日产集团', 'Nissan']
  if (name.includes('通用')) return ['通用', '通用集团', 'General Motors']
  if (name.includes('现代') || name.includes('起亚')) return ['现代-起亚汽车集团', '现代', '起亚', 'Hyundai']
  if (name.includes('斯泰兰蒂斯') || name.toLowerCase().includes('stellantis')) return ['Stellantis']
  return [name]
}

const fetchData = async () => {
  loading.value = true
  const aliases = getAliases(props.companyName)
  
  // 1. 获取过去 12 个月的集团大盘数据
  const { data: trendData } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('year, month, metric_name, metric_value')
    .eq('dimension_level', '集团')
    .in('group_name', aliases)
    .eq('country', props.country)
    .gte('year', props.year - 1)
    .in('metric_name', ['销量', '市占率%'])

  const dict = {}
  if (trendData) {
    trendData.forEach(row => {
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
    rawTrendDict.value = dict
  }

  // 2. 获取当月内部品牌详尽的详情：销，同比，NEV%，Top车型...
  const { data: brandData } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('brand_name, metric_name, metric_value')
    .eq('dimension_level', '品牌')
    .in('group_name', aliases)
    .eq('country', props.country)
    .eq('year', props.year)
    .eq('month', props.month)
    .in('metric_name', ['销量', '同比增速%', '新能源_渗透率%', 'TopModel_1名称', 'TopModel_1销量', 'TopModel_2名称', 'TopModel_2销量'])
    
  if (brandData) {
    const modelMap = {}
    brandData.forEach(d => {
      const b = d.brand_name
      if (!b || b === 'ALL' || b === 'Unknown') return
      
      if (!modelMap[b]) modelMap[b] = { total: 0, yoy: 0, nev: 0, m1: '', v1: 0, m2: '', v2: 0 }
      
      if (d.metric_name === '销量') modelMap[b].total = Number(d.metric_value) || 0
      if (d.metric_name === '同比增速%') modelMap[b].yoy = Number(d.metric_value) || 0
      if (d.metric_name === '新能源_渗透率%') modelMap[b].nev = Number(d.metric_value) || 0
      if (d.metric_name === 'TopModel_1名称') modelMap[b].m1 = d.metric_value
      if (d.metric_name === 'TopModel_1销量') modelMap[b].v1 = Number(d.metric_value) || 0
      if (d.metric_name === 'TopModel_2名称') modelMap[b].m2 = d.metric_value
      if (d.metric_name === 'TopModel_2销量') modelMap[b].v2 = Number(d.metric_value) || 0
    })

    const detailedList = Object.keys(modelMap).map(b => ({
      name: b,
      ...modelMap[b]
    })).sort((a,b) => b.total - a.total)

    // 最多拿前8个最大的品牌进行详尽展示
    detailedBrands.value = detailedList.slice(0, 8)
  } else {
    detailedBrands.value = []
  }

  // 3. 获取当月产品结构数据 (SUV/NEV)
  const { data: structData } = await supabase
    .from('metrics_master_europe_completed_en_2024_2026')
    .select('metric_name, metric_value')
    .eq('dimension_level', '集团')
    .in('group_name', aliases)
    .eq('country', props.country)
    .eq('year', props.year)
    .eq('month', props.month)
    .in('metric_name', ['SUV销量', 'SUV_占比%', '新能源销量', '新能源_渗透率%'])
    
  curSUVVol.value = 0
  curSUVShare.value = 0
  curNEVVol.value = 0
  curNEVShare.value = 0
  
  if (structData) {
    structData.forEach(d => {
      const val = Number(d.metric_value) || 0
      if (d.metric_name === 'SUV销量') curSUVVol.value = val
      if (d.metric_name === 'SUV_占比%') curSUVShare.value = val
      if (d.metric_name === '新能源销量') curNEVVol.value = val
      if (d.metric_name === '新能源_渗透率%') curNEVShare.value = val
    })
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

// 图表1：体量与份额
const trendChartOptions = computed(() => {
  if (timeSeries.value.length === 0) return null

  const { labels: xLabels, highlightLabel } = activeWindowLabels.value
  const salesData = xLabels.map(k => rawTrendDict.value[k]['销量'] || 0)
  const shareData = xLabels.map(k => rawTrendDict.value[k]['市占率%'] || 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' },
      formatter: (params) => {
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">${params[0].axisValue}</div>`
        params.forEach(p => {
          const isShare = p.seriesName === '市占率%'
          const val = isShare ? p.value + '%' : p.value.toLocaleString()
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px;"></span>`
          html += `<div style="display: flex; justify-content: space-between; gap: 24px; font-size: 13px; margin-bottom: 4px;">
            <span>${dot}${p.seriesName}</span>
            <span style="font-weight: 700;">${val}</span>
          </div>`
        })
        return html
      }
    },
    legend: {
      data: ['集团销量', '市占率%'],
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
        rich: { active: { color: '#3b82f6', fontWeight: 'bold' } }
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
      }
    ],
    series: [
      {
        name: '集团销量',
        type: 'bar',
        yAxisIndex: 0,
        barWidth: '35%',
        itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] },
        data: salesData,
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'bold',
          formatter: (p) => p.value ? p.value.toLocaleString() : ''
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(59, 130, 246, 0.08)' },
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
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3, shadowColor: 'rgba(245, 158, 11, 0.3)', shadowBlur: 8, shadowOffsetY: 4 },
        data: shareData
      }
    ]
  }
})

// 图表2在集团模式下的简约版品牌分布图 (Pie)
const brandPieChartOptions = computed(() => {
  if (detailedBrands.value.length === 0) return null

  // 合并尾部品牌
  let displayData = []
  let total = detailedBrands.value.reduce((acc, cur) => acc + cur.total, 0)
  let othersSum = 0
  
  detailedBrands.value.forEach((d, idx) => {
    if (idx < 5 && d.total > total * 0.01) {
      displayData.push({ name: d.name, value: d.total })
    } else {
      othersSum += d.total
    }
  })
  if (othersSum > 0) displayData.push({ name: '其他品牌', value: othersSum })

  // 如果只有一个品牌，直接不显示饼图会有点空，此时环图填满也很直观，我们还是渲染
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#334155' },
      formatter: (params) => {
        return `<div style="font-weight: 700; margin-bottom: 4px;">${params.name}</div>
                <div style="font-size: 13px;">当月销量: <span style="color:#2563eb; font-weight:bold;">${params.value.toLocaleString()} 辆</span></div>
                <div style="font-size: 13px; margin-top:2px;">份额占比: <span style="font-weight:bold;">${params.percent}%</span></div>`
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 'middle',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 11 }
    },
    series: [
      {
        name: '品牌比重',
        type: 'pie',
        radius: ['50%', '80%'], // 经典 Doughnut
        center: ['35%', '50%'],
        data: displayData,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' }
        }
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country, props.companyName], fetchData, { immediate: true })
</script>
