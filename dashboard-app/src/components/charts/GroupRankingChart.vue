<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md flex flex-col h-full">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-3">
        集团销量排行 
        <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
          <button @click="marketScope = 'EU'" :class="marketScope === 'EU' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md cursor-pointer">EU</button>
          <button @click="marketScope = 'EU+EFTA+UK'" :class="marketScope === 'EU+EFTA+UK' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-1 text-xs rounded-md cursor-pointer">EU+EFTA+UK</button>
        </div>
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
const marketScope = ref('EU')
const rankingData = ref([])

const chartOption = computed(() => {
  if (rankingData.value.length === 0) return {}
  const reversedData = [...rankingData.value].reverse()
  const globalMax = Math.max(...reversedData.map(d => d.value))
  const startValueIndex = Math.max(0, reversedData.length - 15)

  // 因为包含市占率，文字较长，所以将阈值定为 35%
  const seriesData = reversedData.map(d => {
    const isLongEnough = globalMax > 0 && (d.value / globalMax) > 0.35;
    return {
      name: d.name,
      value: d.value,
      share: d.share,
      itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
      label: {
        show: true,
        position: isLongEnough ? 'insideRight' : 'right',
        color: isLongEnough ? '#ffffff' : '#64748b',
        fontSize: 11,
        fontWeight: isLongEnough ? 'bold' : 'normal',
        formatter: `${d.value.toLocaleString()} (${d.share}%)`
      }
    }
  })

  return {
    tooltip: { 
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0].data
        const marker = params[0].marker
        return `
          <div style="margin-bottom: 6px; font-size: 14px;">${marker} <b>${p.name}</b></div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">
            销量: <span style="color: #0f172a; font-weight: bold; font-size: 14px;">${p.value.toLocaleString()}</span> 辆
          </div>
          <div style="font-size: 13px; color: #64748b;">
            市场份额:
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <div style="width: 120px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${p.share}%; height: 100%; background: #3b82f6; border-radius: 3px;"></div>
              </div>
              <span style="color: #3b82f6; font-weight: bold;">${p.share}%</span>
            </div>
          </div>
        `
      }
    },
    grid: { left: '1%', right: '8%', bottom: '2%', top: '2%', containLabel: true },
    xAxis: { type: 'value', max: globalMax, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { show: false } },
    yAxis: { type: 'category', data: reversedData.map(d => d.name), axisLabel: { color: '#475569', fontWeight: '500', width: 100, overflow: 'truncate' }, axisLine: { show: false }, axisTick: { show: false } },
    dataZoom: [
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: false, moveOnMouseWheel: true, startValue: startValueIndex, endValue: reversedData.length - 1 },
      { type: 'slider', yAxisIndex: 0, width: 10, right: 4, handleSize: '150%', showDetail: false, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', fillerColor: '#cbd5e1' }
    ],
    series: [{
      type: 'bar',
      data: seriesData,
      barWidth: '60%'
    }]
  }
})

const handleClick = (params) => emit('openModal', 'Group', params.name, marketScope.value)

const fetchData = async () => {
  const { data } = await supabase.from('manufacturer_regional_registrations')
    .select('report_year, parent_group, brand, monthly_units_cy, monthly_units_ly, monthly_share_cy, monthly_share_ly')
    .in('report_year', [props.selectedYear, props.selectedYear + 1]).eq('report_month', props.selectedMonth).eq('region_scope', marketScope.value)
  
  if (data) {
    const temp = {}
    data.filter(r => r.parent_group === r.brand).forEach(r => { 
      if (!temp[r.parent_group]) temp[r.parent_group] = { cy: 0, ly: 0, shareCy: 0, shareLy: 0, hasNext: false }
      if (r.report_year === props.selectedYear + 1) { 
        temp[r.parent_group].ly += (r.monthly_units_ly || 0); temp[r.parent_group].shareLy += (r.monthly_share_ly || 0); temp[r.parent_group].hasNext = true 
      } else if (r.report_year === props.selectedYear) { 
        temp[r.parent_group].cy += (r.monthly_units_cy || 0); temp[r.parent_group].shareCy += (r.monthly_share_cy || 0) 
      }
    })
    rankingData.value = Object.keys(temp).map(n => ({
      name: n, 
      value: temp[n].hasNext ? temp[n].ly : temp[n].cy,
      share: Number((temp[n].hasNext ? temp[n].shareLy : temp[n].shareCy).toFixed(2))
    })).filter(i => i.value > 0).sort((a, b) => b.value - a.value)
  }
}
watch([() => props.selectedYear, () => props.selectedMonth, marketScope], fetchData)
onMounted(fetchData)
</script>