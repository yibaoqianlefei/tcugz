import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: mode === 'production' ? '/tcugz/' : '/',
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, '/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const key = env.DEEPSEEK_API_KEY;
              if (key) {
                proxyReq.setHeader('Authorization', `Bearer ${key}`);
                console.log('[vite proxy] → DeepSeek, key:', key.slice(0, 8) + '...');
              } else {
                console.warn('[vite proxy] ⚠ DEEPSEEK_API_KEY not found in env');
              }
            });
          },
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('@react-three')) return 'r3f';
          },
        },
      },
    },
  };
})
