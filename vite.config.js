// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/hec/',
  plugins: [vue(), tailwindcss()],
  server: {
    port: 8050,
    proxy: {
      // ✅ 第三方对话 API：用 /chat 代理
      '/chat': {
        target: 'https://chatai.dyg.com.cn:60201',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/chat/, '/api/v1') // /chat/completions → /api/v1/completions
      },
      // WeMol API
      '/api': {
        target: 'https://your-wemol-backend.com', // 替换为实际地址
        changeOrigin: true,
        secure: false
      }
    }
  }
});