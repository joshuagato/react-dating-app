import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { FaDownload, FaShareSquare, FaPlusSquare, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { usePWA } from '../components/PWAContext';

export const InstallApp = () => {
    // 1. Consume PWA state and prompt handler from context
    const { isInstallable, isInstalled, promptInstall } = usePWA();

    // 2. Retain local iOS detection state
    const [isIOSDevice, setIsIOSDevice] = useState(false);

    useEffect(() => {
        // Detect iOS user agent on component mount
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOSDevice(ios);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-pink-900 flex items-center justify-center p-4">
            <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center text-white">
                {/* Logo Badge */}
                <div className="w-24 h-24 bg-gradient-to-tr from-violet-600 via-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20 transform hover:scale-105 transition-transform duration-300">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Install Crushr</h1>
                <p className="text-slate-400 text-sm mb-6">Experience fast, instant matches right from your home screen</p>

                {/* State-Based Action UI */}
                {isInstalled ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-center space-x-3 mb-6">
                        <FaCheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-semibold text-sm">Crushr is already installed on this device!</span>
                    </div>
                ) : isIOSDevice ? (
                    <IOSInstallInstructions />
                ) : (
                    <>
                        <button
                            onClick={promptInstall}
                            disabled={!isInstallable}
                            className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg ${isInstallable
                                ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:from-violet-500 hover:to-pink-400 shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-0.5'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-80'
                                }`}
                        >
                            <FaDownload className="mr-3" />
                            {isInstallable ? 'Install Crushr App' : 'App Ready for Installation'}
                        </button>

                        {!isInstallable && (
                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-start text-left space-x-2">
                                <FaExclamationCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                                <span>If the install button is inactive, tap your browser's options menu (⋮) and select <strong>"Add to Home screen"</strong>.</span>
                            </div>
                        )}

                        <div className="mt-6 text-left text-sm bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                            <p className="font-semibold text-slate-200 mb-2">PWA Installation Features:</p>
                            <ul className="space-y-2 text-slate-400 text-xs">
                                <li className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></span>
                                    No app store download or APK risks required
                                </li>
                                <li className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></span>
                                    Instant updates and full-screen display mode
                                </li>
                                <li className="flex items-center">
                                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></span>
                                    Uses minimal storage space on your device
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Footer Navigation */}
                <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                    <Link to="/" className="hover:text-pink-400 transition-colors">
                        ← Back to App
                    </Link>
                    <span>Version 1.0.0</span>
                </div>
            </div>
        </div>
    );
};

export const IOSInstallInstructions = () => {
    return (
        <div className="text-left bg-slate-900/70 border border-slate-700/60 rounded-xl p-5 shadow-inner">
            <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-md">
                    iOS / iPhone Guide
                </span>
            </div>

            <p className="text-slate-300 text-xs mb-4">
                Apple iOS does not permit automated web installation. Follow these steps in <strong className="text-white">Safari</strong>:
            </p>

            <ol className="space-y-3 text-slate-300 text-xs">
                <li className="flex items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-semibold text-[10px] mr-3 shrink-0 mt-0.5">
                        1
                    </span>
                    <span className="flex-1">
                        Tap the <strong className="text-white inline-flex items-center gap-1">Share <FaShareSquare className="text-sky-400 inline" /></strong> icon in the Safari bottom navigation bar.
                    </span>
                </li>

                <li className="flex items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-semibold text-[10px] mr-3 shrink-0 mt-0.5">
                        2
                    </span>
                    <span className="flex-1">
                        Scroll down the menu list and tap <strong className="text-white inline-flex items-center gap-1">Add to Home Screen <FaPlusSquare className="text-pink-400 inline" /></strong>.
                    </span>
                </li>

                <li className="flex items-start">
                    <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center font-semibold text-[10px] mr-3 shrink-0 mt-0.5">
                        3
                    </span>
                    <span className="flex-1">
                        Tap <strong className="text-white">Add</strong> in the top-right corner to place Crushr on your home screen.
                    </span>
                </li>
            </ol>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center">
                <span>Must be opened in <strong>Safari</strong> on iPhone / iPad.</span>
            </div>
        </div>
    );
};

export default InstallApp;