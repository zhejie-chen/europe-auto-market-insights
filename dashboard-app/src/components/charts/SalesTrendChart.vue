<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md flex flex-col h-full">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
        大盘月度销量对比 
        <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
          <button @click="marketScope = 'EUROPEAN UNION'" :class="marketScope === 'EUROPEAN UNION' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">
            EU
          </button>
          <button @click="marketScope = 'EU + EFTA + UK'" :class="marketScope === 'EU + EFTA + UK' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">
            EU+EFTA+UK
          </button>
        </div>
      </h2>
      <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-md">
        <span class="inline-block w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/50"></span> 当前选中月份背景
      </div>
    </div>
    <div class="flex-1 min-h-[380px]">
      <v-chart :key="displayYears.join('-') + '-' + marketScope" class="h-full w-full" :option="chartOption" autoresize />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, TooltipComponent, LegendComponent, GridComponent, MarkAreaComponent])

const props = defineProps({ selectedYear: Number, selectedMonth: Number })
const marketScope = ref('EUROPEAN UNION')
const monthlySalesData = ref({})

const displayYears = computed(() => {
  if (props.selectedYear <= 2025) return [2023, 2024, 2025]
  return [2024, 2025, 2026]
})

const colorPalette = ['#94a3b8', '#38bdf8', '#2563eb']

const chartOption = computed(() => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const currentMonthLabel = `${props.selectedMonth}月`

  const series = displayYears.value.map((year, index) => {
    const s = {
      name: `${year}年`, 
      type: 'bar', 
      barGap: '15%',
      data: months.map(month => monthlySalesData.value[year]?.[month] || 0),
      itemStyle: { color: colorPalette[index], borderRadius: [4, 4, 0, 0] }
    }
    if (index === 0) {
      s.markArea = {
        silent: true,
        itemStyle: { color: 'rgba(245, 158, 11, 0.12)' },
        data: [ [ { xAxis: currentMonthLabel }, { xAxis: currentMonthLabel } ] ]
      }
    }
    return s
  })

  return {
    color: colorPalette,
    tooltip: { 
      trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', borderWidth: 1, padding: 16, textStyle: { color: '#334155' },
      formatter: (params) => {
        const monthNum = parseInt(params[0].axisValue)
        params.sort((a, b) => parseInt(a.seriesName) - parseInt(b.seriesName))
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px; color: #0f172a; font-size: 15px;">${monthNum}月 销量详情</div>`
        params.forEach(p => {
          const year = parseInt(p.seriesName); const val = p.value; const lastYearVal = monthlySalesData.value[year - 1]?.[monthNum]
          let yoyText = '-'; if (lastYearVal) { const yoy = ((val - lastYearVal) / lastYearVal * 100).toFixed(1); yoyText = yoy >= 0 ? `<span style="color:#ef4444; font-weight:600;">▲${yoy}%</span>` : `<span style="color:#22c55e; font-weight:600;">▼${Math.abs(yoy)}%</span>` }
          let prevMonthVal = monthNum === 1 ? monthlySalesData.value[year - 1]?.[12] : monthlySalesData.value[year]?.[monthNum - 1]
          let momText = '-'; if (prevMonthVal) { const mom = ((val - prevMonthVal) / prevMonthVal * 100).toFixed(1); momText = mom >= 0 ? `<span style="color:#ef4444; font-weight:600;">▲${mom}%</span>` : `<span style="color:#22c55e; font-weight:600;">▼${Math.abs(mom)}%</span>` }
          html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 14px;"><span>${p.marker} ${year}年</span><span style="font-weight: 600;">${val.toLocaleString()}</span></div><div style="font-size: 12px; color: #64748b; margin-left: 16px; margin-bottom: 12px;">同比: ${yoyText} &nbsp;&nbsp; 环比: ${momText}</div>`
        })
        return html
      }
    },
    legend: { data: displayYears.value.map(y => `${y}年`), bottom: 0 },
    grid: { left: '2%', right: '2%', bottom: '10%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: months.map(m => `${m}月`), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { color: '#64748b' } },
    series: series
  }
})

const fetchData = async () => {
  const minYear = displayYears.value[0] - 1
  const maxYear = displayYears.value[displayYears.value.length - 1]
  
  // 核心：查询范围向后多延伸 1 年，用于拿最新发布的 ly 修正数据
  const queryYears = []
  for(let i = minYear; i <= maxYear + 1; i++) queryYears.push(i)

  const { data: salesRes } = await supabase
    .from('market_power_source_registrations')
    .select('report_year, report_month, monthly_units_cy, monthly_units_ly')
    .in('report_year', queryYears)
    .ilike('market_name', marketScope.value === 'EUROPEAN UNION' ? '%EUROPEAN UNION%' : '%EU%EFTA%UK%')
    .ilike('power_source', '%TOTAL%')
  
  if (salesRes) {
    const rawMap = {}
    salesRes.forEach(row => {
      if(!rawMap[row.report_year]) rawMap[row.report_year] = {}
      if(!rawMap[row.report_year][row.report_month]) rawMap[row.report_year][row.report_month] = { cy: 0, ly: 0, hasData: true }
      rawMap[row.report_year][row.report_month].cy += (row.monthly_units_cy || 0)
      rawMap[row.report_year][row.report_month].ly += (row.monthly_units_ly || 0)
    })

    const grouped = {}
    // 遍历我们需要显示的年份
    for(let y = minYear; y <= maxYear; y++) {
      grouped[y] = {}
      for(let m = 1; m <= 12; m++) {
        const nextYearRow = rawMap[y + 1]?.[m]
        const currYearRow = rawMap[y]?.[m]
        
        // 数据采信逻辑：如果存在次年同月的数据，直接采用次年记录的 ly 作为权威数据；否则使用当年的 cy
        if (nextYearRow && nextYearRow.hasData) {
          grouped[y][m] = nextYearRow.ly
        } else if (currYearRow && currYearRow.hasData) {
          grouped[y][m] = currYearRow.cy
        } else {
          grouped[y][m] = 0
        }
      }
    }
    monthlySalesData.value = grouped
  }
}

watch([() => props.selectedYear, () => props.selectedMonth, marketScope], fetchData)
onMounted(fetchData)
</script>