import { useState } from 'react';
import { Link } from 'react-router';
import { FaDownload } from 'react-icons/fa';

const ApkDownload = () => {
    const APK_DOWNLOAD_URL = 'https://your-domain.com/downloads/streammatch.apk';

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = APK_DOWNLOAD_URL;
        link.download = 'StreamMatch.apk';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-200 to-cyan-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                {/* Icon */}
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 15.341l-2.486-2.486 2.486-2.486 1.414 1.414-1.072 1.072 1.072 1.072-1.414 1.414zm-11.046 0l-1.414-1.414 1.072-1.072-1.072-1.072 1.414-1.414 2.486 2.486-2.486 2.486zm2.59-7.156l1.415 1.415-4.242 4.242-1.415-1.415 4.242-4.242zm6.364 2.828l-1.414-1.415 4.242-4.242 1.414 1.414-4.242 4.243zm-2.828-5.656l-1.414 1.414-1.414-1.414 1.414-1.414 1.414 1.414zm-2.828 5.657l1.414 1.414-4.242 4.242-1.414-1.414 4.242-4.242zm0 2.828l-1.414 1.414-4.242-4.242 1.414-1.414 4.242 4.242zm2.828 2.829l-1.414-1.414 4.242-4.242 1.414 1.414-4.242 4.242z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Download App</h1>
                <p className="text-gray-500 text-sm mb-6">Get the latest version of StreamMatch</p>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <FaDownload className="mr-3" />
                    Download APK (25 MB)
                </button>

                {/* Quick Instructions */}
                <div className="mt-6 text-left text-sm bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-700 mb-2">How to install:</p>
                    <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                        <li>Download the APK file</li>
                        <li>Open Settings → Enable "Install from unknown sources"</li>
                        <li>Open the downloaded file and tap Install</li>
                    </ol>
                    <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                        ⚠️ You need to enable installation from unknown sources in your device settings.
                    </p>
                </div>

                {/* Links */}
                <div className="mt-4 flex justify-between text-sm">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">
                        ← Back
                    </Link>
                    <div className="space-x-3">
                        <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            Play Store
                        </a>
                        <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            App Store
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApkDownload;