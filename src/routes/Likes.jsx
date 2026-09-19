import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
    Heart, X, Sparkles, MapPin, Briefcase,
    GraduationCap, Crown, ChevronLeft, ChevronRight
} from 'lucide-react';

import { LIKES_TITLE, LIKES_TEXT, baseURL } from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import {
    usersWhoLikeMeHandler,
    usersWhoDisLikeMeHandler,
    usersDisLikedByMeHandler,
    // markLikesAsSeenHandler
} from '../tanstack/encounter';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Likes() {
    const navigate = useNavigate();

    // Replace with your actual user/subscription context (e.g., const { isPremium } = useAuth();)
    const [isPremium] = useState(false);

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Profile Detail Modal - Active Image Carousel State
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Touch Swipe Mechanics State
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    // Premium Modal state
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    // Track processed profile IDs to prevent redundant API calls
    const trackedSeenIds = useRef(new Set());

    // Fetch match profiles on mount
    useEffect(() => {
        (async () => {
            try {
                const response = await usersWhoLikeMeHandler();
                const fetchedProfiles = response?.likes || [];
                setProfiles(fetchedProfiles);
            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // API Handler to mark profiles as seen on backend
    const markAsSeen = useCallback(async (profileId) => {
        if (!profileId || trackedSeenIds.current.has(profileId)) return;

        trackedSeenIds.current.add(profileId);

        // Optimistically update local state so badge disappears
        // setProfiles((prev) =>
        //     prev.map((p) => ((p.id || p._id) === profileId ? { ...p, seen: true } : p))
        // );

        try {
            // await markLikesAsSeenHandler([profileId]);
            console.log(`Marked profile ${profileId} as seen`);
        } catch (error) {
            console.error(`Failed to mark profile ${profileId} as seen:`, error);
        }
    }, []);

    // IntersectionObserver ref callback for auto-tracking unseen profiles
    const observerRef = useRef(null);

    const setupObserver = useCallback((node) => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const profileId = entry.target.getAttribute('data-profile-id');
                        const isSeen = entry.target.getAttribute('data-seen') === 'true';

                        if (profileId && !isSeen) {
                            markAsSeen(profileId);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        const cardElements = document.querySelectorAll('[data-profile-card]');
        cardElements.forEach((el) => observerRef.current.observe(el));
    }, [loading, markAsSeen]);

    useEffect(() => {
        if (!loading && profiles.length > 0) {
            setupObserver();
        }
        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loading, profiles, setupObserver]);

    // Action Guard for Free vs Premium Users
    const handleActionGuard = (callback) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        if (callback) callback();
    };

    // Open Profile Modal
    const handleOpenProfile = (profile) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        setSelectedProfile(profile);
        setActiveImageIndex(0); // Reset picture index to first image
    };

    const handleCloseModal = () => {
        setSelectedProfile(null);
        setActiveImageIndex(0);
    };

    // Image Swiping Handlers
    const handlePrevImage = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev === 0 ? selectedProfile.pictures.length - 1 : prev - 1
        );
    };

    const handleNextImage = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev === selectedProfile.pictures.length - 1 ? 0 : prev + 1
        );
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNextImage();
        } else if (isRightSwipe) {
            handlePrevImage();
        }

        setTouchStartX(0);
        setTouchEndX(0);
    };

    return (
        <MainLayout pageTitle={LIKES_TITLE} pageDetails={LIKES_TEXT}>
            <HelmetHeader pageTitle={LIKES_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-4 py-6 scroll-bar">
                {/* Header Subtitle / Count */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            People Who Liked You
                            <span className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {profiles.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Upgrade or interact to unlock matches instantly.
                        </p>
                    </div>
                </div>

                {/* Profiles Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-full aspect-[3/4] bg-gray-800/50 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : profiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        {profiles.map((profile, index) => {
                            const profileId = profile.id || profile._id || index;
                            const isUnseen = profile.seen === false;

                            return (
                                <article
                                    key={profileId}
                                    data-profile-card
                                    data-profile-id={profileId}
                                    data-seen={profile.seen ?? true}
                                    onClick={() => handleOpenProfile(profile)}
                                    className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/10 border border-white/10"
                                >
                                    {/* Image (Blurred for free users) */}
                                    <img
                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isPremium ? 'filter blur-md scale-110 select-none pointer-events-none' : ''
                                            }`}
                                        src={buildPictureUrl(baseURL, profile.pictures?.[0].path) || '/placeholder-avatar.png'}
                                        alt={`${profile.name}'s profile picture`}
                                        loading="lazy"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                                    {/* Unread "NEW" Indicator Badge */}
                                    {isUnseen && (
                                        <span className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg animate-pulse">
                                            <Sparkles size={10} /> NEW
                                        </span>
                                    )}

                                    {/* Time Liked Tag */}
                                    {profile.liked_at && (
                                        <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white border border-white/10 z-10">
                                            {profile.liked_at}
                                        </span>
                                    )}

                                    {/* Lock overlay for Free Users */}
                                    {!isPremium && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <div className="p-3 rounded-full bg-black/60 border border-amber-500/30 text-amber-400 backdrop-blur-md shadow-lg">
                                                <Crown size={22} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Info Container */}
                                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex flex-col justify-end z-10">
                                        <h3 className="text-base sm:text-lg font-bold text-white truncate drop-shadow-md">
                                            {profile.name}, <span className="font-normal">{profile.age}</span>
                                        </h3>

                                        {profile.bio && (
                                            <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                                                {profile.bio}
                                            </p>
                                        )}

                                        {/* Quick Actions */}
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
                                                className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium hover:brightness-110 transition-all shadow-md"
                                            >
                                                <Heart size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 text-pink-500">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">No likes yet</h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            Keep active and update your profile picture to get noticed by more people nearby!
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed Profile View Modal with Image Swiper (Premium Users) */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
                    <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col">

                        {/* Close Modal Button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors border border-white/10"
                        >
                            <X size={18} />
                        </button>

                        {/* Interactive Swipeable Image Viewport */}
                        <div
                            className="relative w-full h-80 sm:h-96 bg-black flex-shrink-0 select-none overflow-hidden"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Blurred Background Image for Aspect Ratio Padding */}
                            <img
                                src={buildPictureUrl(baseURL, selectedProfile.pictures?.[activeImageIndex].path) || '/placeholder-avatar.png'}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40"
                            />

                            {/* Main Active Image */}
                            <img
                                src={buildPictureUrl(baseURL, selectedProfile.pictures?.[activeImageIndex].path) || '/placeholder-avatar.png'}
                                alt={`${selectedProfile.name} photo ${activeImageIndex + 1}`}
                                className="relative w-full h-full object-contain z-10 transition-all duration-300"
                            />

                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/40 z-10 pointer-events-none" />

                            {/* Left/Right Carousel Control Arrows */}
                            {selectedProfile.pictures?.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePrevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all border border-white/10"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all border border-white/10"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Top Progress / Image Counter */}
                            {selectedProfile.pictures?.length > 1 && (
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-white/10">
                                    {activeImageIndex + 1} / {selectedProfile.pictures.length}
                                </div>
                            )}

                            {/* Bottom Pagination Indicators */}
                            {selectedProfile.pictures?.length > 1 && (
                                <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 px-4">
                                    {selectedProfile.pictures.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveImageIndex(idx);
                                            }}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeImageIndex
                                                ? 'w-6 bg-white'
                                                : 'w-1.5 bg-white/40 hover:bg-white/70'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* User Main Details on Top of Image */}
                            <div className="absolute bottom-6 left-4 right-4 z-20 text-white pointer-events-none">
                                <h2 className="text-2xl font-bold drop-shadow-md">
                                    {selectedProfile.name}, {selectedProfile.age}
                                </h2>
                                {selectedProfile.location && (
                                    <p className="flex items-center gap-1 text-sm text-gray-200 mt-0.5 drop-shadow">
                                        <MapPin size={14} className="text-pink-400" /> {selectedProfile.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Profile Content Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-gray-300 scroll-bar">
                            {selectedProfile.bio && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">About</h4>
                                    <p className="text-sm leading-relaxed text-gray-200">{selectedProfile.bio}</p>
                                </div>
                            )}

                            {selectedProfile.occupation && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Briefcase size={16} className="text-pink-400 flex-shrink-0" />
                                    <span>{selectedProfile.occupation}</span>
                                </div>
                            )}

                            {selectedProfile.education && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <GraduationCap size={16} className="text-violet-400 flex-shrink-0" />
                                    <span>{selectedProfile.education}</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Footer */}
                        <div className="p-4 bg-gray-900/90 border-t border-white/5 flex items-center gap-4 flex-shrink-0">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-3 rounded-2xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                            >
                                Pass
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Heart size={18} fill="currentColor" /> Match Back
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

                        <h3 className="text-xl font-bold text-white mb-2">See Who Likes You</h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Unblur profile photos and match back instantly by upgrading to Premium!
                        </p>

                        <button
                            onClick={() => navigate('/premium')}
                            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                            <Crown size={18} />
                            Unlock Likes with Premium
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}