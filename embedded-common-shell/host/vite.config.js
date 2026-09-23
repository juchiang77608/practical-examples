import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@shared': path.join(rootDir, 'shared'),
    },
  },
})
