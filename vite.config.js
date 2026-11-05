import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Vite performs the final optimization after the compatibility pass below.
  plugins: [tailwindcss({optimize:false})],
  css: {
    postcss: {
      plugins: [{
        postcssPlugin: 'preserve-standard-backdrop-filter',
        OnceExit(root) {
          // Keep the standard declaration last. The minifier coalesces aliases;
          // keeping only -webkit-backdrop-filter removes glass in Chromium.
          root.walkRules(rule => {
            for (const standard of rule.nodes.filter(node => node.type === 'decl' && node.prop === 'backdrop-filter')) {
              const prefixed = rule.nodes.find(node => node.type === 'decl' && node.prop === '-webkit-backdrop-filter' && node.value === standard.value && node.important === standard.important);
              if (prefixed && rule.index(prefixed) > rule.index(standard)) {
                standard.remove();
                rule.insertAfter(prefixed, standard);
              }
            }
          });
        },
      }],
    },
  },
  server: {allowedHosts:['terminal.local']},
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {input: {app: resolve('index.html'), login: resolve('login.html')}},
  },
});
