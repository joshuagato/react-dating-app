import { useState, useEffect } from 'react'
import { Link } from "react-router";

const Home = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    setTimeout(() => {
        setLoading(false);
    }, 1000);

    setTimeout(() => {
        setUser({});
    }, 1000 * 10);

    useEffect(() => {}, []);

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
                                    to="/matches"
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
                                    to="/profile"
                                    className="inline-flex items-center px-8 py-4 border-2 border-red-400 text-red-400 text-lg font-semibold rounded-full hover:bg-red-400 hover:text-white transition-all duration-300"
                                >
                                    View Profile
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/auth"
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
                                    to="/matches"
                                    className="inline-flex items-center px-8 py-4 border-2 border-red-400 text-red-400 text-lg font-semibold rounded-full hover:bg-red-400 hover:text-white transition-all duration-300"
                                >
                                    Explore
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
  )
}

export default Home
