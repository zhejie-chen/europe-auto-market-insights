<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" @click.self="closeModal">
        <div class="bg-white w-11/12 max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
          
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 class="text-lg font-bold text-slate-800">下载源数据</h3>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <div class="space-y-3">
              <label class="block text-sm font-semibold text-slate-700">起始时间</label>
              <div class="flex items-center gap-4">
                <CustomSelect v-model="startYear" :options="yearOptions" suffix=" 年" />
                <CustomSelect v-model="startMonth" :options="monthOptions" suffix=" 月" />
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-semibold text-slate-700">结束时间</label>
              <div class="flex items-center gap-4">
                <CustomSelect v-model="endYear" :options="yearOptions" suffix=" 年" />
                <CustomSelect v-model="endMonth" :options="monthOptions" suffix=" 月" />
              </div>
            </div>

            <button @click="downloadExcel" :disabled="isDownloading" class="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isDownloading ? `数据生成中 (${downloadProgress})...` : '开始下载 Excel' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../supabase'
import * as XLSX from 'xlsx'
import CustomSelect from '../ui/CustomSelect.vue'

const props = defineProps({ isOpen: Boolean, defaultYear: Number, defaultMonth: Number })
const emit = defineEmits(['close'])

const yearOptions = [2023, 2024, 2025, 2026].map(y => ({ label: y, value: y }))
const monthOptions = Array.from({length: 12}, (_, i) => ({ label: i + 1, value: i + 1 }))

const startYear = ref(2023)
const startMonth = ref(1)
const endYear = ref(2026)
const endMonth = ref(1)
const isDownloading = ref(false)
const downloadProgress = ref('') // 提示进度

watch(() => props.isOpen, (val) => {
  if (val) {
    endYear.value = props.defaultYear || new Date().getFullYear()
    endMonth.value = props.defaultMonth || 1
  }
})

const closeModal = () => emit('close')

const downloadExcel = async () => {
  isDownloading.value = true
  try {
    const startCode = startYear.value * 100 + startMonth.value
    const endCode = endYear.value * 100 + endMonth.value

    if (startCode > endCode) {
      alert('起始时间不能晚于结束时间！')
      isDownloading.value = false
      return
    }

    // ============================================
    // 核心修复：突破 Supabase 1000 行限制的循环抓取引擎
    // ============================================
    downloadProgress.value = '抓取国家数据'
    let countryRaw = []
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('market_power_source_registrations')
        .select('report_year, report_month, market_name, power_source, monthly_units_cy')
        .eq('market_category', 'Country')
        .neq('power_source', 'TOTAL')
        .gte('report_year', startYear.value)
        .lte('report_year', endYear.value)
        .range(from, from + 999) // 每次拿 1000 条

      if (!data || data.length === 0) break
      countryRaw.push(...data)
      if (data.length < 1000) break // 拿到不够 1000 条，说明拿完了
      from += 1000
    }

    const countryData = countryRaw
      .filter(r => (r.report_year * 100 + r.report_month) >= startCode && (r.report_year * 100 + r.report_month) <= endCode)
      .map(r => ({
        '年份': r.report_year, '月份': r.report_month, '国家': r.market_name, '能源形式': r.power_source, '销量': r.monthly_units_cy || 0
      }))

    downloadProgress.value = '抓取品牌数据'
    let brandRaw = []
    from = 0
    while (true) {
      const { data } = await supabase
        .from('manufacturer_regional_registrations')
        .select('report_year, report_month, region_scope, parent_group, brand, monthly_units_cy')
        .gte('report_year', startYear.value)
        .lte('report_year', endYear.value)
        .range(from, from + 999)

      if (!data || data.length === 0) break
      brandRaw.push(...data)
      if (data.length < 1000) break
      from += 1000
    }

    downloadProgress.value = '整理合并中'
    const parentBrands = {}
    brandRaw.forEach(r => {
      if (!parentBrands[r.parent_group]) parentBrands[r.parent_group] = new Set()
      parentBrands[r.parent_group].add(r.brand)
    })

    const brandData = []
    brandRaw
      .filter(r => (r.report_year * 100 + r.report_month) >= startCode && (r.report_year * 100 + r.report_month) <= endCode)
      .forEach(r => {
        const isStandalone = parentBrands[r.parent_group].size === 1 && r.parent_group === r.brand
        const isSubBrand = r.parent_group !== r.brand
        if (isStandalone || isSubBrand) {
          brandData.push({
            '年份': r.report_year, '月份': r.report_month, '大区范围': r.region_scope, '所属集团': r.parent_group, '品牌': r.brand, '销量': r.monthly_units_cy || 0
          })
        }
      })

    const wb = XLSX.utils.book_new()
    const wsCountry = XLSX.utils.json_to_sheet(countryData)
    const wsBrand = XLSX.utils.json_to_sheet(brandData)
    
    XLSX.utils.book_append_sheet(wb, wsCountry, "国家数据")
    XLSX.utils.book_append_sheet(wb, wsBrand, "品牌数据")
    
    XLSX.writeFile(wb, `市场数据导出_${startYear.value}年${startMonth.value}月-至-${endYear.value}年${endMonth.value}月.xlsx`)
    
    closeModal()
  } catch (error) {
    console.error("导出失败", error)
    alert("导出数据时发生错误！")
  } finally {
    isDownloading.value = false
    downloadProgress.value = ''
  }
}
</script>
<style scoped>
/* 继承基础动画 */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.animate-scale-up { animation: scaleUp 0.2s ease-out forwards; }
@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>