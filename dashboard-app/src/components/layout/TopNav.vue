<template>
  <nav class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- 左侧 Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xl shadow-inner">
            E
          </div>
          <span class="font-extrabold text-xl text-slate-800 tracking-tight">欧洲汽车市场情报门户</span>
        </div>

        <!-- 居中/右侧 导航链接 -->
        <div class="hidden sm:flex sm:space-x-8">
          <span class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold border-transparent text-slate-300 cursor-not-allowed" title="暂未开放">
            首页
          </span>
          <span class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold border-transparent text-slate-300 cursor-not-allowed" title="暂未开放">
            每日新闻
          </span>
          <span class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold border-transparent text-slate-300 cursor-not-allowed" title="暂未开放">
            每周快报
          </span>
          <router-link 
            to="/resources/capacity" 
            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors"
            :class="[ $route.path === '/resources/capacity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300' ]"
          >
            产能梳理 (临时)
          </router-link>
          <router-link 
            to="/sales" 
            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors"
            :class="[ $route.path === '/sales' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300' ]"
          >
            月度销量
          </router-link>
          <router-link 
            to="/resources" 
            class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold transition-colors"
            :class="[ $route.path === '/resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300' ]"
          >
            行业资源
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>
