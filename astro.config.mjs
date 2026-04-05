// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
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
