import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from "node:path";
import _monacoEditorPlugin from 'vite-plugin-monaco-editor';

// Extract the hidden default constructor safely for ESM/CJS interop
const monacoEditorPlugin = (_monacoEditorPlugin as any).default || _monacoEditorPlugin;

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

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json'],
      customWorkers: [
        {
          label: 'graphql',
          entry: 'monaco-graphql/esm/graphql.worker.js'
        }
      ]
    })
  ],
  resolve: {
    alias,
    dedupe: ['react', 'react-dom', 'graphiql', '@graphiql/react'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'graphiql',
      '@graphiql/react',
      'react-compiler-runtime'
    ],
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
