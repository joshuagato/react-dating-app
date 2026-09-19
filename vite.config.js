import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tailwindcss(),
        react({
            babel: {
                presets: [reactCompilerPreset()] // 👈 Pass reactCompilerPreset directly inside react()
            }
        }),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: false // Disables local Service Worker on localhost
            },
            manifest: {
                name: 'Crushr',
                short_name: 'Crushr',
                description: 'Find your connection on Crushr',
                theme_color: '#8b5cf6',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    base: '/'
})