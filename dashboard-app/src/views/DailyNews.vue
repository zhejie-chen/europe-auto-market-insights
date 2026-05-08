<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
    
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-6 bg-blue-500 rounded-full"></div>
        <h1 class="text-2xl font-extrabold text-slate-800">每日新闻电讯</h1>
      </div>
      <div class="hidden md:flex gap-2 text-xs font-bold">
        <span class="px-2 py-1 bg-slate-900 text-white rounded">最新简报</span>
        <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded cursor-pointer hover:bg-slate-200">政策</span>
        <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded cursor-pointer hover:bg-slate-200">供应链</span>
        <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded cursor-pointer hover:bg-slate-200">品牌追踪</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- 左侧：今日头条 (Featured) -->
      <article class="lg:col-span-8 flex flex-col gap-4">
        <div class="aspect-[21/9] bg-slate-200 relative overflow-hidden group cursor-pointer">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 group-hover:from-slate-900/80 transition-all"></div>
          <div class="absolute inset-0 flex items-center justify-center text-slate-400">
            <!-- 占位图 -->
            <svg class="w-20 h-20 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
          </div>
          <div class="absolute bottom-6 left-6 right-6 z-20">
            <span class="text-red-500 font-bold text-xs uppercase tracking-widest bg-white px-2 py-1 mb-3 inline-block">头条新闻 / BREAKING</span>
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight">欧盟微调对华电动车反补贴税限制，合资车企或迎政策转机</h2>
          </div>
        </div>
        <div class="text-slate-600 text-[15px] leading-relaxed md:columns-2 gap-8 mt-2 text-justify">
          <p class="mb-4"><strong class="text-slate-900">布鲁塞尔电</strong> —— 据彭博社及内部知情人士透露，欧盟成员国正在密集讨论微调即将出台的新能源汽车关税政策。这项被视为缓和双边贸易摩擦积极信号的举措，将重点关注在华跨国合资车企的税率认定标准。</p>
          <p class="mb-4">此前，由于原产地规则及补贴溯源的严苛判定，多家依赖中国供应链的欧洲本土车企面临高额补充关税风险。新草案计划引入“技术附加值溯源”机制，对在核心三电技术上拥有自主知识产权或在欧洲有对等投资的合资企业给予税率减免或豁免通道。大众集团及斯特兰蒂斯等欧洲巨头此前曾多次游说，要求政策对“欧洲本土品牌的中国产地车型”网开一面。</p>
          <p>分析师指出，若该微调落实，不仅能缓解欧洲平价电动车供给不足的窘境，还将加速中国电池企业如宁德时代、比亚迪在欧洲本土的建厂步伐，以规避后续风险。</p>
        </div>
      </article>

      <!-- 右侧：实时快讯 (Latest Updates) -->
      <aside class="lg:col-span-4 border-l-4 border-slate-100 pl-6 h-full">
        <div class="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-800">
          <h3 class="text-lg font-black text-slate-900 uppercase">实时快讯 / 24H LIVE</h3>
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
        
        <ul class="space-y-4">
          <li class="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full pb-4 border-b border-slate-100 last:border-0">
            <time class="text-xs font-bold text-slate-400 block mb-1">10:30 AM</time>
            <h4 class="text-sm font-bold text-slate-800 leading-tight hover:text-blue-600 cursor-pointer">大众集团欧洲一季度纯电销量下滑15%，将重心转向插混过渡车型</h4>
          </li>
          <li class="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full pb-4 border-b border-slate-100 last:border-0">
            <time class="text-xs font-bold text-slate-400 block mb-1">09:15 AM</time>
            <h4 class="text-sm font-bold text-slate-800 leading-tight hover:text-blue-600 cursor-pointer">特斯拉德国工厂复产后产能爬坡缓慢，Model Y 欧洲交付周期拉长至 6 周</h4>
          </li>
          <li class="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full pb-4 border-b border-slate-100 last:border-0">
            <time class="text-xs font-bold text-slate-400 block mb-1">昨日 16:45</time>
            <h4 class="text-sm font-bold text-slate-800 leading-tight hover:text-blue-600 cursor-pointer">比亚迪正式宣布在匈牙利建设第二座乘用车工厂，预计2027年投产</h4>
          </li>
          <li class="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full pb-4 border-b border-slate-100 last:border-0">
            <time class="text-xs font-bold text-slate-400 block mb-1">昨日 14:20</time>
            <h4 class="text-sm font-bold text-slate-800 leading-tight hover:text-blue-600 cursor-pointer">ACEA: 3月欧洲商用车注册量微增2%，电动货车市占率突破8%</h4>
          </li>
           <li class="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full pb-4 border-b border-slate-100 last:border-0">
            <time class="text-xs font-bold text-slate-400 block mb-1">昨日 11:00</time>
            <h4 class="text-sm font-bold text-slate-800 leading-tight hover:text-blue-600 cursor-pointer">雷诺发布全新平价电动车 Twingo 概念图，起售价剑指 2 万欧元以内</h4>
          </li>
        </ul>
      </aside>

    </div>

    <!-- 底部：次要新闻网格 -->
    <div class="mt-12 pt-8 border-t border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article class="flex gap-4 group cursor-pointer">
          <div class="w-24 h-24 bg-slate-100 shrink-0 flex items-center justify-center text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">宝马宣布下一代 Neue Klasse 架构将支持固态电池无缝升级</h4>
            <p class="text-xs text-slate-500 line-clamp-2">宝马动力总成主管透露，虽然首批车型搭载液态锂电，但架构已为2030年大规模量产固态电池做好工程预留。</p>
          </div>
        </article>

        <article class="flex gap-4 group cursor-pointer">
          <div class="w-24 h-24 bg-slate-100 shrink-0 flex items-center justify-center text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">意大利恢复购车补贴计划，但排除部分“非欧盟生产”车型</h4>
            <p class="text-xs text-slate-500 line-clamp-2">意大利政府正式重启总额近10亿欧元的生态激励计划，但附加了严格的碳足迹评估条款。</p>
          </div>
        </article>

        <article class="flex gap-4 group cursor-pointer">
          <div class="w-24 h-24 bg-slate-100 shrink-0 flex items-center justify-center text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover:underline decoration-2 underline-offset-2">机构研报：插电混动在欧洲C级及以上细分市场取代柴油车成定局</h4>
            <p class="text-xs text-slate-500 line-clamp-2">JATO最新数据显示，在过去12个月中，PHEV在中大型车市场的份额首次全面超越传统柴油车型。</p>
          </div>
        </article>
      </div>
    </div>

  </div>
</template>
