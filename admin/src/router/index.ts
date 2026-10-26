import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/admin/login',
  },
  {
    path: '/admin/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/admin',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/product/index.vue'),
        meta: { title: '商品管理', icon: 'Goods' },
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理', icon: 'Document' },
      },
      {
        path: 'authManage',
        name: 'AuthManage',
        component: () => import('@/views/authManage/index.vue'),
        meta: { title: '实名认证管理', icon: 'Checked' },
      },
      {
        path: 'notification',
        name: 'Notification',
        component: () => import('@/views/notification/index.vue'),
        meta: { title: '系统通知管理', icon: 'Bell' },
      },
      {
        path: 'flashSale',
        name: 'FlashSale',
        component: () => import('@/views/flashSale/index.vue'),
        meta: { title: '秒杀管理', icon: 'Timer' },
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/category/index.vue'),
        meta: { title: '分类管理', icon: 'FolderOpened' },
      },
      {
        path: 'sensitiveWord',
        name: 'SensitiveWord',
        component: () => import('@/views/sensitiveWord/index.vue'),
        meta: { title: '敏感词管理', icon: 'Hide' },
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '举报管理', icon: 'Warning' },
      },
      {
        path: 'shareitem',
        name: 'ShareItem',
        component: () => import('@/views/shareitem/index.vue'),
        meta: { title: '共享物品管理', icon: 'Share' },
      },
      {
        path: 'banner',
        name: 'Banner',
        component: () => import('@/views/banner/index.vue'),
        meta: { title: '轮播图管理', icon: 'Picture' },
      },
      {
        path: 'blacklist',
        name: 'Blacklist',
        component: () => import('@/views/blacklist/index.vue'),
        meta: { title: '黑名单管理', icon: 'Lock' },
      },
      {
        path: 'evaluation',
        name: 'Evaluation',
        component: () => import('@/views/evaluation/index.vue'),
        meta: { title: '评价管理', icon: 'ChatDotRound' },
      },
      {
        path: 'operationLog',
        name: 'OperationLog',
        component: () => import('@/views/operationLog/index.vue'),
        meta: { title: '操作日志', icon: 'Document' },
      },
      {
        path: 'systemConfig',
        name: 'SystemConfig',
        component: () => import('@/views/systemConfig/index.vue'),
        meta: { title: '系统配置', icon: 'Setting' },
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/feedback/index.vue'),
        meta: { title: '用户反馈', icon: 'ChatLineSquare' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')

  if (to.path.startsWith('/admin')) {
    if (!token && to.path !== '/admin/login') {
      next('/admin/login')
      return
    }

    if (to.path === '/admin/login' && token) {
      next('/admin/dashboard')
      return
    }
  }

  next()
})

export function setupRouter(app: App) {
  app.use(router)
}

export default router
