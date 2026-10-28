import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteBase = env.VITE_BASE_URL ?? '/';

  return {
    // 部署基础路径：由环境变量 VITE_BASE_URL 驱动，默认 "/"（域名根目录）。
    // 腾讯云服务器按需设置，例如 .env.production 里写 VITE_BASE_URL=/subpath/
    base: siteBase,
    plugins: [
      {
        name: 'local-course-paths',
        // A Pages build writes its deployment prefix into public lesson files.
        // Regenerate those copies for this server before accepting requests.
        async configureServer() {
          await promisify(execFile)(process.execPath, ['scripts/promote-homepage.mjs'], {
            cwd: process.cwd(),
            env: { ...process.env, VITE_BASE_URL: siteBase },
          });
        },
      },
      react(), tailwindcss(),
    ],

    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          homepagePreview: resolve(__dirname, 'previews/homepage-v1.html'),
        },
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
