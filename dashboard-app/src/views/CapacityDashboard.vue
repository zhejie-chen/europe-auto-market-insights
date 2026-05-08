<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
    
    <!-- 头部栏 -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/resources')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors mr-2 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div class="w-1.5 h-8 bg-blue-600 rounded-full shrink-0"></div>
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">欧洲整车产能梳理</h1>
          <p class="text-sm text-slate-500 font-medium mt-1">European Department Vehicle Capacity Dashboard</p>
        </div>
      </div>
      
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-slate-400">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>正在加载底层产能数据...</p>
    </div>

    <template v-else>
      <!-- KPI 栏 -->
      <div class="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-5 gap-4 mb-8">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">统计总产能 (辆/年)</span>
          <span class="text-2xl font-black text-slate-900">{{ formatNumber(kpi.totalCapacity) }}</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><span class="w-2 h-2 bg-blue-500 rounded-full"></span> 最新产量</span>
          <span class="text-2xl font-black text-slate-900">{{ formatNumber(kpi.productionLatest) }}</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 z-10">最新利用率</span>
          <span class="text-2xl font-black z-10" :class="getUtilizationColorText(kpi.totalCapacity ? kpi.productionLatest / kpi.totalCapacity : 0)">
            {{ formatPercent(kpi.totalCapacity ? kpi.productionLatest / kpi.totalCapacity : 0) }}
          </span>
          <div class="absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full" :class="getUtilizationColorText(kpi.totalCapacity ? kpi.productionLatest / kpi.totalCapacity : 0)"></div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">覆盖国家数</span>
          <span class="text-2xl font-black text-slate-900">{{ formatNumber(kpi.countries) }}</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">整车工厂记录数</span>
          <span class="text-2xl font-black text-slate-900">{{ formatNumber(kpi.plants) }}</span>
        </div>
      </div>

      <!-- 地图与主分析区 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        <!-- 左侧：欧洲产能热力图 -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col" style="height:600px">
          <div class="flex items-center justify-between mb-2 shrink-0">
            <h2 class="text-lg font-bold text-slate-800">欧洲各国整车产能热力图</h2>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-500">产能颜色梯度</span>
              <div class="w-24 h-2 bg-gradient-to-r from-slate-100 to-blue-700 rounded-full"></div>
            </div>
          </div>
          <p class="text-xs text-slate-400 mb-2 shrink-0">提示：点击国家可联动过滤右侧图表及下方数据</p>
          <!-- 地图容器必须有具体像素高度，Echarts 初始化时才能正确测量 -->
          <div class="relative w-full bg-slate-50 rounded-xl border border-slate-100" style="flex:1;min-height:480px">
            <div ref="mapContainer" class="absolute inset-0"></div>
            <!-- 图层控制 -->
            <div class="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm shadow border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">地图图层</span>
              <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="mapLayers.countryHeatmap" class="rounded text-blue-600 focus:ring-blue-500">
                国家产能底色
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" v-model="mapLayers.factoryPoints" class="rounded text-blue-600 focus:ring-blue-500">
                工厂点位
              </label>
            </div>
          </div>
        </div>

        <!-- 右侧：国家利用率与产能 (全量数据原生滚动) -->
        <div class="lg:col-span-5 flex flex-col gap-6" style="height:600px">
          
          <!-- 产能排行 (全量横向) -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <h2 class="text-lg font-bold text-slate-800 mb-2 shrink-0">国家总产能排行</h2>
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
              <div ref="topCapacityContainer" class="w-full" :style="{ height: getChartHeight() }"></div>
            </div>
          </div>

          <!-- 利用率排行 (全量横向) -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <div class="flex items-center justify-between mb-2 shrink-0">
              <h2 class="text-lg font-bold text-slate-800">国家产能利用率排行</h2>
              <div class="flex gap-2 text-[10px] font-bold">
                <span class="flex items-center gap-1 text-amber-500"><span class="w-2 h-2 rounded-full bg-amber-500"></span><50%</span>
                <span class="flex items-center gap-1 text-emerald-500"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>50-80%</span>
                <span class="flex items-center gap-1 text-emerald-800"><span class="w-2 h-2 rounded-full bg-emerald-800"></span>>80%</span>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
              <div ref="utilizationContainer" class="w-full" :style="{ height: getChartHeight() }"></div>
            </div>
          </div>

        </div>
      </div>

      <!-- OEM 分析板块 -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-slate-800">OEM 集团产能分析</h2>
          <span class="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold border border-blue-200">
            ℹ 基于集团归属与排他性分析
          </span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50">
              <tr class="border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th class="py-3 px-4 font-medium">集团 (OEM Group)</th>
                <th class="py-3 px-4 font-medium w-1/5">单一归属产能</th>
                <th class="py-3 px-4 font-medium text-right">归属利用率</th>
                <th class="py-3 px-4 font-medium text-right w-1/5">共享/不可归属产能</th>
                <th class="py-3 px-4 font-medium text-center">操作</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr v-if="paginatedOems.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400">没有符合筛选条件的集团数据</td>
              </tr>
              <tr v-for="oem in paginatedOems" :key="oem.oem_group" 
                  @click="openOemModal(oem.oem_group)"
                  class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <td class="py-3 px-4 font-bold text-slate-800">
                  <div class="flex items-center gap-2">
                    {{ oem.oem_group }}
                    <span v-if="oem.shared_capacity_not_attributed > 0" class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded cursor-help" title="该集团部分工厂与其他集团共用，无法确定真实占比，故该部分产能不计入单一归属产能。">
                      含共享
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-full bg-slate-100 rounded-full h-2 max-w-[120px]">
                      <div class="bg-blue-500 h-2 rounded-full" :style="{ width: getOemCapacityWidth(oem.dedicated_capacity_units_per_year) }"></div>
                    </div>
                    <span class="text-slate-600 font-medium w-16">{{ formatNumber(Math.round(oem.dedicated_capacity_units_per_year || 0)) }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-right font-bold" :class="getUtilizationColorText(oem.dedicated_utilization_latest_rate)">
                  {{ formatPercent(oem.dedicated_utilization_latest_rate) }}
                </td>
                <td class="py-3 px-4 text-right text-slate-500 font-mono text-xs">
                  {{ formatNumber(oem.shared_capacity_not_attributed) || '-' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <button @click.stop="openOemModal(oem.oem_group)" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors text-xs font-bold shadow-sm">
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- OEM 集团分页控件 -->
        <div v-if="totalPagesOem > 1" class="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
          <div class="text-sm text-slate-500">
            显示第 {{ (currentPageOem - 1) * pageSizeOem + 1 }} 到 {{ Math.min(currentPageOem * pageSizeOem, displayedOems.length) }} 条，共 {{ displayedOems.length }} 条集团记录
          </div>
          <div class="flex items-center gap-2">
            <button @click="currentPageOem--" :disabled="currentPageOem === 1" class="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              上一页
            </button>
            <span class="text-sm font-bold text-slate-700 px-3">第 {{ currentPageOem }} / {{ totalPagesOem }} 页</span>
            <button @click="currentPageOem++" :disabled="currentPageOem === totalPagesOem" class="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 工厂明细数据表 -->
      <div id="plants-table" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-lg font-bold text-slate-800">底层工厂明细记录 <span class="text-sm font-normal text-slate-500 ml-2">共 {{ filteredPlants.length }} 条记录</span></h2>
          
          <!-- 筛选器组 -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="w-36">
              <CustomSelect v-model="filters.country" :options="countryOptions" />
            </div>
            <div class="w-36">
              <CustomSelect v-model="filters.oem" :options="oemOptions" />
            </div>
            <div class="w-36">
              <CustomSelect v-model="filters.category" :options="categoryOptions" />
            </div>
            <div class="w-56">
              <CustomSelect v-model="filters.reliability" :options="reliabilityOptions" />
            </div>
            <div class="w-48">
              <CustomSelect v-model="filters.util" :options="utilOptions" />
            </div>
            <label class="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer ml-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors">
              <input type="checkbox" v-model="filters.ev" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
              <span class="font-medium select-none">仅 EV</span>
            </label>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200 mb-4">
          <table class="w-full text-left border-collapse min-w-[1200px]">
            <thead class="bg-slate-50">
              <tr class="text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                <th class="py-3 px-4 w-20">国家</th>
                <th class="py-3 px-4 w-24">状态</th>
                <th class="py-3 px-4 w-40">工厂名称</th>
                <th class="py-3 px-4 w-32">归并集团</th>
                <th class="py-3 px-4 w-24 text-center">共享产能</th>
                <th class="py-3 px-4 min-w-[280px]">类别</th>
                <th class="py-3 px-4 text-right">统计产能</th>
                <th class="py-3 px-4 text-right">最新产量</th>
                <th class="py-3 px-4 text-right">最新利用率</th>
                <th class="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-slate-100">
              <tr v-if="paginatedPlants.length === 0">
                <td colspan="10" class="py-8 text-center text-slate-400">没有符合筛选条件的工厂记录</td>
              </tr>
              <tr v-for="p in paginatedPlants" :key="p.plant_id" class="hover:bg-slate-50 transition-colors h-[72px] cursor-pointer" @click="openPlantModal(p)">
                <td class="py-3 px-4 text-slate-700 font-medium">{{ translateCountry(p.country_en) }}</td>
                <td class="py-3 px-4">
                  <span v-if="p.plant_status" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="p.plant_status === '正常' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                    {{ p.plant_status }}
                  </span>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="py-3 px-4 text-slate-900 font-bold truncate max-w-[200px]" :title="p.plant_name">
                  <div class="flex items-center gap-1.5">
                    {{ p.plant_name }}
                    <span v-if="p.is_ev_related_plant" class="inline-flex w-4 h-4 items-center justify-center bg-blue-100 text-blue-600 rounded-full text-[10px]" title="EV 相关">⚡</span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="(g, i) in parseJsonArray(p.oem_group_list).slice(0, 2)" :key="i" class="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{{ g }}</span>
                    <span v-if="parseJsonArray(p.oem_group_list).length > 2" class="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-400 rounded">...</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-center">
                  <span v-if="p.oem_group_count > 1" class="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="多集团共享">共享</span>
                  <span v-else class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="单一集团独占">单一</span>
                </td>
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="(c, i) in parseJsonArray(p.category_list)" :key="i" class="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">{{ c }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-800 font-medium">{{ p.capacity_counted_units_per_year ? formatNumber(p.capacity_counted_units_per_year) : '-' }}</td>
                <td class="py-3 px-4 text-right font-mono text-slate-500">{{ formatNumber((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) || '-' }}</td>
                <td class="py-3 px-4 text-right font-bold" :class="getUtilizationColorText(p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0)">
                  {{ formatPercent(p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0) }}
                </td>
                <td class="py-3 px-4 text-center">
                  <button @click.stop="openPlantModal(p)" class="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors text-xs font-bold shadow-sm">
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-slate-100 pt-4">
          <div class="text-sm text-slate-500">
            显示第 {{ (currentPage - 1) * pageSize + 1 }} 到 {{ Math.min(currentPage * pageSize, filteredPlants.length) }} 条，共 {{ filteredPlants.length }} 条
          </div>
          <div class="flex items-center gap-2">
            <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              上一页
            </button>
            <span class="text-sm font-bold text-slate-700 px-3">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 口径说明板块 -->
      <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-sm text-slate-600">
        <h3 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          统计口径与说明
        </h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>OEM 归属口径：</strong>OEM 已从原始品牌口径归并为集团口径。同一集团下多个品牌在同一工厂出现时只保留集团一次。对于多集团共用工厂，不再平均分摊产能，而是列为共享不可归属产能；关联工厂产能只代表覆盖面，不可跨集团加总。</li>
          <li><strong>最新产量：</strong>本页面展示的“最新产量”均为工厂 2024 年与 2025 年产量之总和统计。利用率同样基于此总产量除以总产能计算。</li>
          <li><strong>统计范围：</strong>包含欧洲部门界定范围内的整车工厂。已剔除俄罗斯、乌兹别克斯坦、哈萨克斯坦、乌克兰的数据，保留土耳其。</li>
          <li><strong>产能利用率公式：</strong>产量 / 产能。产能或产量为空的记录标记为“暂无数据”，不参与利用率计算。</li>
        </ul>
      </div>
    </template>

    <!-- OEM 详情弹窗 -->
    <div v-if="modalOem" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeOemModal"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 class="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span class="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{{ modalOem ? String(modalOem).charAt(0) : '?' }}</span>
            {{ modalOem }} 集团透视
          </h2>
          <button @click="closeOemModal" class="text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">

          <!-- 涉及国家列表 -->
          <div class="mb-8">
             <h3 class="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
               <span class="w-1 h-4 bg-blue-500 rounded-full"></span> 布局国家一览 ({{ modalData.countries.length }})
             </h3>
             <div class="flex flex-wrap gap-2 mb-4">
               <span v-for="c in modalData.countries" :key="c" class="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 shadow-sm">
                 {{ translateCountry(c) }}
               </span>
             </div>
             <div ref="modalMapContainer" class="w-full h-[300px] bg-slate-50 border border-slate-100 rounded-xl shadow-inner overflow-hidden"></div>
          </div>

          <!-- 相关工厂快览 -->
          <div class="flex-1 min-h-0 flex flex-col">
            <h3 class="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2 shrink-0">
               <span class="w-1 h-4 bg-emerald-500 rounded-full"></span> 工厂记录明细 ({{ modalData.plants.length }})
             </h3>
             <div class="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col min-h-[300px]">
               <div class="overflow-y-auto custom-scrollbar flex-1">
                 <table class="w-full text-left text-sm">
                   <thead class="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 sticky top-0 z-10 shadow-sm">
                     <tr>
                       <th class="py-3 px-4 font-medium w-24">国家</th>
                       <th class="py-3 px-4 font-medium w-32">状态</th>
                       <th class="py-3 px-4 font-medium">工厂名称</th>
                       <th class="py-3 px-4 font-medium text-right">产能 (辆/年)</th>
                       <th class="py-3 px-4 font-medium text-right">利用率</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-slate-100">
                     <tr v-for="p in modalData.plants" :key="p.plant_id" class="hover:bg-slate-50 cursor-pointer transition-colors" @click="openPlantModal(p)">
                       <td class="py-2 px-4">{{ translateCountry(p.country_en) }}</td>
                       <td class="py-2 px-4">
                         <span v-if="p.plant_status" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="p.plant_status === '正常' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                           {{ p.plant_status }}
                         </span>
                         <span v-else class="text-slate-300">-</span>
                       </td>
                       <td class="py-2 px-4 font-bold text-slate-700">{{ p.plant_name }}</td>
                       <td class="py-2 px-4 text-right font-mono">{{ p.capacity_counted_units_per_year ? formatNumber(p.capacity_counted_units_per_year) : '-' }}</td>
                       <td class="py-2 px-4 font-bold text-right" :class="getUtilizationColorText(p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0)">
                         {{ formatPercent(p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0) }}
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>

    <!-- 工厂详情弹窗 -->
    <div v-if="modalPlant" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closePlantModal"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <h2 class="text-xl font-black text-slate-800 flex items-center gap-3">
            <span class="text-2xl">🏭</span>
            {{ modalPlant.plant_name }}
          </h2>
          <button @click="closePlantModal" class="text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 p-2 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">国家</div>
              <div class="font-bold text-slate-800">{{ translateCountry(modalPlant.country_en) }} ({{ modalPlant.country_en }})</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">状态</div>
              <div class="font-bold">
                <span v-if="modalPlant.plant_status" class="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium" :class="modalPlant.plant_status === '正常' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                  {{ modalPlant.plant_status }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </div>
            </div>
          </div>

          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-blue-600/70 uppercase tracking-wider mb-1">统计产能 (辆/年)</div>
              <div class="text-xl font-mono font-black text-blue-700">{{ modalPlant.capacity_counted_units_per_year ? formatNumber(modalPlant.capacity_counted_units_per_year) : '-' }}</div>
            </div>
            <div>
              <div class="text-xs text-blue-600/70 uppercase tracking-wider mb-1">最新产量</div>
              <div class="text-xl font-mono font-bold text-blue-600">{{ formatNumber((modalPlant.production_2025_units_per_year || 0) + (modalPlant.production_2024_units_per_year || 0)) || '-' }}</div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">归并集团</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="(g, i) in parseJsonArray(modalPlant.oem_group_list)" :key="i" class="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 rounded-md">{{ g }}</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">原始品牌</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="(b, i) in parseJsonArray(modalPlant.oem_list)" :key="i" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200 rounded-md">{{ b }}</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">工厂类别</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="(c, i) in parseJsonArray(modalPlant.category_list)" :key="i" class="px-2.5 py-1 bg-amber-50 text-amber-700 text-sm font-medium border border-amber-100 rounded-md">{{ c }}</span>
                <span v-if="modalPlant.is_ev_related_plant" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100 rounded-md flex items-center gap-1">
                  ⚡ EV相关
                </span>
              </div>
            </div>
          </div>

          <div v-if="modalPlant.notes" class="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div class="text-xs text-amber-700/70 uppercase tracking-wider mb-1">备注</div>
            <div class="text-sm text-amber-900 leading-relaxed">{{ modalPlant.notes }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮清除筛选按钮 -->
    <transition name="fade">
      <button 
        v-if="hasActiveFilters" 
        @click="resetFilters" 
        class="fixed bottom-8 right-8 z-[100] flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl hover:bg-slate-700 hover:-translate-y-1 hover:shadow-blue-900/20 transition-all duration-300 group"
      >
        <svg class="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        <span class="font-bold">清除全局筛选</span>
      </button>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { supabase } from '../supabase'
import * as echarts from 'echarts'
import worldGeoJson from '../assets/world.json'
import { translateCountry } from '../utils/countryMapping'
import CustomSelect from '../components/ui/CustomSelect.vue'

const parseJsonArray = (str) => {
  if (!str) return []
  if (Array.isArray(str)) return str
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : [str]
  } catch(e) {
    return [str]
  }
}

const loading = ref(true)

// 原始数据
const dbCountries = ref([])
const dbOems = ref([])
const dbPlants = ref([])

// 弹窗状态
const modalOem = ref(null)
const modalPlant = ref(null)
const modalData = reactive({ countries: [], plants: [] })

// KPI 数据
const kpi = reactive({
  totalCapacity: 0,
  productionLatest: 0,
  countries: 0,
  plants: 0,
  evPlants: 0
})

// 筛选状态
const filters = reactive({
  country: '',
  oem: '',
  category: '',
  reliability: '',
  ev: false,
  util: ''
})

// 地图图层开关
const mapLayers = reactive({
  countryHeatmap: true,
  factoryPoints: true
})

watch(mapLayers, () => {
  updateCharts()
}, { deep: true })

// 分页状态 (工厂)
const currentPage = ref(1)
const pageSize = 15

// 分页状态 (OEM集团)
const currentPageOem = ref(1)
const pageSizeOem = 15

watch(filters, () => {
  currentPage.value = 1
  currentPageOem.value = 1
  updateCharts()
}, { deep: true })

watch(() => [modalOem.value, modalPlant.value], ([oem, plant]) => {
  if (oem || plant) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const hasActiveFilters = computed(() => {
  return filters.country !== '' || filters.oem !== '' || filters.category !== '' || filters.ev || filters.util !== '' || filters.reliability !== ''
})

// 引用 DOM
const mapContainer = ref(null)
const topCapacityContainer = ref(null)
const utilizationContainer = ref(null)
const modalMapContainer = ref(null)

let mapChart = null
let topCapChart = null
let utilChart = null
let modalMapChart = null

const resetFilters = () => {
  filters.country = ''
  filters.oem = ''
  filters.category = ''
  filters.reliability = ''
  filters.ev = false
  filters.util = ''
}

// 格式化函数
const formatNumber = (num) => {
  if (num === null || num === undefined || num === 0) return ''
  return new Intl.NumberFormat('en-US').format(num)
}

const formatPercent = (val) => {
  if (val === null || val === undefined) return '-'
  return (val * 100).toFixed(1) + '%'
}

// 颜色语义判定
const getUtilizationColorText = (val) => {
  if (val === null || val === undefined) return 'text-slate-400'
  if (val < 0.5) return 'text-amber-500' 
  if (val <= 0.8) return 'text-emerald-500' 
  return 'text-emerald-800' 
}

const getUtilizationColorHex = (val) => {
  if (val === null || val === undefined) return '#94a3b8'
  if (val < 0.5) return '#f59e0b'
  if (val <= 0.8) return '#10b981'
  return '#065f46'
}

// 获取某一年的单一归属产能 (保留历史弹窗的计算逻辑)
const getYearlyCapacity = (oemName, year) => {
  if (!oemName) return null
  const safeName = Array.isArray(oemName) ? oemName[0] : String(oemName)
  const oemPlants = dbPlants.value.filter(p => p.oem_group_list && p.oem_group_list.includes(safeName) && (p.production_year_extracted === year || p.production_year === year))
  let total = 0
  oemPlants.forEach(p => {
    if (p.oem_group_count === 1) {
      total += (p.capacity_counted_units_per_year || 0)
    }
  })
  return total === 0 ? null : total
}

// 修正后的进度条计算（修复0值和Max基准）
const getOemCapacityWidth = (cap) => {
  if (!dbOems.value.length || !cap) return '0%'
  const maxCap = Math.max(...dbOems.value.map(o => o.dedicated_capacity_units_per_year || 0))
  if (maxCap === 0) return '0%'
  return Math.min((cap / maxCap) * 100, 100) + '%'
}

// 可选的筛选列表
// 获取应用了其他筛选器（排除指定筛选器）后的工厂列表
const getFilteredPlantsFor = (excludeFilter) => {
  return dbPlants.value.filter(p => {
    if (excludeFilter !== 'country' && filters.country && p.country_en !== filters.country) return false
    
    if (excludeFilter !== 'oem' && filters.oem) {
      const oemArr = parseJsonArray(p.oem_group_list)
      if (!oemArr.includes(filters.oem)) return false
    }

    if (excludeFilter !== 'category' && filters.category) {
      const catArr = parseJsonArray(p.category_list)
      if (!catArr.includes(filters.category)) return false
    }

    if (excludeFilter !== 'ev' && filters.ev && !p.is_ev_related_plant) return false
    
    if (excludeFilter !== 'reliability' && filters.reliability === 'dedicated' && p.oem_group_count !== 1) return false
    if (excludeFilter !== 'reliability' && filters.reliability === 'shared' && p.oem_group_count <= 1) return false
    
    if (excludeFilter !== 'util' && filters.util) {
      const utilRate = p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0
      if (filters.util === 'low' && utilRate >= 0.5) return false
      if (filters.util === 'normal' && (utilRate < 0.5 || utilRate > 0.8)) return false
      if (filters.util === 'high' && utilRate <= 0.8) return false
    }
    return true
  })
}

// 动态联动的可选筛选列表
const availableCountries = computed(() => {
  return [...new Set(getFilteredPlantsFor('country').map(p => p.country_en))].sort()
})

const availableOems = computed(() => {
  const oems = new Set()
  getFilteredPlantsFor('oem').forEach(p => {
    parseJsonArray(p.oem_group_list).forEach(g => oems.add(g))
  })
  return [...oems].sort()
})

const availableCategories = computed(() => {
  const cats = new Set()
  getFilteredPlantsFor('category').forEach(p => {
    parseJsonArray(p.category_list).forEach(c => cats.add(c))
  })
  return [...cats].sort()
})

// CustomSelect Options
const countryOptions = computed(() => [
  { label: '所有国家', value: '' },
  ...availableCountries.value.map(c => ({ label: translateCountry(c), value: c }))
])

const oemOptions = computed(() => [
  { label: '所有集团', value: '' },
  ...availableOems.value.map(o => ({ label: o, value: o }))
])

const categoryOptions = computed(() => [
  { label: '所有类别', value: '' },
  ...availableCategories.value.map(c => ({ label: c, value: c }))
])

const reliabilityOptions = [
  { label: '产能归属可靠性 (全部)', value: '' },
  { label: '可归属为主 (单一集团)', value: 'dedicated' },
  { label: '含共享不可归属 (多集团共用)', value: 'shared' }
]

const utilOptions = [
  { label: '最新利用率 (所有)', value: '' },
  { label: '< 50% (低负荷)', value: 'low' },
  { label: '50% - 80% (正常)', value: 'normal' },
  { label: '> 80% (高负荷)', value: 'high' }
]

// 计算过滤后的工厂列表
const filteredPlants = computed(() => {
  return dbPlants.value.filter(p => {
    if (filters.country && p.country_en !== filters.country) return false
    
    if (filters.oem) {
      const oemArr = parseJsonArray(p.oem_group_list)
      if (!oemArr.includes(filters.oem)) return false
    }

    if (filters.category) {
      const catArr = parseJsonArray(p.category_list)
      if (!catArr.includes(filters.category)) return false
    }

    if (filters.ev && !p.is_ev_related_plant) return false
    
    if (filters.reliability === 'dedicated' && p.oem_group_count !== 1) return false
    if (filters.reliability === 'shared' && p.oem_group_count <= 1) return false
    
    if (filters.util) {
      const utilRate = p.capacity_counted_units_per_year ? ((p.production_2025_units_per_year || 0) + (p.production_2024_units_per_year || 0)) / p.capacity_counted_units_per_year : 0
      if (filters.util === 'low' && utilRate >= 0.5) return false
      if (filters.util === 'normal' && (utilRate < 0.5 || utilRate > 0.8)) return false
      if (filters.util === 'high' && utilRate <= 0.8) return false
    }
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredPlants.value.length / pageSize))
const paginatedPlants = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPlants.value.slice(start, start + pageSize)
})



// 修正后的 OEM 列表展示
const displayedOems = computed(() => {
  let list = dbOems.value
  
  // 地图联动过滤 OEM
  if (filters.country) {
    const oemsInCountry = new Set()
    dbPlants.value.forEach(p => {
      if (p.country_en === filters.country) {
        parseJsonArray(p.oem_group_list).forEach(g => oemsInCountry.add(g))
      }
    })
    list = list.filter(o => oemsInCountry.has(o.oem_group))
  }

  // 强制显式降序排列，避免 Null 置顶
  return list.sort((a, b) => (b.dedicated_capacity_units_per_year || 0) - (a.dedicated_capacity_units_per_year || 0))
})

const totalPagesOem = computed(() => Math.ceil(displayedOems.value.length / pageSizeOem))
const paginatedOems = computed(() => {
  const start = (currentPageOem.value - 1) * pageSizeOem
  return displayedOems.value.slice(start, start + pageSizeOem)
})

const openOemModal = (oemGroup) => {
  modalOem.value = oemGroup
  
  // 查找该集团所有的工厂
  const relatedPlants = dbPlants.value.filter(p => {
    const oemArr = parseJsonArray(p.oem_group_list)
    return oemArr.includes(oemGroup)
  })
  
  modalData.plants = relatedPlants
  modalData.countries = [...new Set(relatedPlants.map(p => p.country_en))].sort()

  nextTick(() => {
    if (modalMapContainer.value) {
      if (modalMapChart) {
        modalMapChart.dispose()
      }
      modalMapChart = echarts.init(modalMapContainer.value)
      
      const countryCapacityMap = {}
      relatedPlants.forEach(p => {
        if (!countryCapacityMap[p.country_en]) countryCapacityMap[p.country_en] = 0
        countryCapacityMap[p.country_en] += (p.capacity_counted_units_per_year || 0)
      })

      const mapData = modalData.countries.map(c => ({
        name: c,
        value: countryCapacityMap[c],
        rawData: c
      }))

      const maxCap = Math.max(...Object.values(countryCapacityMap))

      modalMapChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: p => {
            if (!p.data) return translateCountry(p.name)
            return `${translateCountry(p.name)}: ${formatNumber(p.data.value)} 辆/年`
          }
        },
        visualMap: {
          left: 10, bottom: 10, min: 0, max: maxCap || 1,
          inRange: { color: ['#eff6ff', '#bfdbfe', '#3b82f6', '#1d4ed8'] },
          text: ['产能高', '产能低'],
          calculable: true,
          itemWidth: 10, itemHeight: 60,
          textStyle: { fontSize: 10 }
        },
        series: [{
          type: 'map',
          map: 'world_base',
          roam: true,
          zoom: 5.0,
          center: [14, 50],
          scaleLimit: { min: 1.5, max: 20 },
          itemStyle: { borderColor: '#d1d5db', borderWidth: 0.4, areaColor: '#f1f5f9' },
          emphasis: {
            itemStyle: { areaColor: '#fde047' },
            label: { show: true, formatter: p => translateCountry(p.name) }
          },
          data: mapData
        }]
      })
    }
  })
}

const closeOemModal = () => {
  modalOem.value = null
  if (modalMapChart) {
    modalMapChart.dispose()
    modalMapChart = null
  }
}

const openPlantModal = (plant) => {
  modalPlant.value = plant
}

const closePlantModal = () => {
  modalPlant.value = null
}

const fetchData = async () => {
  loading.value = true
  try {
    const [countriesRes, oemsRes, plantsRes] = await Promise.all([
      supabase.from('vehicle_capacity_country_summary').select('*').order('total_capacity_units_per_year', { ascending: false }),
      supabase.from('vehicle_capacity_oem_summary').select('*').order('dedicated_capacity_units_per_year', { ascending: false, nullsFirst: false }),
      supabase.from('vehicle_capacity_plants').select('*').eq('is_in_department_scope', true).eq('is_vehicle_plant', true).order('capacity_counted_units_per_year', { ascending: false, nullsFirst: false })
    ])

    if (countriesRes.data) dbCountries.value = countriesRes.data
    if (oemsRes.data) dbOems.value = oemsRes.data
    if (plantsRes.data) dbPlants.value = plantsRes.data

    // 计算全局 KPI
    kpi.totalCapacity = dbCountries.value.reduce((sum, c) => sum + (c.total_capacity_units_per_year || 0), 0)
    kpi.productionLatest = dbCountries.value.reduce((sum, c) => sum + (c.production_2025_units_per_year || 0) + (c.production_2024_units_per_year || 0), 0)
    kpi.countries = dbCountries.value.filter(c => c.total_capacity_units_per_year > 0).length
    kpi.plants = dbPlants.value.length
    kpi.evPlants = dbPlants.value.filter(p => p.is_ev_related_plant).length

  } catch (error) {
    console.error("Error fetching data:", error)
  } finally {
    loading.value = false
    nextTick(() => {
      initCharts()
    })
  }
}

// 动态图表高度计算
const validCountryList = computed(() => dbCountries.value.filter(c => c.total_capacity_units_per_year > 0))
const getChartHeight = () => {
  return Math.max(260, validCountryList.value.length * 22) + 'px'
}

const initCharts = () => {
  // 注册世界地图，作为底图以避免截断和扭曲
  if (!echarts.getMap('world_base')) {
    echarts.registerMap('world_base', worldGeoJson)
  }

  if (mapContainer.value) mapChart = echarts.init(mapContainer.value)
  if (topCapacityContainer.value) topCapChart = echarts.init(topCapacityContainer.value)
  if (utilizationContainer.value) utilChart = echarts.init(utilizationContainer.value)

  updateCharts()

  if (mapChart) {
    mapChart.on('click', (params) => {
      if (params.name) {
        if (filters.country === params.name) {
          filters.country = ''
        } else {
          filters.country = params.name
        }
      }
    })
  }

  // 延迟一帧再 resize，确保 Echarts 在容器跟画完成后重新测量
  requestAnimationFrame(() => {
    if (mapChart) mapChart.resize()
    if (topCapChart) topCapChart.resize()
    if (utilChart) utilChart.resize()
  })

  window.addEventListener('resize', handleResize)
}

const updateCharts = () => {
  if (!dbCountries.value.length) return

  // 1. 地图 (修复缩放截断问题)
  if (mapChart) {
    const mapData = dbCountries.value.map(c => ({
      name: c.country_en,
      value: c.total_capacity_units_per_year,
      rawData: c
    }))

    const maxCap = Math.max(...mapData.map(d => d.value || 0))
    const maxPlantCap = Math.max(...dbPlants.value.map(p => p.capacity_counted_units_per_year || 0))
    
    const scatterData = dbPlants.value
      .filter(p => p.geocode_status === 'matched' && p.latitude && p.longitude)
      .map(p => {
        let color = '#3b82f6' // 正常 blue
        if (p.plant_status === '停产') color = '#ef4444' // red
        else if (p.plant_status === '疑似停产') color = '#f59e0b' // orange
        else if (p.plant_status === '正常') color = '#10b981' // green
        
        let size = 4
        if (maxPlantCap > 0 && p.capacity_counted_units_per_year) {
          size = 4 + (p.capacity_counted_units_per_year / maxPlantCap) * 11 // 4 to 15
        }

        return {
          name: p.plant_name,
          value: [p.longitude, p.latitude, p.capacity_counted_units_per_year || 0],
          itemStyle: { color, borderColor: 'white', borderWidth: 0.5 },
          symbolSize: size,
          rawData: p
        }
      })

    mapChart.setOption({
      geo: {
        map: 'world_base',
        roam: true,
        zoom: 3.0,
        center: [14, 50],
        scaleLimit: { min: 1.5, max: 20 },
        itemStyle: { borderColor: '#d1d5db', borderWidth: 0.4, areaColor: '#f1f5f9' },
        emphasis: {
          itemStyle: { areaColor: '#fde047', borderColor: '#eab308' },
          label: { show: true, formatter: (p) => translateCountry(p.name) }
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' },
        formatter: (params) => {
          if (params.seriesType === 'scatter') {
            const p = params.data.rawData
            return `
              <div class="font-sans min-w-[200px]">
                <div class="font-bold text-sm mb-1 border-b border-slate-200 pb-1">${p.plant_name}</div>
                <div class="text-xs text-slate-700 font-medium mb-2 pb-1 border-b border-slate-100 whitespace-normal break-words">${parseJsonArray(p.oem_group_list).join(' · ')}</div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span class="text-slate-500">国家:</span> <span class="font-bold text-slate-800 text-right">${translateCountry(p.country_en)}</span>
                  <span class="text-slate-500">状态:</span> <span class="font-bold text-slate-800 text-right">${p.plant_status || '-'}</span>
                  <span class="text-slate-500">统计产能:</span> <span class="font-bold text-slate-800 text-right">${formatNumber(p.capacity_counted_units_per_year)}</span>
                  ${p.production_2025_units_per_year != null 
                    ? `<span class="text-slate-500">2025产量:</span> <span class="font-bold text-slate-800 text-right">${formatNumber(p.production_2025_units_per_year)}</span>` 
                    : p.production_2024_units_per_year != null 
                      ? `<span class="text-slate-500">2024产量:</span> <span class="font-bold text-slate-800 text-right">${formatNumber(p.production_2024_units_per_year)}</span>`
                      : `<span class="text-slate-500">最新产量:</span> <span class="font-bold text-slate-800 text-right">-</span>`}
                  <span class="text-slate-500">坐标来源:</span> <span class="font-bold text-slate-800 text-right">${p.geocode_source || '-'}</span>
                </div>
                <div class="mt-2 text-[10px] text-slate-400 break-words max-w-[250px] leading-tight">${p.address || ''}</div>
              </div>
            `
          }

          if (!params.data) return translateCountry(params.name)
          const c = params.data.rawData
          const utilRate = c.total_capacity_units_per_year ? ((c.production_2025_units_per_year || 0) + (c.production_2024_units_per_year || 0)) / c.total_capacity_units_per_year : 0
          
          return `
            <div class="font-sans min-w-[200px]">
              <div class="font-bold text-lg mb-2 border-b border-slate-200 pb-1">${translateCountry(c.country_en)}</div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span class="text-slate-500">统计产能:</span> <span class="font-bold text-slate-800 text-right">${formatNumber(c.total_capacity_units_per_year)}</span>
                <span class="text-slate-500">最新产量:</span> <span class="font-bold text-slate-800 text-right">${formatNumber((c.production_2025_units_per_year || 0) + (c.production_2024_units_per_year || 0))}</span>
                <span class="text-slate-500">最新利用率:</span> <span class="font-bold ${getUtilizationColorText(utilRate)} text-right">${formatPercent(utilRate)}</span>
                <span class="text-slate-500">记录工厂数:</span> <span class="font-bold text-slate-800 text-right">${(c.normal_plant_records || 0) + (c.stopped_plant_records || 0) + (c.suspected_stopped_plant_records || 0)}</span>
                <span class="text-slate-500">已匹配坐标:</span> <span class="font-bold text-blue-600 text-right">${c.geocoded_plant_records || 0}</span>
              </div>
            </div>
          `
        }
      },
      visualMap: {
        show: mapLayers.countryHeatmap,
        left: 10,
        bottom: 20,
        min: 0,
        max: maxCap,
        inRange: { color: ['#f8fafc', '#bfdbfe', '#3b82f6', '#1d4ed8', '#1e3a8a'] },
        text: ['High', 'Low'],
        calculable: true,
        textStyle: { fontSize: 10 }
      },
      series: [
        {
          name: 'Capacity',
          type: 'map',
          geoIndex: 0,
          data: mapLayers.countryHeatmap ? mapData : []
        },
        {
          name: 'Factories',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: mapLayers.factoryPoints ? scatterData : []
        }
      ]
    })
  }

  // 准备全量图表排序数据
  const sortedCountries = [...validCountryList.value].sort((a, b) => a.total_capacity_units_per_year - b.total_capacity_units_per_year) // 升序，以便在 yAxis 从下到上排列

  // 2. 产能排行 (全量横向柱状图)
  if (topCapChart) {
    topCapChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '10%', bottom: '2%', top: '2%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { 
        type: 'category', 
        data: sortedCountries.map(c => translateCountry(c.country_en)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontWeight: 'bold', color: '#475569' }
      },
      series: [{
        type: 'bar',
        data: sortedCountries.map(c => c.total_capacity_units_per_year),
        itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: (p) => formatNumber(p.value),
          fontSize: 10
        }
      }]
    })
  }

  // 3. 利用率排行 (全量横向柱状图)
  if (utilChart) {
    // 重新排序利用率数据
    const utilSorted = [...validCountryList.value]
      .map(c => ({
        country: c.country_en,
        val: c.total_capacity_units_per_year ? ((c.production_2025_units_per_year || 0) + (c.production_2024_units_per_year || 0)) / c.total_capacity_units_per_year : 0
      }))
      .filter(c => c.val !== null && c.val !== undefined)
      .sort((a, b) => a.val - b.val) // 升序

    utilChart.setOption({
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const val = params[0].value
          return `${params[0].name}: <span style="font-weight:bold">${formatPercent(val)}</span>`
        }
      },
      grid: { left: '3%', right: '10%', bottom: '2%', top: '2%', containLabel: true },
      xAxis: { type: 'value', show: false },
      yAxis: { 
        type: 'category', 
        data: utilSorted.map(c => translateCountry(c.country)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontWeight: 'bold', color: '#475569' }
      },
      series: [{
        type: 'bar',
        data: utilSorted.map(c => ({
          value: c.val,
          itemStyle: { color: getUtilizationColorHex(c.val) }
        })),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: (p) => formatPercent(p.value),
          fontSize: 10,
          fontWeight: 'bold'
        }
      }]
    })
  }
}

const handleResize = () => {
  if (mapChart) mapChart.resize()
  if (topCapChart) topCapChart.resize()
  if (utilChart) utilChart.resize()
}

onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (mapChart) mapChart.dispose()
  if (topCapChart) topCapChart.dispose()
  if (utilChart) utilChart.dispose()
})

</script>

<style scoped>
/* 隐藏横向滚动条保留功能 */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.overflow-x-auto:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}

/* 纵向细滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}

/* 弹窗动画 */
.animate-fade-in-up {
  animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
