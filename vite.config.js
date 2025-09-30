import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/hec/',
  plugins: [vue(),tailwindcss(),],
  server: {
    port: 8050,
    proxy: {
      // API请求代理配置，确保不受base URL影响
      '/api': {
        target: 'https://chatai.dyg.com.cn',
        changeOrigin: true,
        secure: false,
        // 保持原始API路径不变
        rewrite: (path) => path,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        timeout: 60000,
        followRedirects: true
      },
      '/controller': {
        target: 'https://zta.dyg.com.cn:60201',
        changeOrigin: true,
        secure: false,
        // 保持原始API路径不变
        rewrite: (path) => path,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        timeout: 60000,
        followRedirects: true
      },
      '/api/v1/chat/completions': {
        target: 'https://chatai.dyg.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1')
      }
    }
  }
})
