import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AESA/', // <-- Esto le dice a GitHub Pages que busque los archivos dentro de la subruta de tu repositorio
})