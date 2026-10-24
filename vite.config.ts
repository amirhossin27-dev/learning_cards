import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages under /learning_cards/
// and on any other static host without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
});
