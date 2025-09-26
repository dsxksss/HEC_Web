import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),tailwindcss(),],
  server: {
    proxy: {
      '/api': {
        target: 'https://chatai.dyg.com.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        // 添加超时和重试配置
        timeout: 60000,
        followRedirects: true
      },
      '/controller': {
        target: 'https://zta.dyg.com.cn:60201',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/controller/, '/controller'),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        timeout: 60000,
        followRedirects: true
      }
    }
  }
})
