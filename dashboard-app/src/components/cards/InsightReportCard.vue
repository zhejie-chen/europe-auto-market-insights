<template>
  <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 h-full flex flex-col">
    <h2 class="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2 flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      智能解读
    </h2>
    <div class="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap overflow-y-auto custom-scrollbar pr-2 flex-1">
      {{ commentary || '暂无当月解读内容。' }}
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  commentary: {
    type: String,
    default: ''
  }
})
</script>