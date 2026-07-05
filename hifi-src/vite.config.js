import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lokal (XAMPP) läuft die Seite unter /hifi/, auf IONOS Deploy Now unter der
// Domain-Wurzel. VITE_BASE_PATH wird nur im CI-Build-Schritt auf "/" gesetzt,
// lokal bleibt der Default unverändert.
const base = process.env.VITE_BASE_PATH || '/hifi/';

export default defineConfig({
  plugins: [react()],
  base,
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
