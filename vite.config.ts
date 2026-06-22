import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Renderer-only build. The Electron main process is compiled separately by tsc
// (see src/main/tsconfig.json) — same split as insight-lens.
export default defineConfig({
  root: path.join(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
});
