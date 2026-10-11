import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/sehtraining/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-180.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,wasm,task}'],
        maximumFileSizeToCacheInBytes: 20_000_000,
      },
      manifest: {
        name: 'Sehtraining',
        short_name: 'Sehtraining',
        lang: 'de',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#3c3c3c',
        theme_color: '#3c3c3c',
        start_url: '/sehtraining/',
        scope: '/sehtraining/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
