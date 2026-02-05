import {defineConfig, PluginOption} from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

const host = '0.0.0.0';
const hmrHost = '10.0.2.2';

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss() as unknown as PluginOption, tsconfigPaths()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: hmrHost
      ? {
          protocol: 'ws',
          host: hmrHost,
          port: 1420,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
}));
