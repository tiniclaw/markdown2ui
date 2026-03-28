import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/markdown2ui/',
  plugins: [react()],
  resolve: {
    alias: {
      '@markdown2ui/parser': path.resolve(__dirname, '../parser/src/index.ts'),
      '@markdown2ui/react': path.resolve(__dirname, '../react/src/index.ts'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
})
