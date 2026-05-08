import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../views/Home.vue'
import SalesDashboard from '../views/SalesDashboard.vue'
import DailyNews from '../views/DailyNews.vue'
import WeeklyReports from '../views/WeeklyReports.vue'
import Resources from '../views/Resources.vue'
import EuropeMap from '../views/EuropeMap.vue'
import CapacityDashboard from '../views/CapacityDashboard.vue'
import EuropeWorkStatus from '../views/EuropeWorkStatus.vue'

const routes = [
  {
    path: '/',
    redirect: '/resources/capacity'
  },
  {
    path: '/sales',
    name: 'Sales',
    component: SalesDashboard
  },
  {
    path: '/news',
    name: 'News',
    component: DailyNews
  },
  {
    path: '/weekly',
    name: 'Weekly',
    component: WeeklyReports
  },
  {
    path: '/resources',
    name: 'Resources',
    component: Resources
  },
  {
    path: '/resources/map',
    name: 'EuropeMap',
    component: EuropeMap
  },
  {
    path: '/resources/capacity',
    name: 'CapacityDashboard',
    component: CapacityDashboard
  },
  {
    path: '/resources/working-status-map',
    name: 'EuropeWorkStatus',
    component: EuropeWorkStatus
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
