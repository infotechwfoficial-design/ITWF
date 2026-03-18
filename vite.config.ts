import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: "ITWF Sistema de Renovação",
          short_name: "ITWF Panel",
          description: "Painel de controle de clientes e renovações ITWF",
          theme_color: "#0ea5e9",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Since we have custom push notification code, we need to inject it into the generated SW
          importScripts: ['/sw-push.js']
        },
        devOptions: {
          enabled: true,
          type: 'classic'
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: true,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
