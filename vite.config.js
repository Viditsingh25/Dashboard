import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom'))
                        return 'vendor';
                    if (id.includes('node_modules/recharts'))
                        return 'charts';
                    if (id.includes('node_modules/xlsx') || id.includes('node_modules/jspdf') || id.includes('node_modules/papaparse'))
                        return 'utils';
                },
            },
        },
    },
});
