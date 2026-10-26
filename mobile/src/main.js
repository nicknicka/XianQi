import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@symbols/iconfont.css'

// =====================================================
// 应用初始化
// =====================================================
console.log('🚀 [App] 应用启动中...')
console.log('   ├─ 环境:', import.meta.env.MODE)
console.log('   ├─ API Base URL:', import.meta.env.VITE_API_BASE_URL || '/api')
console.log('   └─ 使用真实后端 API')

console.log('========== main.js 开始执行 ==========')

export function createApp() {
  console.log('========== createApp 函数被调用 ==========')
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)

  console.log('========== createApp 函数执行完成 ==========')

  return {
    app
  }
}

console.log('========== main.js 执行完成 ==========')
