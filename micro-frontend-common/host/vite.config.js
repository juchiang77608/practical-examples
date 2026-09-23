import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  plugins: [
    federation({
      name: 'host',
      remotes: {
        // preview／CDN 上的 remote entry（開發時由 common preview 提供）
        common: 'http://localhost:5184/assets/remoteEntry.js',
      },
      shared: [],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    modulePreload: false,
  },
  server: {
    port: 5183,
    strictPort: true,
    // 允許從 remote origin 拉模組
    cors: true,
  },
  preview: {
    port: 5183,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@shared': path.join(rootDir, 'shared'),
    },
  },
})
