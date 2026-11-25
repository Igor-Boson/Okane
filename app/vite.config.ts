import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import pacote from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
  const previa = mode === 'previa';
  return {
  base: previa ? './' : '/',
  plugins: [
    svelte(),
    VitePWA({
      disable: previa,
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'pet/*.webp'],
      manifest: {
        name: 'Okane',
        short_name: 'Okane',
        description: 'Sinta cada gasto na hora em que ele acontece.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1C1E3B',
        theme_color: '#1C1E3B',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: { __VERSAO__: JSON.stringify(pacote.version), __PREVIA__: JSON.stringify(previa) },
  build: { target: 'es2022', outDir: previa ? 'dist-previa' : 'dist' },
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
};
});
