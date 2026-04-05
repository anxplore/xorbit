// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@anxplore/ui/tokens': require.resolve('@anxplore/ui/tokens'),
      },
      dedupe: [
        '@fontsource/inter',
        '@fontsource/orbitron',
        '@fontsource/montserrat',
        'astro',
        '@tsparticles/engine',
        '@tsparticles/slim',
      ],
    },
  },
  integrations: [react()],
});
