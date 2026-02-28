<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 p-4 md:px-8 md:py-6 font-sans">
    
    <header class="flex flex-col xl:flex-row justify-between items-center bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-slate-100 mb-6 sticky top-4 z-20 gap-3 xl:gap-0">
      
      <div class="flex items-center gap-3">
        <div class="w-2 h-7 bg-blue-600 rounded-full"></div>
        <h1 class="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">欧洲汽车市场洞察</h1>
      </div>
      
      <div class="flex flex-wrap items-center justify-center gap-3">
        
        <div class="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <div class="w-28">
            <CustomSelect v-model="tempYear" :options="yearOptions" suffix=" 年" />
          </div>
          <div class="w-20">
            <CustomSelect v-model="tempMonth" :options="monthOptions" suffix=" 月" />
          </div>
          <button @click="applyDateQuery" class="ml-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer tracking-wide">
            查询
          </button>
        </div>
        
        <div class="w-px h-5 bg-slate-200 hidden md:block"></div>

        <button @click="isDownloadModalOpen = true" class="px-4 py-1.5 text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
          📊 下载源数据
        </button>
        <button @click="downloadCurrentPDF" class="px-4 py-1.5 text-sm font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
          📄 下载原PDF
        </button>
        <button disabled class="px-4 py-1.5 text-sm font-semibold bg-slate-100 text-slate-400 border border-slate-200 rounded-xl cursor-not-allowed flex items-center gap-2">
          💡 下载全文
        </button>
      </div>
    </header>

    <main v-if="isInitialized" id="report-content" class="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      <div class="xl:col-span-3 flex flex-col gap-6">
        <SalesTrendChart :selectedYear="selectedYear" :selectedMonth="selectedMonth" />
        <MarketShareChart :selectedYear="selectedYear" :selectedMonth="selectedMonth" />
        <CountryRankingChart :selectedYear="selectedYear" :selectedMonth="selectedMonth" @openModal="handleOpenModal" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GroupRankingChart :selectedYear="selectedYear" :selectedMonth="selectedMonth" @openModal="handleOpenModal" />
          <BrandRankingChart :selectedYear="selectedYear" :selectedMonth="selectedMonth" @openModal="handleOpenModal" />
        </div>
      </div>
      
      <div class="xl:col-span-1 h-full">
        <div class="sticky top-[104px] h-[calc(100vh-128px)]">
          <InsightReportCard :commentary="expertCommentary" />
        </div>
      </div>

    </main>

    <div v-else class="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
      <div class="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p>正在拉取最新大盘数据...</p>
    </div>

    <BaseModal :isOpen="modalState.isOpen" :title="`${modalState.name} 详细数据分析`" :subtitle="`月度同环比趋势 与 年度累计 (YTD) 表现 ${modalState.type !== 'Country' ? `(${modalState.marketScope})` : ''}`" @close="modalState.isOpen = false">
      <CountryDetailView v-if="modalState.type === 'Country'" :entityName="modalState.name" :selectedYear="selectedYear" :selectedMonth="selectedMonth" />
      <ManufacturerDetailView v-else-if="['Group', 'Brand'].includes(modalState.type)" :entityType="modalState.type" :entityName="modalState.name" :marketScope="modalState.marketScope" :selectedYear="selectedYear" :selectedMonth="selectedMonth" />
    </BaseModal>

    <DataDownloadModal :isOpen="isDownloadModalOpen" :defaultYear="selectedYear" :defaultMonth="selectedMonth" @close="isDownloadModalOpen = false" />

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { supabase } from './supabase'

import SalesTrendChart from './components/charts/SalesTrendChart.vue'
import MarketShareChart from './components/charts/MarketShareChart.vue'
import CountryRankingChart from './components/charts/CountryRankingChart.vue'
import GroupRankingChart from './components/charts/GroupRankingChart.vue'
import BrandRankingChart from './components/charts/BrandRankingChart.vue'
import InsightReportCard from './components/cards/InsightReportCard.vue'

import BaseModal from './components/modals/BaseModal.vue'
import CountryDetailView from './components/modals/CountryDetailView.vue'
import ManufacturerDetailView from './components/modals/ManufacturerDetailView.vue'
import DataDownloadModal from './components/modals/DataDownloadModal.vue'
import CustomSelect from './components/ui/CustomSelect.vue'

const isInitialized = ref(false)
const isDownloadModalOpen = ref(false)

const yearOptions = [2023, 2024, 2025, 2026].map(y => ({ label: y, value: y }))
const monthOptions = Array.from({length: 12}, (_, i) => ({ label: i + 1, value: i + 1 }))

const tempYear = ref(2024)
const tempMonth = ref(1)

const selectedYear = ref(null)
const selectedMonth = ref(null)
const expertCommentary = ref('')

const modalState = ref({ isOpen: false, type: '', name: '', marketScope: '' })
const handleOpenModal = (type, name, scope) => { modalState.value = { isOpen: true, type, name, marketScope: scope } }

const initDashboard = async () => {
  document.title = '欧洲汽车市场洞察'

  const { data } = await supabase
    .from('report_summary_insights')
    .select('report_year, report_month, expert_commentary')
    .order('report_year', { ascending: false })
    .order('report_month', { ascending: false })
    .limit(1)
    .single()
  
  if (data) {
    tempYear.value = data.report_year
    tempMonth.value = data.report_month
    selectedYear.value = data.report_year
    selectedMonth.value = data.report_month
    expertCommentary.value = data.expert_commentary
  }
  isInitialized.value = true
}

const applyDateQuery = async () => {
  selectedYear.value = tempYear.value
  selectedMonth.value = tempMonth.value
  
  const { data } = await supabase
    .from('report_summary_insights')
    .select('expert_commentary')
    .eq('report_year', selectedYear.value)
    .eq('report_month', selectedMonth.value)
    .single()
  
  expertCommentary.value = data ? data.expert_commentary : ''
}

const downloadCurrentPDF = async () => {
  const { data } = await supabase
    .from('report_summary_insights')
    .select('pdf_url')
    .eq('report_year', selectedYear.value)
    .eq('report_month', selectedMonth.value)
    .single()
  
  if (data && data.pdf_url) {
    window.open(data.pdf_url, '_blank')
  } else {
    alert(`暂未上传 ${selectedYear.value}年${selectedMonth.value}月 的 PDF 报告。`)
  }
}

onMounted(initDashboard)
</script>

<style>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>