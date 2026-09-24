import { useState, useEffect } from 'react';
import { Link } from "react-router";
import { APP_NAME, installPagePath, encountersPath, profilePath, userId } from '../utils/constants';

const Home = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => {
            clearTimeout(timer1);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 via-slate-900 to-pink-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-pink-900 flex items-center justify-center p-4">
            {/* Hero Section */}
            <section className="relative overflow-hidden w-full max-w-4xl">
                <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-8 lg:p-16 text-center text-white">

                    {/* Logo Badge */}
                    <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 via-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-pink-500/20 transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>

                    <h1 className="text-3xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Find Your Perfect{' '}
                        <span className="block bg-gradient-to-r from-pink-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                            {APP_NAME}
                        </span>
                    </h1>

                    <p className="text-slate-300 text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        Connect with like-minded people through authentic connections and meaningful conversations.
                    </p>

                    {/* Action Buttons */}
                    {userId ? (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to={encountersPath}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-base font-bold rounded-xl hover:from-violet-500 hover:to-pink-400 transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-0.5"
                            >
                                Start Discovering
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </Link>
                            <Link
                                to={profilePath}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-slate-900/60 border border-slate-700/60 text-slate-200 hover:text-white text-base font-semibold rounded-xl hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-300"
                            >
                                View Profile
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-base font-bold rounded-xl hover:from-violet-500 hover:to-pink-400 transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-0.5"
                            >
                                Get Started
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </Link>
                            <Link
                                to={encountersPath}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-slate-900/60 border border-slate-700/60 text-slate-200 hover:text-white text-base font-semibold rounded-xl hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-300"
                            >
                                Explore
                            </Link>
                        </div>
                    )}

                    {/* App Download Buttons */}
                    <div className="mt-14 pt-8 border-t border-slate-700/50">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                            Get the App
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {/* Google Play Store */}
                            <Link
                                to={installPagePath}
                                className="flex items-center gap-3 px-6 py-3 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl border border-slate-700/60 hover:border-pink-500/40 transition-all duration-300 hover:scale-105 shadow-md w-48 justify-center"
                            >
                                <svg className="w-7 h-7 fill-current text-slate-200" viewBox="0 0 24 24">
                                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 leading-none">GET IT ON</div>
                                    <div className="text-base font-semibold leading-tight mt-1 text-slate-100">Google Play</div>
                                </div>
                            </Link>

                            {/* Apple App Store */}
                            <Link
                                to={installPagePath}
                                className="flex items-center gap-3 px-6 py-3 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl border border-slate-700/60 hover:border-pink-500/40 transition-all duration-300 hover:scale-105 shadow-md w-48 justify-center"
                            >
                                <svg className="w-7 h-7 fill-current text-slate-200" viewBox="0 0 24 24">
                                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400 leading-none">Download on the</div>
                                    <div className="text-base font-semibold leading-tight mt-1 text-slate-100">App Store</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Home;