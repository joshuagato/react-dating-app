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
                presets: [reactCompilerPreset()]
            }
        }),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            workbox: {
                // Increases precache limit to 5 MB
                maximumFileSizeToCacheInBytes: 5242880
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
    build: {
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // Strict matching for core React dependencies
                        if (
                            id.includes('/node_modules/react/') ||
                            id.includes('/node_modules/react-dom/') ||
                            id.includes('/node_modules/react-router/') ||
                            id.includes('/node_modules/react-router-dom/')
                        ) {
                            return 'vendor-core';
                        }
                        if (id.includes('lucide-react') || id.includes('react-icons')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('date-fns')) {
                            return 'vendor-date-fns';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },
    base: '/'
})