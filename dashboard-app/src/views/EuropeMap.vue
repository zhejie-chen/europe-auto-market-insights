<template>
  <div class="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] flex flex-col">
    
    <div class="flex items-center justify-between mb-4 shrink-0">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/resources')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors mr-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div class="w-1.5 h-6 bg-amber-500 rounded-full"></div>
        <h1 class="text-2xl font-extrabold text-slate-800">欧洲汽车市场区域划分地图</h1>
      </div>
    </div>

    <!-- Main Content Area: Map + Sidebar -->
    <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
      
      <!-- Map Container -->
      <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative flex flex-col">
        <!-- Legend overlays -->
        <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200">
          <div v-for="cat in categories" :key="cat.value" class="flex items-center gap-2 cursor-default group">
            <div class="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10" :style="{ backgroundColor: cat.color }"></div>
            <span class="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{ cat.name }} ({{ cat.count }}国)</span>
          </div>
        </div>
        
        <div ref="mapContainer" class="w-full h-full"></div>
      </div>

      <!-- Categories Sidebar -->
      <div class="w-full lg:w-[360px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 shrink-0 pb-4">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-2 shadow-sm">
          <p class="font-bold flex items-start gap-1.5">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>注：当前地图为宏观展示，部分微型国家（如摩纳哥、安道尔、梵蒂冈、圣马力诺等）未在地图上绘制色块，完整名单请参考下方列表。</span>
          </p>
        </div>

        <div v-for="cat in categories" :key="cat.value" class="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col shrink-0" :style="{ borderColor: cat.color + '40' }">
          <div class="px-4 py-2 flex items-center justify-between border-b" :style="{ backgroundColor: cat.color + '15', borderBottomColor: cat.color + '30' }">
            <h3 class="font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: cat.color }"></div>
              {{ cat.name }}
            </h3>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-sm">{{ cat.count }} 国</span>
          </div>
          <div class="p-3">
            <div class="flex flex-wrap gap-2">
              <span v-for="country in cat.displayList" :key="country" class="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-default whitespace-nowrap">
                {{ country }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import worldGeoJson from '../assets/world.json'

const mapContainer = ref(null)
let myChart = null

// 组织划分数据定义
const categories = [
  {
    name: '西欧',
    value: 1,
    color: '#d8b4e2', // 浅紫
    count: 9,
    displayList: ['德国', '法国', '比利时', '荷兰', '奥地利', '瑞士', '列支敦士登', '卢森堡', '摩纳哥'],
    searchList: ['Germany', 'France', 'Belgium', 'Netherlands', 'Austria', 'Switzerland', 'Liechtenstein', 'Luxembourg', 'Monaco']
  },
  {
    name: '南欧',
    value: 2,
    color: '#38bdf8', // 浅蓝
    count: 14,
    displayList: ['意大利', '西班牙', '葡萄牙', '希腊', '克罗地亚', '斯洛文尼亚', '塞尔维亚', '阿尔巴尼亚', '黑山', '北马其顿', '波斯尼亚和黑塞哥维那', '安道尔', '圣马力诺', '梵蒂冈'],
    searchList: ['Italy', 'Spain', 'Portugal', 'Greece', 'Croatia', 'Slovenia', 'Republic of Serbia', 'Serbia', 'Albania', 'Montenegro', 'Macedonia', 'North Macedonia', 'Bosnia and Herz.', 'Andorra', 'San Marino', 'Vatican']
  },
  {
    name: '北欧',
    value: 3,
    color: '#facc15', // 黄色
    count: 5,
    displayList: ['挪威', '瑞典', '芬兰', '丹麦', '冰岛'],
    searchList: ['Norway', 'Sweden', 'Finland', 'Denmark', 'Iceland']
  },
  {
    name: '东欧',
    value: 4,
    color: '#4ade80', // 绿色
    count: 10,
    displayList: ['波兰', '捷克', '罗马尼亚', '匈牙利', '斯洛伐克', '保加利亚', '立陶宛', '爱沙尼亚', '拉脱维亚', '摩尔多瓦'],
    searchList: ['Poland', 'Czech Republic', 'Czechia', 'Romania', 'Hungary', 'Slovakia', 'Bulgaria', 'Lithuania', 'Estonia', 'Latvia', 'Moldova']
  },
  {
    name: '右舵',
    value: 5,
    color: '#7e22ce', // 深紫
    count: 4,
    displayList: ['英国', '爱尔兰', '马耳他', '塞浦路斯'],
    searchList: ['United Kingdom', 'Ireland', 'Malta', 'Cyprus', 'Great Britain', 'England']
  },
  {
    name: '其他',
    value: 6,
    color: '#ef4444', // 红色
    count: 1,
    displayList: ['土耳其'],
    searchList: ['Turkey']
  }
]

const getRegionInfo = (countryName) => {
  for (const cat of categories) {
    if (cat.searchList.includes(countryName)) {
      return cat
    }
  }
  return null
}

onMounted(() => {
  if (!echarts.getMap('world_base')) {
    echarts.registerMap('world_base', worldGeoJson)
  }
  
  if (mapContainer.value) {
    myChart = echarts.init(mapContainer.value)

    const mapData = worldGeoJson.features.map(feature => {
      const name = feature.properties.name
      const regionInfo = getRegionInfo(name)
      return {
        name: name,
        value: regionInfo ? regionInfo.value : 0,
        regionInfo: regionInfo
      }
    })

    const pieces = categories.map(c => ({ value: c.value, color: c.color }))
    pieces.push({ value: 0, color: '#f1f5f9' }) // 其他无归属地区

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' },
        padding: 12,
        formatter: function (params) {
          if (!params.name) return ''
          const info = params.data && params.data.regionInfo
          if (!info) {
             return `<div class="font-bold text-lg text-slate-500">${params.name}</div>`
          }
          return `
            <div class="font-sans min-w-[140px]">
              <div class="font-bold text-lg mb-2 text-slate-800">${params.name}</div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${info.color}"></span>
                <span class="text-sm font-bold text-slate-600">${info.name}</span>
              </div>
            </div>
          `
        }
      },
      visualMap: {
        show: false,
        type: 'piecewise',
        pieces: pieces
      },
      series: [
        {
          name: 'Europe Regions',
          type: 'map',
          map: 'world_base',
          roam: true, 
          zoom: 3.5,
          center: [14, 50],
          scaleLimit: { min: 1.5, max: 20 },
          label: { show: false },
          itemStyle: {
            borderColor: '#e2e8f0',
            borderWidth: 0.6,
            areaColor: '#f8fafc'
          },
          emphasis: {
            itemStyle: {
              areaColor: '#fde047', 
              borderColor: '#eab308',
              borderWidth: 1.5
            },
            label: {
              show: true,
              color: '#1e293b',
              fontWeight: 'bold'
            }
          },
          data: mapData
        }
      ]
    }

    myChart.setOption(option)
    window.addEventListener('resize', handleResize)
  }
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
</style>
