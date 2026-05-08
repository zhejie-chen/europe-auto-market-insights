<template>
  <div class="w-full">
    
    <div v-if="loading" class="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
      <div class="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p>正在拉取 {{ year }}年{{ month }}月 {{ market }} 市场深度情报...</p>
    </div>

    <div v-else-if="insights.length === 0" class="h-64 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
      <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      <p>暂无当前维度的 AI 洞察数据，请检查 n8n 工作流是否已成功写入。</p>
    </div>

    <div v-else class="flex flex-col gap-8 pb-12">
      <!-- 第一类: 宏观与竞争 -->
      <InsightCarousel 
        v-if="macroGroup.length > 0"
        title="市场宏观与竞争结构分析"
        :items="macroGroup"
      >
        <template #chart="{ item }">
          <MacroTrendChart v-if="item.entity_id === '宏观_大盘'" :year="year" :month="month" :country="market" />
          <MacroStructureChart v-if="item.entity_id === '宏观_结构'" :year="year" :month="month" :country="market" />
          <MacroLandscapeChart v-if="item.entity_id === '竞争_格局'" :year="year" :month="month" :country="market" />
          <MacroElectrificationChart v-if="item.entity_id === '专项_电动化'" :year="year" :month="month" :country="market" />
        </template>
      </InsightCarousel>
      
      <!-- 第二类: 车企追踪 -->
      <InsightCarousel 
        v-if="companyGroup.length > 0"
        title="核心汽车品牌追踪与动态"
        :items="companyGroup"
      >
        <template #chart="{ item }">
          <CompanyOverallChart v-if="item.entity_id === '车企_总体'" :year="year" :month="month" :country="market" />
          <CompanyDetailChart v-else :year="year" :month="month" :country="market" :companyName="item.entity_id.split('_')[1] || item.entity_id" />
        </template>
      </InsightCarousel>
      
      <!-- 第三类: 异常观测 -->
      <div v-if="anomalyItem" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mt-4">
        <div class="flex items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span class="w-1.5 h-6 bg-rose-400 rounded-full inline-block"></span>
            异常预警与观测
          </h2>
        </div>
        <div class="p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
           <div class="lg:col-span-7 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col min-h-[350px]">
             <AnomalyObservationChart 
               :year="year" 
               :month="month" 
               :country="market" 
               :insightText="anomalyItem.insight_markdown" 
               @models-loaded="handleModelsLoaded"
               :hoveredModel="currentHoveredModel"
             />
           </div>
           <div class="lg:col-span-5 flex flex-col h-full lg:border-l border-slate-100 lg:pl-5 mt-4 lg:mt-0">
             <div class="font-extrabold text-slate-800 text-xs mb-4 uppercase tracking-widest text-opacity-50">观测详情解读</div>
             <div class="ai-markdown flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-4 text-[15px]" 
                  v-html="enhancedMarkdown" 
                  @mouseover="handleMouseOver" 
                  @mouseout="handleMouseOut"></div>
           </div>
        </div>
      </div>

      <!-- 第四类: 前瞻预测 -->
      <div v-if="predictItem" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mt-4">
        <div class="flex items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span class="w-1.5 h-6 bg-purple-500 rounded-full inline-block"></span>
            市场前瞻预测
          </h2>
        </div>
        <div class="p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
           <div class="lg:col-span-7 rounded-xl bg-slate-50 border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 min-h-[300px] gap-3">
             <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             【前瞻预测】专属图表稍后开发
           </div>
           <div class="lg:col-span-5 flex flex-col h-full lg:border-l border-slate-100 lg:pl-5 mt-4 lg:mt-0">
             <div class="font-extrabold text-slate-800 text-xs mb-4 uppercase tracking-widest text-opacity-50">预测详情解读</div>
             <div class="ai-markdown flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pr-4 text-[15px]" v-html="parseMarkdown(predictItem.insight_markdown)"></div>
           </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../../supabase'
import { marked } from 'marked'
import MacroTrendChart from './MacroTrendChart.vue'
import MacroStructureChart from './MacroStructureChart.vue'
import MacroLandscapeChart from './MacroLandscapeChart.vue'
import MacroElectrificationChart from './MacroElectrificationChart.vue'
import CompanyOverallChart from './CompanyOverallChart.vue'
import CompanyDetailChart from './CompanyDetailChart.vue'
import AnomalyObservationChart from './AnomalyObservationChart.vue'
import InsightCarousel from './InsightCarousel.vue'

const props = defineProps({
  year: Number,
  month: Number,
  market: String
})

const insights = ref([])
const loading = ref(false)

// 🌟 自定义渲染器：直接注入 Tailwind CSS 类名，无视基础样式重置
marked.use({
  renderer: {
    // 渲染链接
    link(token) {
      const href = token.href;
      const title = token.title || '';
      const text = this.parser.parseInline(token.tokens) || token.text;
      const externalIcon = `<svg class="w-3.5 h-3.5 opacity-60 inline-block ml-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>`;
      
      // 轻量级的链接样式：蓝色字体、细下划线，悬浮时颜色加深
      return `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title}" class="inline-flex items-center text-blue-600 underline decoration-blue-200 decoration-1 underline-offset-4 hover:text-blue-800 hover:decoration-blue-400 transition-colors mx-0.5">${text}${externalIcon}</a>`;
    },
    
    // 渲染各级标题
    heading(token) {
      const level = token.depth;
      const text = this.parser.parseInline(token.tokens) || token.text;
      
      if (level === 3) {
        // H3：带底部灰线的章节大标题
        return `<h3 class="text-lg font-extrabold text-slate-800 border-b-2 border-slate-100 pb-2 mb-3">${text}</h3>`;
      }
      if (level === 4) {
        // H4：带左侧蓝色胶囊指示条的子标题
        return `<h4 class="text-base font-bold text-slate-800 mb-2 relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:w-1 before:h-4 before:bg-blue-500 before:rounded-full">${text}</h4>`;
      }
      
      return `<h${level} class="font-bold text-slate-800 mb-2">${text}</h${level}>`;
    }
  }
});

const parseMarkdown = (text) => {
  if (!text) return ''
  return marked.parse(text)
}

// 核心分类逻辑
const macroGroup = computed(() => {
  const order = ['宏观_大盘', '宏观_结构', '竞争_格局', '专项_电动化']
  return insights.value
    .filter(i => order.includes(i.entity_id))
    .sort((a, b) => order.indexOf(a.entity_id) - order.indexOf(b.entity_id))
})

const companyGroup = computed(() => {
  const groups = insights.value.filter(i => i.entity_id.startsWith('车企_'))
  if (groups.length > 0) {
    return [ { entity_id: '车企_总体', is_overall: true }, ...groups ]
  }
  return []
})

const anomalyItem = computed(() => {
  return insights.value.find(i => i.entity_id.startsWith('异常_'))
})

const predictItem = computed(() => {
  return insights.value.find(i => i.entity_id.startsWith('前瞻_'))
})

// === 高亮交互相关逻辑 ===
const anomalyModels = ref([])
const currentHoveredModel = ref(null)

const handleModelsLoaded = (models) => {
  anomalyModels.value = models
}

const enhancedMarkdown = computed(() => {
  let text = anomalyItem.value?.insight_markdown || '';
  if (!text) return '';
  
  if (anomalyModels.value.length > 0) {
    // 按照长度降序排序，防止短名字覆盖长名字
    const sortedModels = [...anomalyModels.value].sort((a,b) => b.matchStr.length - a.matchStr.length);
    
    sortedModels.forEach(obj => {
      // 避免在 HTML 标签内部替换
      // 使用 gi 进行不区分大小写的匹配，$& 保持原文本大小写，data-model 绑定图表所需的完整车型名
      const regex = new RegExp(`(?![^<]*>)(${obj.matchStr})`, 'gi');
      text = text.replace(regex, `<span class="model-hover-trigger font-bold text-slate-800 border-b border-dashed border-slate-400 cursor-pointer hover:bg-slate-100 transition-all duration-200 px-1 rounded-sm mx-0.5" data-model="${obj.fullModel}">$&</span>`);
    })
  }
  
  return marked.parse(text);
})

const handleMouseOver = (e) => {
  const target = e.target;
  if (target && target.classList.contains('model-hover-trigger')) {
    currentHoveredModel.value = target.getAttribute('data-model');
  }
}

const handleMouseOut = (e) => {
  const target = e.target;
  if (target && target.classList.contains('model-hover-trigger')) {
    currentHoveredModel.value = null;
  }
}
// ==========================

const fetchData = async () => {
  if (!props.year || !props.month || !props.market || props.market === 'ALL') return
  
  loading.value = true
  const { data, error } = await supabase
    .from('market_insights')
    .select('*')
    .eq('report_year', props.year)
    .eq('report_month', props.month)
    .eq('market_name', props.market)

  if (data) {
    insights.value = data
  } else if (error) {
    console.error('获取国家洞察失败:', error)
  }
  loading.value = false
}

watch(() => [props.year, props.month, props.market], fetchData, { immediate: true })
</script>

<style>
/* 🌟 补充基础文本元素的样式，防止被 Tailwind 彻底清空 */
.ai-markdown {
  color: #334155; /* slate-700 */
  font-size: 0.925rem;
  line-height: 1.6;
  counter-reset: paragraph-counter;
}

/* 遇到各级标题重置计数器 */
.ai-markdown h1,
.ai-markdown h2,
.ai-markdown h3,
.ai-markdown h4 {
  counter-reset: paragraph-counter;
}

/* 消除右侧内容第一句话首部可能产生的过多留白 */
.ai-markdown > *:first-child,
.ai-markdown > *:first-of-type {
  margin-top: 0 !important;
  padding-top: 0 !important;
}
.ai-markdown h3:first-of-type,
.ai-markdown h4:first-of-type {
  margin-top: 0 !important;
}

/* 恢复各级文本间距 */
.ai-markdown h3 {
  margin-top: 1.5rem;
}
.ai-markdown h4 {
  margin-top: 1.25rem;
}
.ai-markdown h1, .ai-markdown h2, .ai-markdown h5, .ai-markdown h6 {
  margin-top: 1rem;
}
.ai-markdown p {
  margin-bottom: 0.75rem;
}
.ai-markdown p:last-child {
  margin-bottom: 0;
}

/* 为直接子级正文添加精美序号 */
.ai-markdown > p {
  position: relative;
  padding-left: 1.5rem;
  counter-increment: paragraph-counter;
}

.ai-markdown > p::before {
  content: counter(paragraph-counter);
  position: absolute;
  left: 0;
  top: 0.2rem;
  width: 1.125rem;
  height: 1.125rem;
  background-color: #eff6ff;
  color: #2563eb;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 恢复列表圆点和数字 */
.ai-markdown ul {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.ai-markdown ol {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.ai-markdown li {
  margin-bottom: 0.35rem;
}

/* 加粗文字颜色加深 */
.ai-markdown strong {
  color: #0f172a; /* slate-900 */
  font-weight: 700;
}
</style>