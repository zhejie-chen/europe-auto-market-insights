<template>
  <div class="flex flex-col w-full h-full relative p-4">
    <!-- 顶栏 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
      <div>
        <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          同环比异动车型观测矩阵
        </h3>
        <p class="text-xs text-slate-500 mt-1">横轴: 同比增幅 / 纵轴: 环比增幅 / 气泡大小: 销量</p>
      </div>
      
      <!-- 图例提示 -->
      <div class="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-rose-400 opacity-80"></span>
          <span class="font-bold text-slate-700">右侧报告提及预警</span>
        </div>
        <div class="flex items-center gap-1.5 ml-2">
          <span class="w-3 h-3 rounded-full bg-slate-300 opacity-80"></span>
          <span>未提及辅助参考车型</span>
        </div>
      </div>
    </div>

    <!-- ECharts 容器 -->
    <div class="flex-1 w-full min-h-[350px] relative">
      <v-chart ref="chartRef" v-if="chartData.length > 0" class="absolute inset-0 w-full h-full" :option="chartOptions" autoresize />
      
      <!-- 加载遮罩 -->
      <div v-if="loading" class="absolute inset-0 bg-white/90 z-10 flex flex-col justify-center items-center text-slate-400 gap-2">
        <div class="w-6 h-6 border-2 border-slate-200 border-t-rose-400 rounded-full animate-spin"></div>
        <span class="text-xs">加载异常观测数据...</span>
      </div>

      <!-- 空数据遮罩 -->
      <div v-else-if="chartData.length === 0" class="absolute inset-0 flex flex-col justify-center items-center text-slate-400 gap-2 bg-white z-10">
        <svg class="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        <span class="text-sm">当前国家/月份暂无异常观测数据</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { supabase } from '../../supabase'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, MarkLineComponent, DataZoomComponent } from 'echarts/components'

use([CanvasRenderer, ScatterChart, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent, DataZoomComponent])

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  country: { type: String, required: true },
  insightText: { type: String, default: '' },
  hoveredModel: { type: String, default: null }
})

const emit = defineEmits(['models-loaded'])

const loading = ref(true)
const chartData = ref([])
const chartRef = ref(null)

const extractNumber = (str) => {
  if (!str) return 0;
  // "-23.1% (减少 111台)" -> -23.1
  const match = String(str).match(/([+-]?\d+(\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

const fetchData = async () => {
  if (!props.year || !props.month || !props.country) return;
  loading.value = true;
  
  const { data, error } = await supabase
    .from('anomaly_master')
    .select('*')
    .eq('report_year', props.year)
    .eq('report_month', props.month)
    .eq('market_name', props.country)

  if (error || !data) {
    console.error("加载异常数据失败：", error)
    loading.value = false
    return
  }

  // 预处理数据
  let maxS = 0;
  const processedData = data.map(item => {
    const sales = Number(item.current_sales) || 0;
    if (sales > maxS) maxS = sales;
    
    const text = props.insightText || '';
    const textUpperCase = text.toUpperCase();
    const modelUpper = item.model_name ? item.model_name.toUpperCase() : '';
    const brandUpper = item.brand_name ? item.brand_name.toUpperCase() : '';
    
    let matchStr = null;
    // 优先完整匹配车型
    if (modelUpper && textUpperCase.includes(modelUpper)) {
      matchStr = item.model_name;
    } else if (modelUpper && brandUpper) {
      // 尝试匹配去除品牌名后的纯车型部分 (比如 "Peugeot 208" -> "208")
      const modelClean = item.model_name.replace(item.brand_name, '').trim();
      // 切割括号，分离出如 "ATTO 2" 和 "Yuan UP"
      const parts = modelClean.split(/\(|\)/).map(s => s.trim()).filter(s => s.length > 1);
      for (const part of parts) {
        if (textUpperCase.includes(part.toUpperCase())) {
          matchStr = part;
          break;
        }
      }
    }
    // 最后如果连车名都没有，匹配品牌名
    if (!matchStr && brandUpper && textUpperCase.includes(brandUpper)) {
      matchStr = item.brand_name;
    }
    
    return {
      ...item,
      current_sales: sales,
      _maxSales: maxS,
      yoy: extractNumber(item.model_yoy_change),
      mom: extractNumber(item.model_mom_change),
      isHighlighted: !!matchStr,
      matchStr: matchStr
    }
  });

  // 把高亮的放在数组后面，以便渲染在最上层
  processedData.sort((a, b) => (a.isHighlighted === b.isHighlighted) ? 0 : a.isHighlighted ? 1 : -1)

  // 更新包含新 _maxSales 的数据
  processedData.forEach(d => d._maxSales = maxS);

  chartData.value = processedData;
  console.log("Anomaly Data for Chart:", processedData);
  loading.value = false;
  
  // 发送所有解析到的车型匹配规则给父组件，包含提取后的 matchStr
  const modelsToHighlight = processedData.filter(d => d.isHighlighted).map(d => ({
    fullModel: d.model_name,
    matchStr: d.matchStr
  }));
  // 去重
  const uniqueModels = Array.from(new Map(modelsToHighlight.map(m => [m.matchStr, m])).values());
  emit('models-loaded', uniqueModels);

  // 强制图表重新计算布局，打破 Flex 布局塌陷或未渲染 Bug
  nextTick(() => {
    if (chartRef.value && chartRef.value.resize) {
      chartRef.value.resize();
    }
  });
}

const chartOptions = computed(() => {
  if (chartData.value.length === 0) return null
  
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      textStyle: { color: '#334155' },
      formatter: function (params) {
        const d = params.data;
        let html = `<div style="font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px; color: #0f172a;">${d.model_name} <span style="font-size: 11px; color: #64748b; font-weight: 400; margin-left: 4px;">${d.brand_name}</span></div>`
        
        const typeColor = d.anomaly_type.includes('暴涨') ? '#10b981' : '#f43f5e';
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>⚠️ 异动判定</span>
          <span style="font-weight: 700; color: ${typeColor};">${d.anomaly_type}</span>
        </div>`

        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>📦 当月销量</span>
          <span style="font-weight: 700;">${d.current_sales} 辆</span>
        </div>`

        const yoyColor = d.yoy >= 0 ? '#10b981' : '#f43f5e';
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px; font-size: 13px;">
          <span>📈 同比 (YoY)</span>
          <span style="font-weight: 700; color: ${yoyColor}">${d.model_yoy_change}</span>
        </div>`

        const momColor = d.mom >= 0 ? '#10b981' : '#f43f5e';
        html += `<div style="display: flex; justify-content: space-between; gap: 24px; font-size: 13px;">
          <span>📊 环比 (MoM)</span>
          <span style="font-weight: 700; color: ${momColor}">${d.model_mom_change}</span>
        </div>`
        
        return html;
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'empty',
        bottom: 5,
        height: 12,
        borderColor: 'transparent',
        showDetail: false
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        filterMode: 'empty',
        right: 5,
        width: 12,
        borderColor: 'transparent',
        showDetail: false
      }
    ],
    xAxis: {
      name: '同比增幅 (YoY %)',
      nameLocation: 'end',
      type: 'value',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
      axisLabel: { formatter: '{value}%', color: '#64748b' },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    yAxis: {
      name: '环比增幅 (MoM %)',
      nameLocation: 'end',
      type: 'value',
      nameTextStyle: { color: '#64748b', fontSize: 11, padding: [0, 0, 0, 10] },
      axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
      axisLabel: { formatter: '{value}%', color: '#64748b' },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    series: [
      {
        type: 'scatter',
        animation: false,
        data: chartData.value.map(item => ({
          name: item.model_name,
          value: [item.yoy, item.mom],
          ...item
        })),
        symbolSize: function (val, params) {
          const maxBubble = 45;
          const minBubble = 10;
          const sales = params.data.current_sales || 0;
          const maxS = params.data._maxSales || 1;
          return Math.max(minBubble, (sales / maxS) * maxBubble);
        },
        itemStyle: {
          color: function (params) {
            return params.data.isHighlighted ? '#fb7185' : '#cbd5e1';
          },
          opacity: function (params) {
            return params.data.isHighlighted ? 0.75 : 0.4;
          },
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: true,
          formatter: function (params) {
            return params.data.isHighlighted ? params.data.model_name : '';
          },
          position: 'top',
          color: '#334155',
          fontSize: 11,
          fontWeight: 'bold',
          distance: 4
        },
        // 添加十字参考线表示0点
        markLine: {
          animation: false,
          silent: true,
          lineStyle: {
            type: 'solid',
            color: '#94a3b8',
            width: 1,
            opacity: 0.5
          },
          symbol: ['none', 'none'],
          label: { show: false },
          data: [
            { xAxis: 0 },
            { yAxis: 0 }
          ]
        }
      }
    ]
  }
})

watch(() => [props.year, props.month, props.country, props.insightText], fetchData, { immediate: true })

watch(() => props.hoveredModel, (newModel, oldModel) => {
  if (!chartRef.value) return;
  
  if (oldModel) {
    chartRef.value.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name: oldModel
    });
    chartRef.value.dispatchAction({
      type: 'hideTip'
    });
  }
  
  if (newModel) {
    chartRef.value.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name: newModel
    });
    chartRef.value.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      name: newModel
    });
  }
})
</script>
