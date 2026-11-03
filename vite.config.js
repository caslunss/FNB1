import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  server: {allowedHosts:['terminal.local']},
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {input: {app: resolve('index.html'), login: resolve('login.html')}},
  },
});
