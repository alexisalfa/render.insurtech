import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Importar 'path' para resolver rutas absolutas

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Configura el alias '@' para que apunte a la carpeta 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174, // CAMBIO CRÍTICO: Puerto para el frontend de Vite, ajustado a 5174
    proxy: {
      // Proxy para las peticiones al backend de FastAPI
      // Todas las peticiones que empiecen con /api (si usas ese prefijo en tus rutas de FastAPI)
      '/api': { 
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Regla de proxy específica para la ruta /token (login de FastAPI)
      '/token': { 
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // ¡NUEVA REGLA DE PROXY PARA /REGISTER!
      '/register': { // <-- ¡ESTA ES LA LÍNEA CRÍTICA A AÑADIR!
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // Proxy directo para las rutas de tu backend que no tienen /api
      '/users': { target: 'http://localhost:8001', changeOrigin: true },
      '/auth': { target: 'http://localhost:8001', changeOrigin: true },
      '/license': { target: 'http://localhost:8001', changeOrigin: true },
      '/clientes': { target: 'http://localhost:8001', changeOrigin: true },
      '/empresas_aseguradoras': { target: 'http://localhost:8001', changeOrigin: true },
      '/asesores': { target: 'http://localhost:8001', changeOrigin: true },
      '/polizas': { target: 'http://localhost:8001', changeOrigin: true },
      '/comisiones': { target: 'http://localhost:8001', changeOrigin: true },
      '/reclamaciones': { target: 'http://localhost:8001', changeOrigin: true },
      '/statistics': { target: 'http://localhost:8001', changeOrigin: true },
      // Añade aquí cualquier otra ruta de tu backend que necesites proxy
    },
  },
});
