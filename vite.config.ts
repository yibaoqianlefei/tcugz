import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { formalizeCourse } from './scripts/lib/course-paths.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteBase = env.VITE_BASE_URL ?? '/';
  let outputBase = siteBase;
  let outputDirectory = '';

  return {
    // 部署基础路径：由环境变量 VITE_BASE_URL 驱动，默认 "/"（域名根目录）。
    // 腾讯云服务器按需设置，例如 .env.production 里写 VITE_BASE_URL=/subpath/
    base: siteBase,
    plugins: [
      {
        name: 'local-course-paths',
        // Keep local lesson copies aligned with the development server base.
        async configureServer() {
          await promisify(execFile)(process.execPath, ['scripts/promote-homepage.mjs'], {
            cwd: process.cwd(),
            env: { ...process.env, VITE_BASE_URL: siteBase },
          });
        },
      },
      {
        name: 'built-course-paths',
        apply: 'build',
        configResolved(config) {
          if (!config.base.startsWith('/') || config.base.startsWith('//') || !config.base.endsWith('/')) {
            throw new Error('Course pages require an absolute site base beginning and ending with /, such as / or /textbook/.');
          }
          outputBase = config.base;
          outputDirectory = resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
          async function stage(directory: string) {
            for (const entry of await readdir(directory, { withFileTypes: true })) {
              const path = resolve(directory, entry.name);
              if (entry.isDirectory()) await stage(path);
              else if (entry.isFile() && entry.name.endsWith('.html')) {
                const source = await readFile(path, 'utf8');
                const staged = formalizeCourse(source, outputBase);
                if (staged !== source) await writeFile(path, staged, 'utf8');
              }
            }
          }
          // Public HTML is copied before this hook. Only deployment output changes.
          await stage(resolve(outputDirectory, 'lesson'));
          await stage(resolve(outputDirectory, 'curriculum'));
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
