<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
    
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-6 bg-amber-500 rounded-full"></div>
        <h1 class="text-2xl font-extrabold text-slate-800">行业资源库</h1>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- 资源卡片 1：区域划分标准 -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200 relative">
          <!-- 静态占位地图样式 -->
          <svg class="w-24 h-24 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9InJnYmEoMCwwLDAsMC4wMikiLz48L3N2Zz4=')] opacity-20"></div>
        </div>
        <div class="p-6 flex-1">
          <h3 class="text-lg font-bold text-slate-800 mb-2">欧洲区域划分标准 (地图)</h3>
          <p class="text-sm text-slate-500 mb-4">包含北欧、西欧、南欧、东欧的具体国家归属列表，用于统一数据分析时的地理维度。</p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">27国标准</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">EFTA</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">UK</span>
          </div>
          <button @click="$router.push('/resources/map')" class="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
            查看详情
          </button>
        </div>
      </div>

      <!-- 资源卡片 2：产能看板 -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200 relative">
          <svg class="w-24 h-24 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        </div>
        <div class="p-6 flex-1">
          <h3 class="text-lg font-bold text-slate-800 mb-2">欧洲整车产能梳理</h3>
          <p class="text-sm text-slate-500 mb-4">企业级欧洲区域整车工厂产能分布、利用率监控及 OEM 多维分析综合报表。</p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">产能分析</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">利用率</span>
            <span class="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">New</span>
          </div>
          <button @click="$router.push('/resources/capacity')" class="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
            进入看板
          </button>
        </div>
      </div>

      <!-- 资源卡片 3：上下班状态地图 -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200 relative">
          <svg class="w-24 h-24 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v4m0 0l2-2m-2 2l-2-2"></path></svg>
        </div>
        <div class="p-6 flex-1 flex flex-col">
          <h3 class="text-lg font-bold text-slate-800 mb-2">欧洲放休假 + 上下班状态地图</h3>
          <p class="text-sm text-slate-500 mb-4 flex-1">欧洲各国当前本地时间、是否处于工作时间、当天公共假期状态及日历。</p>
          <div class="flex flex-wrap gap-2 mb-4">
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">假期查询</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">上下班状态</span>
            <span class="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold">New Tool</span>
          </div>
          <button @click="$router.push('/resources/working-status-map')" class="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors mt-auto">
            进入工具
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
