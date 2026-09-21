import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5199,
    proxy: {
      // same contract as the original: the client POSTs the invoice JSON to the
      // server, the server answers with application/pdf bytes
      '/api': 'http://localhost:3099',
    },
  },
})
