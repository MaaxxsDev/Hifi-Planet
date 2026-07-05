import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../hifi',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Ohne das erzeugt lucide-react/dynamic pro Icon eine eigene Chunk-Datei
        // (~1600 Stück) - auf Shared-Hosting scheitert das Hochladen/Entpacken
        // so vieler winziger Dateien. Hier alle Icons in eine Datei bündeln.
        manualChunks(id) {
          if (id.includes('lucide-react')) {
            return 'lucide-icons';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
