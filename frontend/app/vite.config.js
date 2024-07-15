import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    server: {
        port: 9000,
    },
    resolve: {
        alias: {
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
            '@css': path.resolve(__dirname, 'css/'),
            '@js': path.resolve(__dirname, 'js/'),
            '@views': path.resolve(__dirname, 'js/views/'),
        },
    },
    optimizeDeps: {
        include: ['bootstrap']
    },
})
