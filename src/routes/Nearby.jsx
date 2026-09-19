import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Heart, Star, X, MapPin, Radar, Briefcase, GraduationCap, ChevronLeft, ChevronRight, Crown } from 'lucide-react';

import { NEARBY_TITLE, NEARBY_TEXT, baseURL } from '../utils/constants';
import { getNearbyUsersHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import { buildPictureUrl } from '../utils/functions';

export default function Nearby() {
    const navigate = useNavigate();

    // Replace this with your actual user state/auth context hook (e.g., const { user } = useAuth();)
    const [isPremium] = useState(true);

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // State to toggle the Premium Modal
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    // Touch gesture tracking for swiping photos on mobile
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const response = await getNearbyUsersHandler();
                const fetchedProfiles = response?.userProfiles || [];
                setProfiles(fetchedProfiles);
            } catch (error) {
                console.error("Failed to fetch nearby profiles:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Handle keypresses for image navigation on desktop
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedProfile) return;
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'Escape') handleCloseModal();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProfile, activeImageIndex]);

    // Handle interactions for free vs premium users
    const handleActionGuard = (callback) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        if (callback) callback();
    };

    // Open profile modal
    const handleOpenProfile = (profile) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        setSelectedProfile(profile);
        setActiveImageIndex(0);
    };

    const handleCloseModal = () => {
        setSelectedProfile(null);
        setActiveImageIndex(0);
    };

    // Carousel Navigation
    const handleNextImage = () => {
        if (!selectedProfile?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev < selectedProfile.pictures.length - 1 ? prev + 1 : 0
        );
    };

    const handlePrevImage = () => {
        if (!selectedProfile?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev > 0 ? prev - 1 : selectedProfile.pictures.length - 1
        );
    };

    // Touch handlers for mobile photo swiping
    const handleTouchStart = (e) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            handleNextImage();
        } else if (distance < -minSwipeDistance) {
            handlePrevImage();
        }

        setTouchStartX(0);
        setTouchEndX(0);
    };

    return (
        <MainLayout pageTitle={NEARBY_TITLE} pageDetails={NEARBY_TEXT}>
            <HelmetHeader pageTitle={NEARBY_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-4 sm:px-8 py-6 scroll-bar">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            <Radar className="w-6 h-6 text-pink-500 animate-pulse" />
                            People Nearby
                            <span className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {profiles.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Discover interesting people around your location.
                        </p>
                    </div>
                </div>

                {/* Profiles Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-full aspect-[3/4] bg-gray-800/50 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : profiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                        {profiles.map((profile, index) => (
                            <article
                                key={profile.id || index}
                                onClick={() => handleOpenProfile(profile)}
                                className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/10 border border-white/10"
                            >
                                <img
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    src={buildPictureUrl(baseURL, profile.pictures?.[0]) || '/placeholder-avatar.png'}
                                    alt={`${profile.name}'s profile picture`}
                                    loading="lazy"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
                                    <MapPin size={12} className="text-pink-500" />
                                    <span>{profile.distanceFrom ?? profile.distance ?? '1'} km away</span>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex flex-col justify-end">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-white truncate drop-shadow-md">
                                            {profile.name}, <span className="font-normal">{profile.age}</span>
                                        </h3>
                                        {profile.isOnline && (
                                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black flex-shrink-0" />
                                        )}
                                    </div>

                                    {profile.bio && (
                                        <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                                            {profile.bio}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleActionGuard();
                                            }}
                                            className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors border border-white/5"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleActionGuard();
                                            }}
                                            className="p-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-amber-500/20 text-amber-400 transition-colors border border-white/5"
                                        >
                                            <Star size={16} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleActionGuard();
                                            }}
                                            className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium hover:brightness-110 transition-all shadow-md"
                                        >
                                            <Heart size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                        <div className="relative w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 text-pink-500">
                            <Radar size={40} className="animate-spin-slow" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">No matches nearby right now</h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            Try expanding your search distance filters or check back later.
                        </p>
                    </div>
                )}
            </div>

            {/* View Profile Modal */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Image Frame Container */}
                        <div
                            className="relative w-full aspect-[4/5] bg-gray-950 flex-shrink-0 touch-pan-y overflow-hidden"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img
                                src={buildPictureUrl(baseURL, selectedProfile.pictures?.[activeImageIndex]) || buildPictureUrl(baseURL, selectedProfile.pictures?.[0]) || '/placeholder-avatar.png'}
                                alt={`${selectedProfile.name} - Picture ${activeImageIndex + 1}`}
                                className="w-full h-full object-cover transition-all duration-300"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/40 pointer-events-none" />

                            {/* Navigation Bar Indicators */}
                            {selectedProfile.pictures?.length > 1 && (
                                <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
                                    {selectedProfile.pictures.map((_, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className="flex-1 h-1 rounded-full cursor-pointer overflow-hidden bg-white/30 backdrop-blur-sm"
                                        >
                                            <div
                                                className={`h-full bg-white transition-all duration-300 ${idx === activeImageIndex ? 'w-full' : 'w-0'}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Carousel Navigation Buttons for ALL Screen Sizes */}
                            {selectedProfile.pictures?.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrevImage();
                                        }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNextImage();
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}

                            <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
                                <h2 className="text-2xl font-bold drop-shadow-md">
                                    {selectedProfile.name}, {selectedProfile.age}
                                </h2>
                                <p className="flex items-center gap-1 text-sm text-pink-400 mt-1 drop-shadow-md">
                                    <MapPin size={14} /> {selectedProfile.distanceFrom ?? selectedProfile.distance ?? '1'} km away
                                </p>
                            </div>
                        </div>

                        {/* Profile Info Details */}
                        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-gray-300">
                            {selectedProfile.bio && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">About</h4>
                                    <p className="text-sm leading-relaxed text-gray-200">{selectedProfile.bio}</p>
                                </div>
                            )}

                            {selectedProfile.occupation && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Briefcase size={16} className="text-pink-400" />
                                    <span>{selectedProfile.occupation}</span>
                                </div>
                            )}

                            {selectedProfile.education && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <GraduationCap size={16} className="text-violet-400" />
                                    <span>{selectedProfile.education}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Toolbar */}
                        <div className="p-4 bg-gray-900/90 border-t border-white/5 flex items-center gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="p-3 rounded-2xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={() => handleActionGuard()}
                                className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                            >
                                <Star size={20} fill="currentColor" />
                            </button>
                            <button
                                onClick={() => handleActionGuard()}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Heart size={18} fill="currentColor" /> Like Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="relative w-full max-w-sm bg-gray-900 border border-amber-500/30 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-inner">
                            <Crown size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Premium Feature</h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Viewing profiles and interacting with nearby matches is exclusive to Premium members. Upgrade to connect instantly!
                        </p>

                        <button
                            onClick={() => navigate('/premium')}
                            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                            <Crown size={18} />
                            Get Premium Access
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}