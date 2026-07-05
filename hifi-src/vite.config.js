import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/hifi/',
  build: {
    outDir: '../hifi',
    emptyOutDir: false,
  },
  server: {
    proxy: {
      '/hifi/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
});
