import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Cho phép mọi kết nối từ TikTok LIVE Studio, 127.0.0.1, localhost, lvh.me, và mạng nội bộ
    allowedHosts: true,
  },
});
