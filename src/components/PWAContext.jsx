import { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext({
    deferredPrompt: null,
    isInstallable: false,
    isInstalled: false,
    promptInstall: () => { },
});

export const PWAProvider = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already running in standalone mode
        const checkInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone;

        if (checkInstalled) {
            setIsInstalled(true);
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            // Prevent auto-displaying browser banner
            e.preventDefault();
            // Stash event globally in App Context
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return (
        <PWAContext.Provider value={{ deferredPrompt, isInstallable, isInstalled, promptInstall }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => useContext(PWAContext);