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
      // ✅ 代理第三方对话 API（开发环境用）
      '/api/v1/chat/completions': {
        target: 'https://chatai.dyg.com.cn', // ← 删除末尾空格！
        changeOrigin: true,
        secure: false, // 允许 HTTPS 且证书可能自签
        rewrite: (path) => path // 路径不变，直接转发
      },
      // 你自己的后端 API（Wemol）
      '/api': {
        target: 'https://your-wemol-backend.com', // 替换为你的实际后端地址
        changeOrigin: true,
        secure: false
      },
      '/controller': {
        target: 'https://zta.dyg.com.cn:60201',
        changeOrigin: true,
        secure: false
      }
    }
  }
});