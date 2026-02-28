<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md flex flex-col h-full">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
        能源结构演变趋势 
        <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
          <button @click="marketScope = 'EUROPEAN UNION'" :class="marketScope === 'EUROPEAN UNION' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">
            EU
          </button>
          <button @click="marketScope = 'EU + EFTA + UK'" :class="marketScope === 'EU + EFTA + UK' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md transition-all cursor-pointer">
            EU+EFTA+UK
          </button>
        </div>
      </h2>
      <div class="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-md">支持左右滑动查看历史与未来</div>
    </div>
    <div class="flex-1 min-h-[450px]">
      <v-chart class="h-full w-full" :option="chartOption" autoresize />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, CustomChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, DataZoomComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, CustomChart, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent])

const props = defineProps({ selectedYear: Number, selectedMonth: Number })
const marketScope = ref('EUROPEAN UNION')
const historicalMarketShare = ref([])

const powerSourceMap = {
  'BATTERY ELECTRIC': 'BEV',
  'PLUG-IN HYBRID': 'PHEV',
  'HYBRID ELECTRIC': 'HEV',
  'PETROL': 'Petrol',
  'DIESEL': 'Diesel',
  'OTHERS': 'Others'
}

const fixedSourceOrder = ['BEV', 'PHEV', 'HEV', 'Petrol', 'Diesel', 'Others']

const chartOption = computed(() => {
  if (historicalMarketShare.value.length === 0) return {}

  const currentLabel = `${props.selectedYear.toString().slice(-2)}/${props.selectedMonth.toString().padStart(2, '0')}`
  const xAxisData = historicalMarketShare.value.map(d => `${d.year.toString().slice(-2)}/${d.month.toString().padStart(2, '0')}`)
  
  const powerSourcesSet = new Set()
  historicalMarketShare.value.forEach(d => Object.keys(d.share).forEach(key => powerSourcesSet.add(key)))
  const powerSources = Array.from(powerSourcesSet).sort((a, b) => fixedSourceOrder.indexOf(a) - fixedSourceOrder.indexOf(b))

  const series = powerSources.map((source) => {
    return {
      name: source, type: 'bar', stack: 'total', barWidth: '50%',
      label: { show: true, position: 'inside', color: '#ffffff', fontSize: 11, fontWeight: 'bold', formatter: (p) => p.value > 4 ? p.value.toFixed(1) + '%' : '' },
      data: historicalMarketShare.value.map(d => parseFloat(d.share[source] || 0))
    }
  })

  series.push({
    type: 'custom', name: 'bg_highlight', z: -1, silent: true,
    renderItem: function (params, api) {
      const categoryIndex = api.value(0);
      if (xAxisData[categoryIndex] !== currentLabel) return;
      const ptTop = api.coord([categoryIndex, 100]); 
      const ptBottom = api.coord([categoryIndex, 0]); 
      const bandWidth = api.size([1, 0])[0]; 
      const bgWidth = bandWidth * 0.75; 
      return {
        type: 'rect',
        shape: { x: ptTop[0] - bgWidth / 2, y: ptTop[1], width: bgWidth, height: ptBottom[1] - ptTop[1] },
        style: api.style({ fill: 'rgba(245, 158, 11, 0.25)', radius: [4, 4, 0, 0] })
      };
    },
    data: xAxisData.map((lbl, idx) => idx)
  });

  const dataLen = xAxisData.length;
  const targetIndex = xAxisData.indexOf(currentLabel);
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
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let html = `<div style="font-weight: bold; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach(p => {
          if (p.seriesName !== 'bg_highlight' && p.value > 0) {
            html += `<div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
                       <span>${p.marker} ${p.seriesName}</span>
                       <span style="font-weight: bold;">${p.value.toFixed(1)}%</span>
                     </div>`;
          }
        });
        return html;
      }
    },
    legend: { data: powerSources, bottom: 0, icon: 'circle' },
    grid: { left: '1%', right: '4%', bottom: '22%', top: '5%', containLabel: true },
    xAxis: { 
      type: 'category', data: xAxisData, axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { formatter: (value) => value === currentLabel ? `{active|${value}}` : value, rich: { active: { color: '#d97706', fontWeight: 'bold', fontSize: 13 } } }
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, startValue: startZoom, endValue: endZoom },
      { type: 'slider', xAxisIndex: 0, height: 12, bottom: '10%', borderColor: '#e2e8f0', backgroundColor: '#f8fafc', handleSize: '150%', startValue: startZoom, endValue: endZoom }
    ],
    series: series
  }
})

const fetchData = async () => {
  let startYear = props.selectedYear - 2; 
  // 核心：强行往后读取一年，拿到 ly 值
  let endYear = props.selectedYear + 1;
  
  const { data: rawData } = await supabase
    .from('market_power_source_registrations')
    .select('report_year, report_month, power_source, monthly_units_cy, monthly_units_ly')
    .gte('report_year', startYear)
    .lte('report_year', endYear)
    .ilike('market_name', marketScope.value === 'EUROPEAN UNION' ? '%EUROPEAN UNION%' : '%EU%EFTA%UK%')
    .neq('power_source', 'TOTAL') 
    
  if (rawData) {
    const rawMap = {}

    // 先构建带年份和月份的字典
    rawData.forEach(row => {
      if(!rawMap[row.report_year]) rawMap[row.report_year] = {}
      if(!rawMap[row.report_year][row.report_month]) rawMap[row.report_year][row.report_month] = { hasData: true, sources: {} }

      const mappedSource = powerSourceMap[row.power_source.toUpperCase()] || row.power_source
      if (!rawMap[row.report_year][row.report_month].sources[mappedSource]) {
         rawMap[row.report_year][row.report_month].sources[mappedSource] = { cy: 0, ly: 0 }
      }
      
      rawMap[row.report_year][row.report_month].sources[mappedSource].cy += (row.monthly_units_cy || 0)
      rawMap[row.report_year][row.report_month].sources[mappedSource].ly += (row.monthly_units_ly || 0)
    })

    const finalData = []
    
    // 只渲染我们需要的历史时间段，不渲染未来占位的 endYear
    for (let y = startYear; y <= props.selectedYear; y++) {
      for (let m = 1; m <= 12; m++) {
         const hasNextYearMonth = rawMap[y + 1]?.[m]?.hasData
         const hasCurrYearMonth = rawMap[y]?.[m]?.hasData

         if (!hasCurrYearMonth && !hasNextYearMonth) continue; // 如果当月无论修正前、修正后都没有数据，直接跳过

         const sources = {}
         let monthTotal = 0

         const sourcesThisYear = rawMap[y]?.[m]?.sources ? Object.keys(rawMap[y][m].sources) : []
         const sourcesNextYear = rawMap[y+1]?.[m]?.sources ? Object.keys(rawMap[y+1][m].sources) : []
         const allSources = new Set([...sourcesThisYear, ...sourcesNextYear])

         // 修正逻辑：优先采用次年发布的 ly，否则用本年 cy
         allSources.forEach(source => {
            let units = 0
            if (hasNextYearMonth) {
               units = rawMap[y + 1][m].sources[source]?.ly || 0
            } else if (hasCurrYearMonth) {
               units = rawMap[y][m].sources[source]?.cy || 0
            }

            if (units > 0) {
               sources[source] = units
               monthTotal += units
            }
         })

         if (monthTotal > 0) {
             const share = {}
             for (const [source, units] of Object.entries(sources)) {
                share[source] = (units / monthTotal * 100) // 计算精确百分比
             }
             finalData.push({ year: y, month: m, share })
         }
      }
    }

    historicalMarketShare.value = finalData.sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month))
  }
}

watch([() => props.selectedYear, () => props.selectedMonth, marketScope], fetchData)
onMounted(fetchData)
</script>