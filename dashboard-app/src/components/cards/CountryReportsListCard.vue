<template>
  <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
    
    <!-- 装饰球 -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
    <div class="absolute top-40 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>

    <div class="relative z-10 flex items-center justify-between mb-4">
      <h3 class="text-base font-bold text-blue-900 flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
        {{ selectedYear }}年{{ selectedMonth }}月 地区洞察
      </h3>
    </div>

    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-blue-400 gap-3 min-h-[200px]">
      <div class="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p class="text-xs">检索可用报告...</p>
    </div>

    <div v-else-if="Object.keys(groupedCountries).length === 0" class="flex-1 flex flex-col items-center justify-center text-blue-400/80 bg-white/50 rounded-xl border border-dashed border-blue-200 min-h-[200px]">
      <p class="text-sm font-medium">暂无当前月份国家洞察</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mr-2 pr-2 space-y-4">
      <div v-for="(countries, region) in groupedCountries" :key="region" class="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white shadow-sm">
        <h4 class="text-xs font-extrabold text-blue-800 mb-2 flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
          <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          {{ region }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="country in countries" 
            :key="country"
            @click="emit('select-country', country)"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-100 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm cursor-pointer group"
          >
            <span>{{ country }}</span>
            <svg class="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../supabase'

const props = defineProps({
  selectedYear: Number,
  selectedMonth: Number
})

const emit = defineEmits(['select-country', 'update-status'])

const groupedCountries = ref({})
const loading = ref(false)

const regionMap = {
  '芬兰': '北欧', '丹麦': '北欧', '挪威': '北欧', '瑞典': '北欧', '爱尔兰': '北欧', '英国': '北欧',
  '德国': '西欧', '法国': '西欧', '卢森堡': '西欧', '奥地利': '西欧', '比利时': '西欧', '瑞士': '西欧', '荷兰': '西欧',
  '意大利': '南欧', '西班牙': '南欧', '希腊': '南欧', '葡萄牙': '南欧',
  '波兰': '东欧'
}

const fetchAvailableReports = async () => {
  if (!props.selectedYear || !props.selectedMonth) {
    emit('update-status', false)
    return
  }
  
  loading.value = true
  const { data, error } = await supabase
    .from('market_insights')
    .select('market_name')
    .eq('report_year', props.selectedYear)
    .eq('report_month', props.selectedMonth)
  
  if (data) {
    const uniqueMarkets = [...new Set(data.map(item => item.market_name))].filter(m => m !== 'ALL')
    
    // Grouping
    const groups = {}
    uniqueMarkets.forEach(country => {
      const region = regionMap[country] || '其他'
      if (!groups[region]) groups[region] = []
      groups[region].push(country)
    })
    
    // Sort regions
    const sortedGroups = {}
    const order = ['西欧', '北欧', '南欧', '东欧', '其他']
    order.forEach(reg => {
      if (groups[reg]) sortedGroups[reg] = groups[reg]
    })
    
    groupedCountries.value = sortedGroups
    emit('update-status', uniqueMarkets.length > 0)
  } else {
    console.error('获取报告列表失败:', error)
    emit('update-status', false)
  }
  
  loading.value = false
}

watch(() => [props.selectedYear, props.selectedMonth], fetchAvailableReports, { immediate: true })
</script>
