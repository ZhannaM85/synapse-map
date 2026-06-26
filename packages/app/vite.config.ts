import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 4243,
        strictPort: true,
        open: true,
        proxy: {
            '/api': 'http://localhost:4242',
        },
    },
    build: {
        outDir: path.resolve(__dirname, '../cli/public'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
