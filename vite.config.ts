import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/zentru/' : '/',
  define: {
    // Inject build timestamp as app version for cache-busting
    __APP_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' = new SW installs but waits. We show a banner and user
      // decides when to reload. Prevents mid-task refresh surprise.
      registerType: 'prompt',
      selfDestroying: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Zentru',
        short_name: 'Zentru',
        description: 'Credit card expense tracker & personal finance manager',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Don't force-activate new SW — wait for user to trigger reload via banner
        // Prevents mid-operation data loss from surprise refresh
        skipWaiting: false,
        clientsClaim: false,
        // Clean up old caches from previous versions
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
