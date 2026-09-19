import { useState, useEffect } from 'react'
import { Link } from "react-router";
import { encountersPath } from '../utils/constants';

const Home = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    setTimeout(() => {
        setLoading(false);
    }, 1000);

    setTimeout(() => {
        setUser({});
    }, 1000 * 10);

    useEffect(() => { }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-200 to-cyan-800 flex items-center justify-center">
            {/* Hero Section - Full Page */}
            <section className="relative overflow-hidden w-full">
                <div className="absolute inset-0 "></div>
                <div className="relative container mx-auto px-6 py-20 lg:py-32">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                            Find Your Perfect
                            <span className="block bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                                StreamMatch
                            </span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-gray-100 mb-8 leading-relaxed">
                            Connect with like-minded people through live
                            streaming, meaningful conversations, and authentic
                            connections.
                        </p>

                        {user ? (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to={encountersPath}
                                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-lg font-semibold rounded-full hover:from-pink-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                                    to={encountersPath}
                                    className="inline-flex items-center px-8 py-4 border-2 border-red-400 text-red-400 text-lg font-semibold rounded-full hover:bg-red-400 hover:text-white transition-all duration-300"
                                >
                                    View Profile
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white text-lg font-semibold rounded-full hover:from-pink-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                                    className="inline-flex items-center px-8 py-4 border-2 border-red-400 text-red-400 text-lg font-semibold rounded-full hover:bg-red-400 hover:text-white transition-all duration-300"
                                >
                                    Explore
                                </Link>
                            </div>
                        )}

                        {/* App Download Buttons */}
                        <div className="mt-16 pt-8 border-t border-white/20">
                            <p className="text-gray-200 text-sm font-medium mb-4 uppercase tracking-wider">
                                Get the App
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {/* Google Play Store */}
                                <Link
                                    to="download-android"
                                    // target="_blank"
                                    // rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-3 bg-black/80 hover:bg-black text-white rounded-xl backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 shadow-md w-48 justify-center"
                                >
                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-semibold text-gray-400 leading-none">GET IT ON</div>
                                        <div className="text-base font-semibold leading-tight mt-1">Google Play</div>
                                    </div>
                                </Link>

                                {/* Apple App Store */}
                                <a
                                    href="#"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-6 py-3 bg-black/80 hover:bg-black text-white rounded-xl backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 shadow-md w-48 justify-center"
                                >
                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                                    </svg>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-semibold text-gray-400 leading-none">Download on the</div>
                                        <div className="text-base font-semibold leading-tight mt-1">App Store</div>
                                    </div>
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home