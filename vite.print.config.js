import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Second build target: the print document as a server-side module.
 *
 * `vite build` (vite.config.js) builds the app for the browser; this builds
 * src/print/entry.jsx for Node, with the stylesheet inlined as a string, so the
 * PDF route can render the same sheet the editor shows. Dev does not need this —
 * server/lib/sheet-html.js transforms the source on demand.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    ssr: 'src/print/entry.jsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    target: 'node20',
    rollupOptions: { output: { entryFileNames: 'entry.js' } },
  },
})
