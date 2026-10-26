import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  // 过滤 vue-router 废弃警告
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes('[vue-router]:')) return
        if (warning.message.includes('deprecated')) return
        warn(warning)
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 抑制 Sass 弃用警告
        silenceDeprecations: ['legacy-js-api', 'import']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/api': path.resolve(__dirname, 'src/api'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@symbols': path.resolve(__dirname, 'src/static/symbols')
    }
  },
  server: {
    port: 3003,
    host: '0.0.0.0',
    fs: {
      allow: [path.resolve(__dirname)]
    },
    // 配置代理转发到后端服务
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 不需要重写路径，因为后端也使用 /api 作为 context-path
        // rewrite: (path) => path
      }
    }
  }
})
