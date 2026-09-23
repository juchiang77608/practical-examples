import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    // 本機範例中允許被宿主來源網域嵌入
    cors: true,
    headers: {
      // 刻意放寬，僅適用於本機範例
      'X-Frame-Options': '',
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@shared': path.join(rootDir, 'shared'),
    },
  },
})
