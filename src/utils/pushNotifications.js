import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import { protectedApi } from '../axios';

export const registerPushNotifications = async () => {
    try {
        if (Capacitor.isNativePlatform()) {
            // Mobile (Capacitor) Push Flow
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive === 'granted') {
                await PushNotifications.register();
            }

            await PushNotifications.addListener('registration', async (token) => {
                await protectedApi.post('/notifications/register-token', {
                    token: token.value,
                    platform: Capacitor.getPlatform()
                });
            });

        } else {
            // Web Browser FCM Flow
            if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {

                // Register Service Worker
                let registration;
                try {
                    registration = await navigator.serviceWorker.register(
                        import.meta.env.MODE === 'production'
                            ? '/firebase-messaging-sw.js'
                            : '/dev-sw.js?dev-sw',
                        { type: import.meta.env.MODE === 'production' ? 'classic' : 'module' }
                    );
                } catch (swError) {
                    // Fallback to ready state if already registered by vite-plugin-pwa
                    registration = await navigator.serviceWorker.ready;
                }

                if (!registration) return;

                const token = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_REACT_APP_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    await protectedApi.post('/notifications/register-token', {
                        token,
                        platform: 'web'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Push registration error:', error);
    }
};