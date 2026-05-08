<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-64px)] flex flex-col font-sans">
    <!-- Header Area -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-4">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/resources')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors mr-2 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div class="w-1.5 h-6 bg-amber-500 rounded-full shrink-0"></div>
        <h1 class="text-2xl font-extrabold text-slate-800">欧洲放休假 + 上下班状态地图</h1>
      </div>
      
      <!-- Toolbar -->
      <div class="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm overflow-x-auto shrink-0 w-full sm:w-auto">
        <div class="flex items-center bg-slate-100 rounded-md p-1 shrink-0">
          <button 
            @click="activeTab = 'map'" 
            :class="['px-4 py-1.5 rounded-md text-sm font-bold transition-colors', activeTab === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            实时地图
          </button>
          <button 
            @click="activeTab = 'calendar'" 
            :class="['px-4 py-1.5 rounded-md text-sm font-bold transition-colors', activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            日历排班
          </button>
        </div>
        
        <div class="h-6 w-px bg-slate-200 mx-1 shrink-0"></div>
        
        <div class="flex items-center gap-2 px-2 shrink-0 whitespace-nowrap">
          <span class="relative flex h-2.5 w-2.5">
            <span v-if="loading" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="loading ? 'bg-amber-500' : 'bg-emerald-500'"></span>
          </span>
          <span class="text-xs font-medium text-slate-500">
            {{ loading ? '数据刷新中...' : '每分钟自动刷新' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 1. Map View -->
    <div v-show="activeTab === 'map'" class="flex-1 flex flex-col min-h-[600px] h-full">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div class="w-full sm:w-64 shrink-0">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索国家..." 
            class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
        <div class="h-8 w-px bg-slate-200 hidden sm:block"></div>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label v-for="status in statusOptions" :key="status.value" class="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="statusFilter" 
              :value="status.value" 
              v-model="statusFilter" 
              class="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500 cursor-pointer"
            >
            <div class="w-3 h-3 rounded-full shadow-inner border border-slate-200/50" :style="{ backgroundColor: status.color }"></div>
            <span class="text-sm font-medium text-slate-600 group-hover:text-slate-900">{{ status.label }}</span>
          </label>
        </div>
      </div>

      <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        <div ref="mapContainer" class="w-full h-full absolute inset-0"></div>
      </div>
    </div>

    <!-- 2. Calendar Month View -->
    <div v-show="activeTab === 'calendar'" class="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm relative mb-8" ref="calendarWrapperRef">
      
      <!-- Calendar Header -->
      <div class="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white z-10 shrink-0 rounded-t-xl" data-html2canvas-ignore="true">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-black text-slate-800 tabular-nums min-w-[120px]">{{ currentMonthDisplay }}</h2>
          <div class="flex items-center rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden shrink-0">
            <button @click="changeMonth(-1)" class="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button @click="goToToday" class="px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">今天</button>
            <button @click="changeMonth(1)" class="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-l border-slate-200">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-full sm:w-64">
            <CustomSelect
              v-model="calendarSearch"
              :options="countryOptions"
              :multiple="true"
              placeholder="筛选国家..."
            />
          </div>
          <button 
            @click="downloadCalendarImage" 
            class="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors shrink-0 h-10 shadow-sm"
            :disabled="downloading"
          >
            <svg v-if="!downloading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {{ downloading ? '生成中...' : '保存图片' }}
          </button>
        </div>
      </div>
      
      <!-- Calendar Title for export -->
      <div v-show="downloading" class="px-6 py-4 bg-white text-2xl font-black text-slate-800 text-center border-b border-slate-200">
        欧洲假期日历 - {{ currentMonthDisplay }}
      </div>

      <div class="relative bg-slate-100 overflow-x-auto rounded-b-xl" ref="calendarGridRef">
        
        <div v-if="calendarLoading" class="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center min-h-[400px]">
          <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p class="text-sm font-medium text-slate-600">加载日历数据中...</p>
        </div>

        <div class="min-w-[1000px] flex flex-col h-full bg-slate-200 gap-px border-b border-slate-200">
          <div class="grid grid-cols-7 bg-slate-50 shrink-0 border-b border-slate-200">
            <div v-for="day in ['周一','周二','周三','周四','周五','周六','周日']" :key="day" class="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {{ day }}
            </div>
          </div>

          <div class="grid grid-cols-7 gap-px" style="grid-template-rows: repeat(6, minmax(120px, auto));">
            <div 
              v-for="cell in calendarDays" 
              :key="cell.date" 
              class="bg-white p-1.5 flex flex-col hover:bg-slate-50/50 transition-colors group relative"
              :class="{'bg-slate-50/50': !cell.isCurrentMonth}"
            >
              <div class="flex justify-between items-center mb-1.5 px-1 pt-1">
                <span 
                  class="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-all"
                  :class="cell.isToday ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20' : (cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400 font-medium')"
                >
                  {{ cell.dayNum }}
                </span>
              </div>
              
              <!-- Holiday Events Container -->
              <div class="flex flex-col gap-1.5 px-1">
                <template v-for="(group, idx) in cell.groups.slice(0, isCalendarFiltered ? 999 : 3)" :key="idx">
                  <div 
                    @click="openDayModal(cell.date, cell.groups)"
                    class="rounded px-2 py-1.5 cursor-pointer transition-colors border-l-4 shadow-sm relative overflow-hidden flex flex-col"
                    :class="[
                      group.hasChina ? 'border-red-500 bg-red-50/50 hover:bg-red-50' : 
                      group.hasPublic ? 'border-orange-400 bg-orange-50/50 hover:bg-orange-50' : 
                      'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    ]"
                    :title="group.reasonLocal || group.reasonEn"
                  >
                    <!-- Line 1: Holiday Name -->
                    <div class="flex items-start justify-between gap-1 mb-0.5">
                      <span class="font-bold text-slate-800 text-xs truncate leading-snug">{{ group.displayName }}</span>
                      <span v-if="group.isRegionalOnly" class="shrink-0 bg-slate-200/50 text-slate-500 px-1 rounded text-[9px] leading-none py-0.5 border border-slate-200 ml-1">
                        地区性
                      </span>
                    </div>
                    <!-- Line 2: Summary -->
                    <div class="truncate text-[10px] font-medium text-slate-500" :title="group.summaryLine2">
                      {{ group.summaryLine2 }}
                    </div>
                  </div>
                </template>
              </div>
              
              <div v-if="!isCalendarFiltered && cell.groups.length > 3" class="px-1 mt-1 shrink-0 pb-1">
                <button 
                  @click="openDayModal(cell.date, cell.groups)"
                  class="w-full text-left text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded px-1.5 py-1 transition-colors"
                >
                  +{{ cell.groups.length - 3 }} 更多...
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Details Modal -->
    <div v-if="showDayModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in" data-html2canvas-ignore="true">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeDayModal"></div>
      <div class="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {{ formatModalDate(selectedDayDate) }}
            <span class="text-sm font-medium text-slate-500 ml-2">共 {{ selectedDayEvents.length }} 项假期</span>
          </h3>
          <button @click="closeDayModal" class="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          <div v-for="(group, idx) in selectedDayEvents" :key="idx" class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="group.hasChina ? 'bg-red-500' : (group.hasPublic ? 'bg-orange-400' : 'bg-slate-300')"></div>
            
            <!-- Holiday Header -->
            <div class="mb-4 border-b border-slate-100 pb-3 flex justify-between items-start pl-2">
              <div>
                <h4 class="text-base font-black text-slate-800">{{ group.displayName }}</h4>
                <p v-if="group.reasonEn && group.reasonLocal !== group.reasonEn" class="text-xs text-slate-400 mt-0.5 font-medium">{{ group.reasonEn }}</p>
              </div>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap" :class="group.hasPublic ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                {{ group.hasPublic ? 'PUBLIC HOLIDAY' : 'WEEKEND / WORKDAY' }}
              </span>
            </div>
            
            <!-- Affected Countries -->
            <div class="space-y-3 pl-2">
              <div v-for="country in group.countries" :key="country.code" class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                <div class="flex items-center gap-2 shrink-0 sm:w-32 pt-0.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                  <span class="font-bold text-slate-700 text-sm">{{ country.nameZh || country.nameEn || country.code }}</span>
                </div>
                
                <div class="flex-1 text-sm pt-0.5">
                  <span v-if="country.isNational" class="text-slate-600 font-medium px-2 py-0.5 bg-slate-50 rounded border border-slate-100">全国放假</span>
                  <div v-else-if="country.subdivisions.length > 0" class="flex flex-wrap gap-1.5">
                    <span v-for="sub in country.subdivisions" :key="sub" class="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200" :title="sub">
                      {{ sub }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="selectedDayEvents.length === 0" class="text-center py-8 text-slate-400 text-sm">
            这天没有排班或假期数据
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { supabase } from '../supabase.js'
import worldGeoJson from '../assets/world.json'
import CustomSelect from '../components/ui/CustomSelect.vue'
import * as htmlToImage from 'html-to-image'

// -- Core States --
const activeTab = ref('map')
const loading = ref(true)

// -- Map States --
const mapContainer = ref(null)
let myChart = null
const workStatusData = ref([])
const searchQuery = ref('')
const statusFilter = ref('all')

// -- Calendar States --
const calendarLoading = ref(true)
const calendarData = ref([])
const calendarSearch = ref([])
const currentMonthDate = ref(new Date())
const calendarWrapperRef = ref(null)
const calendarGridRef = ref(null)
const downloading = ref(false)

// -- Modal States --
const showDayModal = ref(false)
const selectedDayDate = ref('')
const selectedDayEvents = ref([])

// ==========================================
// MAPPINGS & HELPERS
// ==========================================

const mapAliasDict = {
  'Macedonia': 'MK',
  'North Macedonia': 'MK',
  'N. Macedonia': 'MK',
  'Czech Republic': 'CZ',
  'Czech Rep.': 'CZ',
  'Czechia': 'CZ',
  'England': 'GB',
  'Belarus': 'BY',
  'Republic of Serbia': 'RS',
  'republic of Serbia': 'RS',
  'Serbia': 'RS',
  'Kosovo': 'XK',
  'China': 'CN',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Great Britain': 'GB',
  'Bosnia and Herz.': 'BA',
  'Bosnia and Herzegovina': 'BA'
}

const statusOptions = [
  { value: 'all', label: '全部状态', color: '#cbd5e1' },
  { value: 'working', label: '工作时间', color: '#10b981' },
  { value: 'off_hours', label: '非工作时间', color: '#94a3b8' },
  { value: 'weekend', label: '周末', color: '#64748b' },
  { value: 'public_holiday', label: '公共假期', color: '#f97316' },
  { value: 'override_non_workday', label: '修正:非工作日', color: '#dc2626' },
  { value: 'override_working', label: '修正:工作日', color: '#3b82f6' }
]

const getStatusColor = (status) => {
  const option = statusOptions.find(o => o.value === status)
  return option ? option.color : '#cbd5e1'
}

const getStatusLabel = (status) => {
  const option = statusOptions.find(o => o.value === status)
  return option ? option.label : '未知状态'
}

const parseReasons = (reasons) => {
  if (!reasons) return '无'
  let arr = []
  if (Array.isArray(reasons)) {
    arr = reasons
  } else if (typeof reasons === 'string') {
    if (reasons.trim().startsWith('[')) {
      try {
        arr = JSON.parse(reasons)
      } catch (e) {
        return reasons
      }
    } else {
      return reasons
    }
  } else {
    return '无'
  }
  if (arr.length === 0) return '无'
  return arr.map(item => {
    if (typeof item === 'object' && item !== null) {
      const local = item.local_name || item.reason_local || ''
      const en = item.english_name || item.reason_en || ''
      if (local && en && local !== en) return `${local} / ${en}`
      return local || en || JSON.stringify(item)
    }
    return String(item)
  }).join('<br/>')
}

// Ensure local timezone string parsing
const getLocalDateStr = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const newDateSafe = () => {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d
}

const normalizeHolidayName = (name) => {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

// ==========================================
// DATA FETCHING
// ==========================================

const fetchMapData = async () => {
  try {
    if (workStatusData.value.length === 0) loading.value = true
    const { data, error } = await supabase
      .from('europe_country_work_status_now')
      .select('*')
    if (error) throw error
    workStatusData.value = data || []
    if (activeTab.value === 'map') updateMap()
  } catch (err) {
    console.error('Error fetching work status data:', err)
  } finally {
    loading.value = false
  }
}

const fetchCalendarData = async () => {
  try {
    calendarLoading.value = true
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 2)
    const startDateStr = getLocalDateStr(startDate)
    
    const { data, error } = await supabase
      .from('europe_calendar_annotations')
      .select('*')
      .gte('calendar_date', startDateStr)
      .order('calendar_date', { ascending: true })
      
    if (error) {
       console.error("Error fetching calendar data:", error)
       calendarData.value = []
    } else {
       calendarData.value = data || []
    }
  } catch (err) {
    console.error('Error fetching calendar annotations:', err)
  } finally {
    calendarLoading.value = false
  }
}

// ==========================================
// MAP LOGIC
// ==========================================

const filteredMapData = computed(() => {
  let filtered = workStatusData.value
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => item.work_state === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      (item.country_name_en && item.country_name_en.toLowerCase().includes(q)) ||
      (item.country_name_zh && item.country_name_zh.includes(q)) ||
      (item.country_code && item.country_code.toLowerCase().includes(q))
    )
  }
  return filtered
})

const updateMap = () => {
  if (!myChart) return

  const statusByCode = new Map()
  const statusByMapName = new Map()
  
  filteredMapData.value.forEach(item => {
    if (item.country_code) statusByCode.set(item.country_code, item)
    if (item.country_name_en) statusByMapName.set(item.country_name_en, item)
  })

  const seriesData = worldGeoJson.features.map(feature => {
    const geoName = feature.properties.name
    let record = null
    
    // 1. Alias mapped to country code
    const aliasCode = mapAliasDict[geoName]
    if (aliasCode && statusByCode.has(aliasCode)) {
      record = statusByCode.get(aliasCode)
    }
    
    // 2. Region name as country code
    if (!record && statusByCode.has(geoName)) {
      record = statusByCode.get(geoName)
    }

    // 3. Exact matching on alias mapped to english name (legacy fallback)
    if (!record && aliasCode && statusByMapName.has(aliasCode)) {
      record = statusByMapName.get(aliasCode)
    }

    // 4. Region name matching english name
    if (!record && statusByMapName.has(geoName)) {
      record = statusByMapName.get(geoName)
    }

    // 5. Fuzzy lowercase mapping
    if (!record) {
       const lowerName = geoName.toLowerCase()
       record = filteredMapData.value.find(r => 
         r.country_name_en && r.country_name_en.toLowerCase() === lowerName
       )
    }

    if (record) {
      return { name: geoName, value: record.work_state, record: record }
    } else {
      return { name: geoName, value: 'unknown', record: null }
    }
  })

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' },
      padding: 16,
      formatter: function (params) {
        if (!params.data || !params.data.record) {
          return `<div class="font-bold text-lg text-slate-700">${params.name}</div><div class="text-slate-400 text-sm mt-1 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> 暂无实时状态数据</div>`
        }
        
        const r = params.data.record
        const statusColor = getStatusColor(r.work_state)
        const statusLabel = getStatusLabel(r.work_state)
        
        let holidayHtml = ''
        if (r.has_public_holiday || r.holiday_reasons) {
          const parsed = parseReasons(r.holiday_reasons)
          if (parsed !== '无') {
            holidayHtml += `
              <div class="mt-3 pt-3 border-t border-slate-100">
                <div class="text-xs text-slate-500 mb-1 font-bold">公共假期原因</div>
                <div class="text-sm font-medium text-orange-600 leading-snug">${parsed}</div>
              </div>
            `
          }
        }
        
        let overrideHtml = ''
        if (r.override_reasons) {
          const parsed = parseReasons(r.override_reasons)
          if (parsed !== '无') {
            overrideHtml += `
              <div class="mt-3 pt-3 border-t border-slate-100">
                <div class="text-xs text-slate-500 mb-1 font-bold">人工修正说明</div>
                <div class="text-sm font-medium text-blue-600 leading-snug">${parsed}</div>
              </div>
            `
          }
        }

        return `
          <div class="font-sans min-w-[220px]">
            <div class="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
              <div>
                <div class="font-bold text-lg text-slate-800">${r.country_name_zh || r.country_name_en || params.name}</div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">${r.country_code || '-'}</div>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded shadow-sm text-xs font-bold" style="background-color: ${statusColor}15; border: 1px solid ${statusColor}40; color: ${statusColor}">
                <div class="w-2 h-2 rounded-full" style="background-color: ${statusColor}"></div>
                ${statusLabel}
              </span>
            </div>
            <div class="space-y-2 mt-1">
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">当地日期</span>
                <span class="font-mono font-medium text-slate-800">${r.local_date || '-'}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-slate-500">当地时间</span>
                <span class="font-mono font-bold text-slate-800 text-base">${r.local_time ? r.local_time.substring(0,5) : '-'}</span>
              </div>
            </div>
            ${holidayHtml}
            ${overrideHtml}
          </div>
        `
      }
    },
    series: [
      {
        name: 'Work Status',
        type: 'map',
        map: 'world_base',
        roam: true,
        zoom: 3.0,
        center: [14, 50],
        scaleLimit: { min: 1.5, max: 20 },
        label: { show: false },
        itemStyle: { borderColor: '#d1d5db', borderWidth: 0.4, areaColor: '#f1f5f9' },
        emphasis: {
          itemStyle: { areaColor: '#fde047', borderColor: '#eab308', borderWidth: 1 },
          label: { show: true, color: '#1e293b', fontWeight: 'bold' }
        },
        data: seriesData
      }
    ]
  }
  
  option.series[0].data.forEach(item => {
    if (item.value !== 'unknown') {
      const color = getStatusColor(item.value)
      const isFilteredOut = statusFilter.value !== 'all' && item.value !== statusFilter.value
      item.itemStyle = {
        areaColor: isFilteredOut ? '#f8fafc' : color,
        opacity: isFilteredOut ? 0.3 : 0.95
      }
    }
  })

  myChart.setOption(option)
}

// ==========================================
// CALENDAR LOGIC & MONTH GRID
// ==========================================

const countryOptions = computed(() => {
  const uniqueCountries = new Map()
  calendarData.value.forEach(item => {
    if (item.country_code) {
      uniqueCountries.set(item.country_code, item.country_name_zh || item.country_name_en || item.country_code)
    }
  })
  
  return Array.from(uniqueCountries.entries())
    .map(([code, name]) => ({ label: name, value: code }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
})

const isCalendarFiltered = computed(() => calendarSearch.value && calendarSearch.value.length > 0)

// Dual-layer aggregation: Date -> Holiday -> Countries
const aggregatedCalendarData = computed(() => {
  let baseData = calendarData.value
  
  if (isCalendarFiltered.value) {
    baseData = baseData.filter(item => calendarSearch.value.includes(item.country_code))
  }

  // Map<calendar_date, Map<holidayKey, Group>>
  const dateMap = new Map()

  baseData.forEach(item => {
    const date = item.calendar_date
    if (!dateMap.has(date)) dateMap.set(date, new Map())
    const dayGroups = dateMap.get(date)

    const rawEn = item.reason_en || ''
    const rawLocal = item.reason_local || ''
    const fallbackName = rawLocal || rawEn || '未知假期'
    const holidayKey = normalizeHolidayName(fallbackName)

    if (!dayGroups.has(holidayKey)) {
      dayGroups.set(holidayKey, {
        holidayKey,
        reasonEn: rawEn,
        reasonLocal: rawLocal,
        displayName: fallbackName,
        types: new Set(),
        countriesMap: new Map() // country_code -> { code, nameZh, nameEn, isNational, subdivisions: Set }
      })
    }

    const group = dayGroups.get(holidayKey)
    group.types.add(item.annotation_type)

    if (!group.countriesMap.has(item.country_code)) {
      group.countriesMap.set(item.country_code, {
        code: item.country_code,
        nameZh: item.country_name_zh || item.country_name_en || item.country_code,
        nameEn: item.country_name_en,
        isNational: false,
        subdivisions: new Set()
      })
    }

    const countryObj = group.countriesMap.get(item.country_code)
    
    if (!item.subdivision_code) {
      countryObj.isNational = true
    } else {
      countryObj.subdivisions.add(item.subdivision_name_en || item.subdivision_code)
    }
  })

  // Flatten and prepare summary strings
  const flattenedMap = new Map() // date -> Array<Group>
  
  for (const [date, dayGroups] of dateMap.entries()) {
    const groupsArray = Array.from(dayGroups.values()).map(g => {
      // Process countries
      const countriesArray = Array.from(g.countriesMap.values()).map(c => ({
        ...c,
        subdivisions: Array.from(c.subdivisions)
      }))

      // Sort countries: National first, then by name
      countriesArray.sort((a, b) => {
        if (a.isNational && !b.isNational) return -1
        if (!a.isNational && b.isNational) return 1
        return a.nameZh.localeCompare(b.nameZh, 'zh-CN')
      })

      const isRegionalOnly = countriesArray.every(c => !c.isNational && c.subdivisions.length > 0)
      const hasChina = countriesArray.some(c => c.code === 'CN')
      const hasPublic = g.types.has('public_holiday')

      // Summary Logic
      let summaryLine2 = ''
      if (!isCalendarFiltered.value) { // 0 selected
        if (countriesArray.length === 1 && countriesArray[0].code === 'CN') {
          summaryLine2 = '中国'
        } else {
          const topNames = countriesArray.slice(0, 3).map(c => c.nameZh).join('、')
          summaryLine2 = `${countriesArray.length}个国家: ${topNames}${countriesArray.length > 3 ? '...' : ''}`
        }
      } else if (calendarSearch.value.length === 1) { // 1 selected
        const c = countriesArray[0]
        if (!c) {
           summaryLine2 = ''
        } else if (c.isNational) {
           summaryLine2 = '全国'
        } else {
           summaryLine2 = `${c.subdivisions.length}个地区`
        }
      } else { // Multiple selected
        const topNames = countriesArray.slice(0, 3).map(c => c.nameZh).join('、')
        summaryLine2 = `${countriesArray.length}个选中国家: ${topNames}${countriesArray.length > 3 ? '...' : ''}`
      }

      return {
        holidayKey: g.holidayKey,
        reasonEn: g.reasonEn,
        reasonLocal: g.reasonLocal,
        displayName: g.displayName,
        countries: countriesArray,
        isRegionalOnly,
        hasChina,
        hasPublic,
        summaryLine2
      }
    })

    // Sort holiday events within the day
    groupsArray.sort((a, b) => {
      // Public holidays and China holidays bubble to top
      if (a.hasChina && !b.hasChina) return -1
      if (!a.hasChina && b.hasChina) return 1
      if (a.hasPublic && !b.hasPublic) return -1
      if (!a.hasPublic && b.hasPublic) return 1
      return a.displayName.localeCompare(b.displayName, 'zh-CN')
    })

    flattenedMap.set(date, groupsArray)
  }

  return flattenedMap
})

const currentMonthDisplay = computed(() => {
  return currentMonthDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const changeMonth = (delta) => {
  const newDate = new Date(currentMonthDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentMonthDate.value = newDate
}

const goToToday = () => {
  currentMonthDate.value = newDateSafe()
}

const calendarDays = computed(() => {
  const year = currentMonthDate.value.getFullYear()
  const month = currentMonthDate.value.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  let firstDayOfWeek = firstDayOfMonth.getDay()
  if (firstDayOfWeek === 0) firstDayOfWeek = 7
  
  const days = []
  const todayStr = getLocalDateStr(newDateSafe())
  
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - (firstDayOfWeek - 1))
  
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    
    const dateStr = getLocalDateStr(d)
    const dayGroups = aggregatedCalendarData.value.get(dateStr) || []
    
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === todayStr,
      groups: dayGroups
    })
  }
  
  return days
})

// ==========================================
// IMAGE EXPORT
// ==========================================
const downloadCalendarImage = async () => {
  if (!calendarWrapperRef.value) return
  downloading.value = true
  
  try {
    const dataUrl = await htmlToImage.toPng(calendarWrapperRef.value, { 
      pixelRatio: 2, 
      backgroundColor: '#ffffff'
    })
    
    const link = document.createElement('a')
    link.download = `Europe_Calendar_${currentMonthDisplay.value.replace(/\s+/g, '_')}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Failed to download calendar image:', err)
    alert('保存图片失败，请检查浏览器是否允许下载或截图：' + err.message)
  } finally {
    downloading.value = false
  }
}

// ==========================================
// MODAL HELPERS
// ==========================================

const openDayModal = (dateStr, groups) => {
  selectedDayDate.value = dateStr
  selectedDayEvents.value = groups
  showDayModal.value = true
}

const closeDayModal = () => { showDayModal.value = false }

const formatModalDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return d.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

// ==========================================
// LIFECYCLE
// ==========================================

let refreshInterval = null

onMounted(async () => {
  if (!echarts.getMap('world_base')) {
    echarts.registerMap('world_base', worldGeoJson)
  }
  if (mapContainer.value) {
    myChart = echarts.init(mapContainer.value)
    window.addEventListener('resize', handleResize)
  }
  await Promise.all([fetchMapData(), fetchCalendarData()])
  refreshInterval = setInterval(fetchMapData, 60000)
})

watch([searchQuery, statusFilter, activeTab], () => {
  if (activeTab.value === 'map') {
    nextTick(() => updateMap())
  }
})

const handleResize = () => { if (myChart) myChart.resize() }

onUnmounted(() => {
  if (myChart) myChart.dispose()
  window.removeEventListener('resize', handleResize)
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
