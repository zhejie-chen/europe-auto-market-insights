<template>
  <div class="relative w-full" ref="selectRef">
    <div 
      @click="isOpen = !isOpen" 
      class="flex items-center justify-between w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-3 rounded-xl hover:border-blue-400 hover:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium text-sm select-none shadow-sm"
    >
      <span>{{ displayValue }}</span>
      <svg 
        class="w-4 h-4 text-slate-400 transition-transform duration-200" 
        :class="{ 'rotate-180': isOpen }" 
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>

    <transition name="fade-down">
      <div v-if="isOpen" class="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
        <ul class="py-1.5">
          <li 
            v-for="option in options" 
            :key="option.value" 
            @click="selectOption(option)" 
            class="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors flex items-center justify-between"
            :class="{ 'bg-blue-50/50 text-blue-600 font-bold': option.value === modelValue }"
          >
            {{ option.label }}{{ suffix }}
            <svg v-if="option.value === modelValue" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: Array, // 格式: [{ label: '2024', value: 2024 }]
  suffix: { type: String, default: '' } // 后缀，比如 " 年"
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)

const displayValue = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label + props.suffix : props.modelValue + props.suffix
})

const selectOption = (opt) => {
  emit('update:modelValue', opt.value)
  isOpen.value = false
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
.fade-down-enter-from, .fade-down-leave-to { opacity: 0; transform: translateY(-8px) scale0.98; }
</style>