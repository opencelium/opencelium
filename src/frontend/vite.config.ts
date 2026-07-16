import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from "node:path";

const alias = {
  '@': path.resolve(__dirname, './src'),
  '@app': path.resolve(__dirname, './src/app'),
  '@assets': path.resolve(__dirname, './src/assets'),
  '@entities': path.resolve(__dirname, './src/entities'),
  '@features': path.resolve(__dirname, './src/features'),
  '@pages': path.resolve(__dirname, './src/pages'),
  '@shared': path.resolve(__dirname, './src/shared'),
  '@widgets': path.resolve(__dirname, './src/widgets'),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
  },
  worker: {
    format: 'es',
  }
})
