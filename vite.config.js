import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change 'jour-fixe' below to match your GitHub repo name.
// e.g. if your repo is github.com/yourname/movie-night, use base: '/movie-night/'
// If you use a custom domain or your repo is named <username>.github.io, use '/'
export default defineConfig({
  plugins: [react()],
  base: '/jour-fixe/',
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
