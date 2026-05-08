<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-6 bg-purple-500 rounded-full"></div>
        <h1 class="text-2xl font-extrabold text-slate-800">每周快报画廊</h1>
      </div>
      <button class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        按月份筛选
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      
      <!-- 静态 Mock 卡片 1 -->
      <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
        <div class="aspect-[16/9] bg-slate-100 relative overflow-hidden flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          <svg class="w-12 h-12 text-indigo-300 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
            W16 / 2026
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">2026年第16周欧洲车市快报：插混车型环比激增</h3>
          <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">本周欧洲八大核心市场新能源渗透率达到28.5%，其中插电式混合动力车型表现抢眼...</p>
          <div class="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
            <span class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">A</span>
            <span class="text-xs text-slate-400 font-medium">分析师团队 • 2天前</span>
          </div>
        </div>
      </div>

      <!-- 静态 Mock 卡片 2 -->
      <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
        <div class="aspect-[16/9] bg-slate-100 relative overflow-hidden flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          <svg class="w-12 h-12 text-emerald-300 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
            W15 / 2026
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">2026年第15周政策跟踪：多国收紧补贴力度</h3>
          <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">汇总本周德、法、意三国关于新能源购车补贴的最新草案，纯电车型退坡趋势明显...</p>
          <div class="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">P</span>
            <span class="text-xs text-slate-400 font-medium">政策组 • 1周前</span>
          </div>
        </div>
      </div>

      <!-- 静态 Mock 卡片 3 -->
      <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col">
        <div class="aspect-[16/9] bg-slate-100 relative overflow-hidden flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          <svg class="w-12 h-12 text-amber-300 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
            W14 / 2026
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="text-base font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">2026年第14周品牌洞察：中国品牌出海攻势</h3>
          <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">本周重点关注上汽MG、比亚迪与吉利在欧洲的渠道扩张与库存消化周期分析...</p>
          <div class="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
            <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">M</span>
            <span class="text-xs text-slate-400 font-medium">竞品分析组 • 2周前</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
