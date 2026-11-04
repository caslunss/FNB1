import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {allowedHosts:['terminal.local']},
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {input: {app: resolve('index.html'), login: resolve('login.html')}},
  },
});
