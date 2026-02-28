<template>
  <div class="flex flex-col lg:flex-row gap-8 w-full h-full">
    <div :class="viewMode === 'share' ? 'w-full' : 'flex-1'" class="h-full relative transition-all duration-300">
      <div class="absolute top-0 left-0 flex items-center gap-4 z-10">
        <div class="text-sm font-bold text-slate-700">月度趋势分析</div>
        <div class="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button @click="viewMode = 'volume'" :class="viewMode === 'volume' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">销量</button>
          <button @click="viewMode = 'share'" :class="viewMode === 'share' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">市占率</button>
        </div>
      </div>
      <v-chart v-if="monthlyData.length > 0" :key="viewMode" class="h-full w-full pt-6" :option="leftChartOption" autoresize />
      <div v-else class="h-full flex items-center justify-center text-slate-400">数据加载中...</div>
    </div>
    <div v-if="viewMode === 'volume'" class="w-full lg:w-1/3 h-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 relative transition-all duration-300">
      <div class="absolute top-0 left-0 lg:left-8 text-sm font-bold text-slate-700 z-10">1-{{ selectedMonth }}月 累计销量对比 (YTD)</div>
      <v-chart v-if="ytdData.length > 0" class="h-full w-full pt-6" :option="rightChartOption" autoresize />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, CustomChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, CustomChart, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent])

const props = defineProps({ entityType: String, entityName: String, marketScope: String, selectedYear: Number, selectedMonth: Number })

const monthlyData = ref([])
const ytdData = ref([])
const displayYears = ref([])
const viewMode = ref('volume') 

const leftChartOption = computed(() => {
  if (monthlyData.value.length === 0) return {}
  
  const isShare = viewMode.value === 'share'
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

  const barSeriesName = isShare ? '当月市占率' : '当月销量'
  const barData = monthlyData.value.map(d => isShare ? d.share : d.units)
  const yoyData = monthlyData.value.map(d => isShare ? d.shareYoy : d.unitsYoy)
  const momData = monthlyData.value.map(d => isShare ? d.shareMom : d.unitsMom)

  return {
    tooltip: { 
      trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: '#e2e8f0', borderWidth: 1, textStyle: { color: '#334155' },
      formatter: (params) => {
        let html = `<div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach(p => {
          if (p.seriesName === 'bg_highlight') return;
          const isRate = p.seriesName.includes('变化') || isShare
          const valStr = isRate ? `${p.value}%` : p.value.toLocaleString()
          html += `<div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px; font-size: 13px;"><span>${p.marker} ${p.seriesName}</span><span style="font-weight: bold;">${valStr}</span></div>`
        })
        return html
      }
    },
    legend: { data: [barSeriesName, '同比变化 (YoY)', '环比变化 (MoM)'], bottom: 0, itemGap: 20, icon: 'circle', textStyle: { fontSize: 12, color: '#64748b' } },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { formatter: (value) => value === currentLabel ? `{active|${value}}` : value, rich: { active: { color: '#d97706', fontWeight: 'bold', fontSize: 13 } } } },
    yAxis: [ 
      { type: 'value', name: isShare ? '市占率 (%)' : '销量', nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { formatter: isShare ? '{value}%' : '{value}', color: '#64748b' } }, 
      { type: 'value', name: '变化率', nameTextStyle: { color: '#94a3b8' }, splitLine: { show: false }, axisLabel: { formatter: '{value}%', color: '#64748b' } } 
    ],
    dataZoom: [ { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, startValue: startZoom, endValue: endZoom }, { type: 'slider', xAxisIndex: 0, height: 10, bottom: '8%', borderColor: '#e2e8f0', backgroundColor: '#f8fafc', handleSize: '150%', startValue: startZoom, endValue: endZoom } ],
    series: [
      { name: barSeriesName, type: 'bar', data: barData, yAxisIndex: 0, barWidth: '40%', itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } },
      { name: '同比变化 (YoY)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, data: yoyData, itemStyle: { color: '#ef4444' }, lineStyle: { width: 3, shadowColor: 'rgba(239, 68, 68, 0.3)', shadowBlur: 10, shadowOffsetY: 5 } },
      { name: '环比变化 (MoM)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6, data: momData, itemStyle: { color: '#10b981' }, lineStyle: { width: 3, shadowColor: 'rgba(16, 185, 129, 0.3)', shadowBlur: 10, shadowOffsetY: 5 } },
      { type: 'custom', name: 'bg_highlight', yAxisIndex: 0, z: -1, silent: true, clip: false, renderItem: function (params, api) {
          const categoryIndex = api.value(0); if (xAxisData[categoryIndex] !== currentLabel) return;
          const gridRect = params.coordSys; const x = api.coord([categoryIndex, 0])[0]; const bandWidth = api.size([1, 0])[0];
          return { type: 'rect', shape: { x: x - bandWidth / 2, y: gridRect.y, width: bandWidth, height: gridRect.height }, style: api.style({ fill: 'rgba(245, 158, 11, 0.12)' }) };
        }, data: xAxisData.map((lbl, idx) => idx) }
    ]
  }
})

const rightChartOption = computed(() => {
  if (ytdData.value.length === 0) return {}
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '2%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: ytdData.value.map(d => `${d.year}年`), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
    series: [{
      type: 'bar', barWidth: '50%', data: ytdData.value.map(d => ({ value: d.units, yoy: d.yoy })), itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] },
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
        rich: { units: { color: '#334155', fontWeight: 'bold', fontSize: 13, padding: [0, 0, 4, 0] }, red: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 }, green: { color: '#10b981', fontWeight: 'bold', fontSize: 12 } }
      }
    }]
  }
})

const fetchData = async () => {
  monthlyData.value = []
  ytdData.value = []
  
  let query = supabase.from('manufacturer_regional_registrations')
      .select('report_year, report_month, parent_group, brand, monthly_units_cy, monthly_units_ly, monthly_share_cy, monthly_share_ly')
      .gte('report_year', 2022) // 放宽底线
      .eq('region_scope', props.marketScope)
    
  if (props.entityType === 'Group') {
    query = query.eq('parent_group', props.entityName).eq('brand', props.entityName)
  } else {
    query = query.eq('brand', props.entityName)
  }

  const { data } = await query
  if (data) {
    const rawMap = {}
    data.forEach(row => {
      if(!rawMap[row.report_year]) rawMap[row.report_year] = {}
      if(!rawMap[row.report_year][row.report_month]) rawMap[row.report_year][row.report_month] = { cy: 0, ly: 0, shareCy: 0, shareLy: 0, hasData: true }
      rawMap[row.report_year][row.report_month].cy += (row.monthly_units_cy || 0)
      rawMap[row.report_year][row.report_month].ly += (row.monthly_units_ly || 0)
      rawMap[row.report_year][row.report_month].shareCy += (row.monthly_share_cy || 0)
      rawMap[row.report_year][row.report_month].shareLy += (row.monthly_share_ly || 0)
    })

    const years = Object.keys(rawMap).map(Number).sort((a, b) => a - b)
    if (years.length === 0) return
    const startYear = years[0]; const endYear = years[years.length - 1];

    const timeSeries = []
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const hasNext = rawMap[y + 1]?.[m]?.hasData
        const hasCurr = rawMap[y]?.[m]?.hasData
        if (!hasCurr && !hasNext) continue
        
        const units = hasNext ? rawMap[y + 1][m].ly : rawMap[y][m].cy
        let share = hasNext ? rawMap[y + 1][m].shareLy : rawMap[y][m].shareCy
        share = Number(share.toFixed(2))

        if (units > 0) timeSeries.push({ year: y, month: m, units, share })
      }
    }

    timeSeries.forEach((item, index) => {
      if (index > 0) {
        const prev = timeSeries[index - 1]
        if ((item.year === prev.year && item.month === prev.month + 1) || (item.year === prev.year + 1 && item.month === 1 && prev.month === 12)) {
          item.unitsMom = Number(((item.units - prev.units) / prev.units * 100).toFixed(1))
          item.shareMom = prev.share > 0 ? Number(((item.share - prev.share) / prev.share * 100).toFixed(1)) : null
        } else { item.unitsMom = null; item.shareMom = null }
      } else { item.unitsMom = null; item.shareMom = null }

      const lastYearItem = timeSeries.find(t => t.year === item.year - 1 && t.month === item.month)
      item.unitsYoy = lastYearItem ? Number(((item.units - lastYearItem.units) / lastYearItem.units * 100).toFixed(1)) : null
      item.shareYoy = (lastYearItem && lastYearItem.share > 0) ? Number(((item.share - lastYearItem.share) / lastYearItem.share * 100).toFixed(1)) : null
    })
    monthlyData.value = timeSeries

    // 智能推断显示年份
    const hasNextYearTargetMonth = timeSeries.some(t => t.year === props.selectedYear + 1 && t.month === props.selectedMonth)
    if (hasNextYearTargetMonth) {
      displayYears.value = [props.selectedYear - 1, props.selectedYear, props.selectedYear + 1]
    } else {
      displayYears.value = [props.selectedYear - 2, props.selectedYear - 1, props.selectedYear]
    }

    const ytdResult = []
    displayYears.value.forEach(y => {
      let sum = 0
      timeSeries.filter(t => t.year === y && t.month <= props.selectedMonth).forEach(t => sum += t.units)
      let lastSum = 0
      timeSeries.filter(t => t.year === y - 1 && t.month <= props.selectedMonth).forEach(t => lastSum += t.units)
      
      const yoy = lastSum > 0 ? Number(((sum - lastSum) / lastSum * 100).toFixed(1)) : null
      ytdResult.push({ year: y, units: sum, yoy })
    })
    ytdData.value = ytdResult
  }
}

watch(() => [props.selectedYear, props.selectedMonth, props.entityName], fetchData)
onMounted(fetchData)
</script>