// vite.config.js
export default defineConfig({
  base: '/hec/',
  server: {
    port: 8050,
    proxy: {
      // ✅ 第三方对话 API：用 /chat 代理
      '/chat': {
        target: 'https://chatai.dyg.com.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/chat/, '/api/v1') // /chat/completions → /api/v1/completions
      },
      // ✅ 你自己的后端 API（Wemol）
      '/api': {
        target: 'https://your-wemol-backend.com', // 替换为实际地址
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
})