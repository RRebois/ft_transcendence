import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    server: {
        port: 8443,
    },
    resolve: {
        alias: {
            '@css': path.resolve(__dirname, 'css/'),
            '@js': path.resolve(__dirname, 'js/'),
            '@views': path.resolve(__dirname, 'js/views/'),
        },
    },
})
