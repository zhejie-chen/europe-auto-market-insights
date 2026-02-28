<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md flex flex-col h-full">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 class="text-lg font-bold text-slate-800">
        国家销量排行
        <span class="text-sm font-normal text-slate-500 ml-2">({{ selectedYear }}年{{ selectedMonth }}月)</span>
      </h2>
      <div class="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-md">点击查看详情</div>
    </div>
    <div class="flex-1 min-h-[450px]">
      <v-chart class="h-full w-full" :option="chartOption" autoresize @click="handleClick" />
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
import { TooltipComponent, GridComponent, DataZoomComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent, DataZoomComponent])

const props = defineProps({ selectedYear: Number, selectedMonth: Number })
const emit = defineEmits(['openModal'])
const countryRanking = ref([])

const chartOption = computed(() => {
  if (countryRanking.value.length === 0) return {}
  const reversedData = [...countryRanking.value].reverse()
  const totalCount = reversedData.length
  const globalMax = Math.max(...reversedData.map(d => d.units))
  const endValueIndex = totalCount > 0 ? totalCount - 1 : 0
  const startValueIndex = Math.max(0, totalCount - 15)

  // 核心智能逻辑：为每条数据动态计算标签位置
  const seriesData = reversedData.map(d => {
    // 超过最大值 20% 的柱子，文字放里面
    const isLongEnough = globalMax > 0 && (d.units / globalMax) > 0.2;
    return {
      name: d.market_name,
      value: d.units,
      itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
      label: {
        show: true,
        position: isLongEnough ? 'insideRight' : 'right',
        color: isLongEnough ? '#ffffff' : '#64748b',
        fontSize: 11,
        fontWeight: isLongEnough ? 'bold' : 'normal',
        formatter: d.units.toLocaleString()
      }
    }
  })

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    // 文字内收后，右侧留白可以大幅缩小，让柱子更长！
    grid: { left: '1%', right: '8%', bottom: '2%', top: '2%', containLabel: true },
    xAxis: { type: 'value', max: globalMax, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { show: false } },
    yAxis: { type: 'category', data: reversedData.map(d => d.market_name), axisLabel: { color: '#475569', fontWeight: '500', interval: 0, width: 120, overflow: 'truncate' }, axisLine: { show: false }, axisTick: { show: false } },
    dataZoom: [
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, startValue: startValueIndex, endValue: endValueIndex },
      { type: 'slider', yAxisIndex: 0, width: 10, right: 4, handleSize: '150%', showDetail: false, brushSelect: false, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', fillerColor: '#cbd5e1', startValue: startValueIndex, endValue: endValueIndex }
    ],
    series: [{
      type: 'bar',
      data: seriesData,
      barWidth: '60%'
    }]
  }
})

const handleClick = (params) => { emit('openModal', 'Country', params.name, '') }

const fetchData = async () => {
  const { data } = await supabase.from('market_power_source_registrations').select('report_year, market_name, monthly_units_cy, monthly_units_ly').in('report_year', [props.selectedYear, props.selectedYear + 1]).eq('report_month', props.selectedMonth).eq('market_category', 'Country').eq('power_source', 'TOTAL') 
  if (data) {
    const temp = {}
    data.forEach(r => {
      if (!temp[r.market_name]) temp[r.market_name] = { cy: 0, ly: 0, hasNext: false }
      if (r.report_year === props.selectedYear + 1) { temp[r.market_name].ly += (r.monthly_units_ly || 0); temp[r.market_name].hasNext = true } 
      else if (r.report_year === props.selectedYear) { temp[r.market_name].cy += (r.monthly_units_cy || 0) }
    })
    countryRanking.value = Object.keys(temp).map(n => ({ market_name: n, units: temp[n].hasNext ? temp[n].ly : temp[n].cy })).filter(i => i.units > 0).sort((a, b) => b.units - a.units)
  }
}
watch([() => props.selectedYear, () => props.selectedMonth], fetchData)
onMounted(fetchData)
</script>