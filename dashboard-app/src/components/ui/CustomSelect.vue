<template>
  <div class="relative w-full" ref="selectRef">
    <div 
      @click="isOpen = !isOpen" 
      class="flex items-center justify-between w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-3 rounded-xl hover:border-blue-400 hover:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium text-sm select-none shadow-sm h-10"
    >
      <span class="truncate pr-2 text-left flex-1">{{ displayValue }}</span>
      <svg 
        class="w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0" 
        :class="{ 'rotate-180': isOpen }" 
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>

    <transition name="fade-down">
      <div v-if="isOpen" class="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl flex flex-col overflow-hidden" style="max-height: 20rem;">
        
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-100 bg-slate-50 shrink-0">
          <div class="relative">
            <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索选项..." 
              class="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              @click.stop
            />
          </div>
        </div>

        <div class="overflow-y-auto flex-1 custom-scrollbar">
          <ul class="py-1">
            <!-- Select All (only if multiple and not searching) -->
            <li 
              v-if="multiple && options.length > 0 && !searchQuery"
              @click="toggleAll" 
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3 border-b border-slate-100/80"
            >
              <div class="w-4 h-4 border rounded flex items-center justify-center shrink-0" :class="isAllSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'">
                <svg v-if="isAllSelected" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span class="font-medium text-slate-700">全选</span>
            </li>
            
            <li 
              v-for="option in filteredOptions" 
              :key="option.value" 
              @click.stop="selectOption(option)" 
              class="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between gap-3"
              :class="{ 'bg-blue-50/50 text-blue-600 font-bold': isSelected(option.value) }"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <!-- Multi-select checkbox -->
                <div v-if="multiple" class="w-4 h-4 border rounded flex items-center justify-center shrink-0 transition-colors" :class="isSelected(option.value) ? 'bg-blue-500 border-blue-500' : 'border-slate-300'">
                   <svg v-if="isSelected(option.value)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span class="truncate">{{ option.label }}{{ suffix }}</span>
              </div>
              <!-- Single-select checkmark -->
              <svg v-if="!multiple && isSelected(option.value)" class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </li>
            
            <li v-if="filteredOptions.length === 0" class="px-4 py-6 text-sm text-slate-400 text-center">
              无匹配选项
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: [String, Number, Array],
  options: { type: Array, default: () => [] }, // 格式: [{ label: '2024', value: 2024 }]
  suffix: { type: String, default: '' }, // 后缀，比如 " 年"
  multiple: { type: Boolean, default: false },
  placeholder: { type: String, default: '请选择' }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)
const searchQuery = ref('')

watch(isOpen, (val) => {
  if (!val) searchQuery.value = ''
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => 
    String(o.label).toLowerCase().includes(q) || 
    String(o.value).toLowerCase().includes(q)
  )
})

const isSelected = (val) => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(val)
  }
  return props.modelValue === val
}

const isAllSelected = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue) || props.options.length === 0) return false
  return props.options.length === props.modelValue.length
})

const displayValue = computed(() => {
  if (props.multiple) {
    if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) return props.placeholder
    if (props.modelValue.length === props.options.length && props.options.length > 0) return '已选全部'
    if (props.modelValue.length === 1) {
      const opt = props.options.find(o => o.value === props.modelValue[0])
      return opt ? opt.label + props.suffix : props.modelValue[0] + props.suffix
    }
    return `已选 ${props.modelValue.length} 项`
  } else {
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return props.placeholder
    const opt = props.options.find(o => o.value === props.modelValue)
    return opt ? opt.label + props.suffix : props.modelValue + props.suffix
  }
})

const toggleAll = () => {
  if (isAllSelected.value) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', props.options.map(o => o.value))
  }
}

const selectOption = (opt) => {
  if (props.multiple) {
    let current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = current.indexOf(opt.value)
    if (index === -1) {
      current.push(opt.value)
    } else {
      current.splice(index, 1)
    }
    emit('update:modelValue', current)
    // Don't close isOpen when multiple
  } else {
    emit('update:modelValue', opt.value)
    isOpen.value = false
  }
}

// 点击外部区域自动关闭下拉框
const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.fade-down-enter-active, .fade-down-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-8px) scale(0.98); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
</style>