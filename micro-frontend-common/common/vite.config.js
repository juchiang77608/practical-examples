import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  plugins: [
    federation({
      name: 'common',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.js',
      },
      shared: [],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
  },
  preview: {
    port: 5184,
    strictPort: true,
    cors: true,
  },
  server: {
    port: 5184,
    strictPort: true,
    cors: true,
  },
  resolve: {
    alias: {
      '@shared': path.join(rootDir, 'shared'),
    },
  },
})
