<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
    
    <!-- Hero / Carousel 区域 -->
    <div class="relative rounded-3xl overflow-hidden shadow-xl mb-12 h-[400px] bg-slate-900 group">
      <!-- 模拟轮播背景图 (使用纯色和渐变代替真实图片) -->
      <div class="absolute inset-0 bg-gradient-to-tr from-blue-900 via-slate-800 to-indigo-900 transition-opacity duration-1000" :class="{'opacity-0': activeSlide !== 0}"></div>
      <div class="absolute inset-0 bg-gradient-to-bl from-emerald-900 via-slate-800 to-teal-900 transition-opacity duration-1000" :class="{'opacity-0': activeSlide !== 1}"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-amber-900 via-slate-800 to-orange-900 transition-opacity duration-1000" :class="{'opacity-0': activeSlide !== 2}"></div>
      
      <!-- 背景网格纹理 -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>

      <!-- 内容区 -->
      <div class="absolute inset-0 flex flex-col justify-end p-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <transition name="slide-up" mode="out-in">
          <div :key="activeSlide" class="max-w-3xl">
            <span class="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
              {{ slides[activeSlide].tag }}
            </span>
            <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              {{ slides[activeSlide].title }}
            </h2>
            <p class="text-lg text-slate-300 font-medium line-clamp-2">
              {{ slides[activeSlide].desc }}
            </p>
          </div>
        </transition>
      </div>

      <!-- 轮播控制器 -->
      <div class="absolute bottom-10 right-10 flex gap-3">
        <button v-for="(slide, index) in slides" :key="index" @click="activeSlide = index" class="w-12 h-1.5 rounded-full transition-all duration-300 cursor-pointer" :class="activeSlide === index ? 'bg-white' : 'bg-white/30 hover:bg-white/50'"></button>
      </div>
    </div>

    <!-- 快捷入口卡片区 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <router-link to="/news" class="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">每日新闻</h3>
        <p class="text-sm text-slate-500">追踪欧洲汽车行业最新政策、动态与市场情报。</p>
      </router-link>

      <router-link to="/weekly" class="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">每周快报</h3>
        <p class="text-sm text-slate-500">每周深度简报，精华提炼，快速掌握市场脉络。</p>
      </router-link>

      <router-link to="/sales" class="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">月度销量</h3>
        <p class="text-sm text-slate-500">硬核数据看板，各车型、国家销量走势深度解析。</p>
      </router-link>

      <router-link to="/resources" class="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">行业资源</h3>
        <p class="text-sm text-slate-500">区域地图、行业术语与公共工具集。</p>
      </router-link>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const activeSlide = ref(0)
const slides = [
  { tag: '最新发布', title: '2026年3月欧洲新能源车销量报告正式上线', desc: '全面解析第一季度欧洲市场格局变化，插混车型渗透率再创新高，深度剖析中国品牌出海表现。' },
  { tag: '产业动态', title: '欧盟酝酿新一轮绿色补贴政策微调', desc: '知情人士透露，欧盟委员会正在讨论一项旨在加强本土供应链的补充草案，可能对合资企业提供更灵活的税率支持。' },
  { tag: '深度研报', title: '《欧洲八国充电基建现状白皮书》预告', desc: '团队历时三个月调研，带你一览德国、挪威等核心国家充电网络布局瓶颈与未来投资机遇。' }
]

let timer = null
const startAutoPlay = () => {
  timer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 5000)
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
