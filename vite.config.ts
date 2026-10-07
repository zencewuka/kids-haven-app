   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'
   import path from 'node:path'

   // Plain Vite config. No hidden .figma folder needed.
   export default defineConfig({
     base: '/',
     plugins: [react(), tailwindcss()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     server: {
       host: '0.0.0.0',
       port: 8443,
     },
   })
