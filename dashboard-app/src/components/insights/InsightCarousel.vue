<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mt-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center px-6 py-4 border-b border-slate-100 bg-white gap-6">
      <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
        <span class="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
        {{ title }}
      </h2>
      
      <!-- Tab Controls (Always active, placed next to title) -->
      <div v-if="items.length > 1" class="flex flex-wrap gap-2 auto-cols-auto">
        <button 
          v-for="(item, index) in items" 
          :key="index"
          @click="currentIndex = index"
          :class="currentIndex === index ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'"
          class="px-4 py-1.5 text-[13px] font-bold rounded-lg border transition-all cursor-pointer tracking-wide"
        >
          {{ item.entity_id.split('_')[1] || item.entity_id }}
        </button>
      </div>
    </div>
    
    <!-- Body -->
    <div class="p-6">
      <transition name="slide-fade" mode="out-in">
        <div :key="currentItem.id" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <!-- Left: Chart/Visuals -->
          <div :class="currentItem.is_overall ? 'lg:col-span-12' : 'lg:col-span-7'" class="flex flex-col">
             <!-- Entity badge removed for all layout types -->
             <div class="flex-1 w-full flex items-center justify-center">
               <slot name="chart" :item="currentItem">
                  <!-- Fallback Placeholder -->
                  <div class="w-full h-full min-h-[300px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-3">
                    <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span>【{{ currentItem.entity_id.split('_')[1] || currentItem.entity_id }}】专属图表稍后开发</span>
                  </div>
               </slot>
             </div>
          </div>
          
          <!-- Right: Text Analysis -->
          <div v-if="!currentItem.is_overall" class="lg:col-span-5 flex flex-col h-full lg:border-l border-slate-100 lg:pl-8">
             <div class="ai-markdown flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-4 text-[15px]" v-html="parsedMarkdown"></div>
          </div>
          
          
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true, default: () => [] }
})

const currentIndex = ref(0)
const currentItem = computed(() => props.items[currentIndex.value] || {})

watch(() => props.items, () => {
   if (currentIndex.value >= props.items.length) {
     currentIndex.value = 0
   }
}, { deep: true })



const parsedMarkdown = computed(() => {
  return currentItem.value.insight_markdown ? marked.parse(currentItem.value.insight_markdown) : ''
})
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from {
  transform: translateX(10px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>
