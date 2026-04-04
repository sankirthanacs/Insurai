import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBackEnd = env.VITE_API_URL || 'https://insurai-lhup.onrender.com'
  const wsBackEnd = env.VITE_WS_URL || 'wss://insurai-lhup.onrender.com'

  return defineConfig({
    plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  root: path.resolve(__dirname, 'frontend'),
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Local dev proxy to backend API (using env override when set)
      '/api': apiBackEnd,
      '/ws': {
        target: wsBackEnd,
        ws: true
      }
    }
  },
  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  })
}
