<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" @click.self="closeModal">
        <div class="bg-white w-11/12 max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
          
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ entityName }} 详细数据分析</h3>
              <p class="text-sm text-slate-500 mt-1">月度同环比趋势 与 年度累计 (YTD) 表现 {{ entityType !== 'Country' ? `(${marketScope})` : '' }}</p>
            </div>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div class="p-6 h-[500px] flex flex-col lg:flex-row gap-8">
            
            <div class="flex-1 w-full h-full relative">
              <div class="absolute top-0 left-0 text-sm font-bold text-slate-700 z-10">月度销量与同环比波动</div>
              <v-chart v-if="monthlyData.length > 0" class="h-full w-full pt-6" :option="leftChartOption" autoresize />
              <div v-else class="h-full flex items-center justify-center text-slate-400">数据加载中...</div>
            </div>

            <div class="w-full lg:w-1/3 h-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 relative">
              <div class="absolute top-0 left-0 lg:left-8 text-sm font-bold text-slate-700 z-10">1-{{ selectedMonth }}月 累计销量对比</div>
              <v-chart v-if="ytdData.length > 0" class="h-full w-full pt-6" :option="rightChartOption" autoresize />
            </div>

          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, MarkAreaComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, MarkAreaComponent])

const props = defineProps({
  isOpen: Boolean,
  entityType: String,
  entityName: String,
  marketScope: String,
  selectedYear: Number,
  selectedMonth: Number
})

const emit = defineEmits(['close'])
const monthlyData = ref([])
const ytdData = ref([])

const displayYears = computed(() => {
  if (props.selectedYear <= 2025) return [2023, 2024, 2025]
  return [2024, 2025, 2026]
})

const closeModal = () => emit('close')

// =======================
// 图表 1：左侧月度复合图 (柱状+双曲线)
// =======================
const leftChartOption = computed(() => {
  if (monthlyData.value.length === 0) return {}
  
  const xAxisData = monthlyData.value.map(d => `${d.year.toString().slice(-2)}/${d.month.toString().padStart(2, '0')}`)
  const currentLabel = `${props.selectedYear.toString().slice(-2)}/${props.selectedMonth.toString().padStart(2, '0')}`
  
  const targetIndex = xAxisData.indexOf(currentLabel)
  const dataLen = xAxisData.length
  let startZoom = 0; let endZoom = dataLen > 0 ? dataLen - 1 : 0;
  
  if (dataLen > 12) {
    if (targetIndex !== -1) {
      startZoom = targetIndex - 5; endZoom = targetIndex + 6;
      if (endZoom >= dataLen) { endZoom = dataLen - 1; startZoom = Math.max(0, endZoom - 11); }
      if (startZoom < 0) { startZoom = 0; endZoom = Math.min(dataLen - 1, 11); }
    } else {
      startZoom = Math.max(0, dataLen - 12); endZoom = dataLen - 1;
    }
  }

  return {
    tooltip: { 
      trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', borderWidth: 1, textStyle: { color: '#334155' },
      formatter: (params) => {
        let html = `<div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach(p => {
          const valStr = p.seriesName.includes('变化') ? `${p.value}%` : p.value.toLocaleString()
          html += `<div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px; font-size: 13px;">
                     <span>${p.marker} ${p.seriesName}</span>
                     <span style="font-weight: bold;">${valStr}</span>
                   </div>`
        })
        return html
      }
    },
    legend: { data: ['当月销量', '同比变化 (YoY)', '环比变化 (MoM)'], bottom: 0, itemGap: 20, icon: 'circle', textStyle: { fontSize: 12, color: '#64748b' } },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', data: xAxisData, axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { formatter: (value) => value === currentLabel ? `{active|${value}}` : value, rich: { active: { color: '#d97706', fontWeight: 'bold', fontSize: 13 } } }
    },
    yAxis: [
      { type: 'value', name: '销量 (辆)', nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: '#64748b' } },
      { type: 'value', name: '变化率', nameTextStyle: { color: '#94a3b8' }, splitLine: { show: false }, axisLabel: { formatter: '{value}%', color: '#64748b' } }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, startValue: startZoom, endValue: endZoom },
      { type: 'slider', xAxisIndex: 0, height: 10, bottom: '8%', borderColor: '#e2e8f0', backgroundColor: '#f8fafc', handleSize: '150%', startValue: startZoom, endValue: endZoom }
    ],
    series: [
      {
        name: '当月销量', type: 'bar', data: monthlyData.value.map(d => d.units),
        yAxisIndex: 0, barWidth: '40%', itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        // 绝对安全的高亮背景写法，依托于基础柱状图
        markArea: { silent: true, itemStyle: { color: 'rgba(245, 158, 11, 0.12)' }, data: [ [{ xAxis: currentLabel }, { xAxis: currentLabel }] ] }
      },
      { name: '同比变化 (YoY)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, data: monthlyData.value.map(d => d.yoy), itemStyle: { color: '#ef4444' }, lineStyle: { width: 3, shadowColor: 'rgba(239, 68, 68, 0.3)', shadowBlur: 10, shadowOffsetY: 5 } },
      { name: '环比变化 (MoM)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, data: monthlyData.value.map(d => d.mom), itemStyle: { color: '#10b981' }, lineStyle: { width: 3, shadowColor: 'rgba(16, 185, 129, 0.3)', shadowBlur: 10, shadowOffsetY: 5 } }
    ]
  }
})

// =======================
// 图表 2：右侧年度累计 YTD 图
// =======================
const rightChartOption = computed(() => {
  if (ytdData.value.length === 0) return {}

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: ytdData.value.map(d => `${d.year}年`), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
    series: [{
      type: 'bar', barWidth: '50%',
      data: ytdData.value.map(d => ({ value: d.units, yoy: d.yoy })),
      itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] },
      label: {
        show: true, position: 'top',
        formatter: (p) => {
          let res = `{units|${p.data.value.toLocaleString()}}`
          if (p.data.yoy !== null) {
             const colorClass = p.data.yoy >= 0 ? 'red' : 'green'
             const arrow = p.data.yoy >= 0 ? '▲' : '▼'
             res += `\n{${colorClass}|${arrow} ${Math.abs(p.data.yoy)}%}`
          }
          return res
        },
        rich: {
          units: { color: '#334155', fontWeight: 'bold', fontSize: 13, padding: [0, 0, 4, 0] },
          red: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
          green: { color: '#10b981', fontWeight: 'bold', fontSize: 12 }
        }
      }
    }]
  }
})

// =======================
// 数据获取与严密聚合逻辑
// =======================
const fetchHistoricalData = async () => {
  if (!props.isOpen || !props.entityName) return
  
  monthlyData.value = []
  ytdData.value = []

  // minYear 是显示年份的前一年，为了能算出展示的第一年的 YoY
  const minYear = displayYears.value[0] - 1 
  const maxYear = props.selectedYear + 1 // 为了获取 ly 修正值

  let query = null
  if (props.entityType === 'Country') {
    query = supabase.from('market_power_source_registrations')
      .select('report_year, report_month, monthly_units_cy, monthly_units_ly')
      .gte('report_year', minYear).lte('report_year', maxYear)
      .eq('market_name', props.entityName).eq('power_source', 'TOTAL')
  } else {
    query = supabase.from('manufacturer_regional_registrations')
      .select('report_year, report_month, parent_group, brand, monthly_units_cy, monthly_units_ly')
      .gte('report_year', minYear).lte('report_year', maxYear)
      .eq('region_scope', props.marketScope)
    
    if (props.entityType === 'Group') {
      query = query.eq('parent_group', props.entityName).eq('brand', props.entityName)
    } else {
      query = query.eq('brand', props.entityName)
    }
  }

  const { data } = await query
  if (data) {
    const rawMap = {}
    data.forEach(row => {
      if(!rawMap[row.report_year]) rawMap[row.report_year] = {}
      if(!rawMap[row.report_year][row.report_month]) rawMap[row.report_year][row.report_month] = { cy: 0, ly: 0, hasData: true }
      rawMap[row.report_year][row.report_month].cy += (row.monthly_units_cy || 0)
      rawMap[row.report_year][row.report_month].ly += (row.monthly_units_ly || 0)
    })

    const timeSeries = []
    
    // 1. 整理出有序的时间线数组 (一直提取到选中的年月)
    for (let y = minYear; y <= props.selectedYear; y++) {
      for (let m = 1; m <= 12; m++) {
        // 砍掉未来的月份
        if (y === props.selectedYear && m > props.selectedMonth) continue

        const hasNext = rawMap[y + 1]?.[m]?.hasData
        const hasCurr = rawMap[y]?.[m]?.hasData
        
        if (!hasCurr && !hasNext) continue
        
        const units = hasNext ? rawMap[y + 1][m].ly : rawMap[y][m].cy
        if (units > 0) timeSeries.push({ year: y, month: m, units })
      }
    }

    // 2. 遍历计算月度同环比
    timeSeries.forEach((item, index) => {
      // 环比 (MoM)
      if (index > 0) {
        const prev = timeSeries[index - 1]
        if ((item.year === prev.year && item.month === prev.month + 1) || (item.year === prev.year + 1 && item.month === 1 && prev.month === 12)) {
          item.mom = Number(((item.units - prev.units) / prev.units * 100).toFixed(1))
        } else item.mom = null
      } else item.mom = null

      // 同比 (YoY)
      const lastYearItem = timeSeries.find(t => t.year === item.year - 1 && t.month === item.month)
      item.yoy = lastYearItem ? Number(((item.units - lastYearItem.units) / lastYearItem.units * 100).toFixed(1)) : null
    })

    monthlyData.value = timeSeries

    // 3. 计算极其严谨的 YTD (年度累计至选中月) 数据
    const ytdMap = {}
    for (let y = minYear; y <= props.selectedYear; y++) {
      let sum = 0
      // 严格截止到 selectedMonth，保证对比的公平性
      for (let m = 1; m <= props.selectedMonth; m++) {
        const row = timeSeries.find(t => t.year === y && t.month === m)
        if (row) sum += row.units
      }
      ytdMap[y] = sum
    }

    const ytdResult = []
    displayYears.value.forEach(y => {
      if (y <= props.selectedYear) {
        const units = ytdMap[y] || 0
        const lastUnits = ytdMap[y - 1] || 0
        const yoy = lastUnits > 0 ? Number(((units - lastUnits) / lastUnits * 100).toFixed(1)) : null
        ytdResult.push({ year: y, units, yoy })
      } else {
        // 如果选择的是2025，但展示年份要显示26，则填充空数据占位
        ytdResult.push({ year: y, units: 0, yoy: null })
      }
    })

    ytdData.value = ytdResult
  }
}

watch(() => props.isOpen, fetchHistoricalData)
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes scaleUp {
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
</style>