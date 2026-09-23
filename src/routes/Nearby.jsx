// Nearby.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
    Heart, Star, X, MapPin, Radar, Briefcase, GraduationCap,
    ChevronLeft, ChevronRight, Crown, User, Maximize2,
    Cigarette, Wine, Ruler, Users, Sparkles, CheckCircle2,
    Clock, SendHorizontal,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import {
    NEARBY_TITLE, NEARBY_TEXT, baseURL, premiumPath,
    partnerProfilePath, chatPath, ENCOUNTER_ACTION,
} from '../utils/constants';
import {
    getNearbyUsersHandler, getPremiumStatusHandler,
} from '../tanstack/user';
import { likeUserHandler, dislikeUserHandler } from '../tanstack/encounter';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import { renderImageUrl } from '../utils/functions';

/* ------------------------------------------------------------------ */
/* Injected keyframes for the super-like burst                        */
/* ------------------------------------------------------------------ */
const burstStyles = `
@keyframes superRing {
    0%   { width: 60px;  height: 60px;  opacity: 0; transform: scale(0.5); }
    20%  {                               opacity: 1;                     }
    100% { width: 480px; height: 480px; opacity: 0; transform: scale(1);   }
}
@keyframes superStar {
    0%   { opacity: 0; transform: scale(0.3) rotate(-30deg); }
    30%  { opacity: 1; transform: scale(1.2) rotate(10deg);  }
    70%  { opacity: 1; transform: scale(1)   rotate(0deg);   }
    100% { opacity: 0; transform: scale(1.4) rotate(20deg);  }
}
@keyframes superSpark {
    0%   { opacity: 1; transform: translate(0, 0) scale(0.6); }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.2); }
}
`;

/* ------------------------------------------------------------------ */
/* Reusable pieces (mirrors PartnerProfile.jsx)                       */
/* ------------------------------------------------------------------ */
function InfoRow({ icon, label, value, iconBg = 'bg-violet-50', iconColor = 'text-violet-600' }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    {label}
                </p>
                <p className="text-sm font-medium text-slate-700 capitalize break-words">
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function Nearby() {
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Fullscreen lightbox for the modal
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Premium modal
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [premiumFeatureName, setPremiumFeatureName] = useState('');

    // Super-like burst
    const [superLikeBurst, setSuperLikeBurst] = useState(null);

    // Touch gesture tracking (hero carousel)
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const isProcessingAction = useRef(false);

    /* ---------------------------------------------------------------- */
    /* Premium status                                                   */
    /* ---------------------------------------------------------------- */
    const { data: premiumStatusData } = useQuery({
        queryKey: ['premium-status'],
        queryFn: getPremiumStatusHandler,
    });

    const isPremium =
        premiumStatusData === undefined
            ? null
            : Boolean(premiumStatusData?.is_premium);

    /* ---------------------------------------------------------------- */
    /* Fetch nearby profiles                                            */
    /* ---------------------------------------------------------------- */
    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getNearbyUsersHandler();
            const fetchedProfiles = response?.userProfiles || [];
            setProfiles(fetchedProfiles);
        } catch (error) {
            console.error('Failed to fetch nearby profiles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    /* ---------------------------------------------------------------- */
    /* Keypress nav for the modal + lightbox                            */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedProfile) return;

            if (isFullscreen) {
                if (e.key === 'Escape') setIsFullscreen(false);
                if (e.key === 'ArrowLeft') handlePrevImage();
                if (e.key === 'ArrowRight') handleNextImage();
                return;
            }

            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'Escape') handleCloseModal();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProfile, activeImageIndex, isFullscreen]);

    /* ---------------------------------------------------------------- */
    /* Modal control                                                    */
    /* ---------------------------------------------------------------- */
    const handleOpenProfile = (profile) => {
        if (isPremium === null) return;
        if (!isPremium) {
            setPremiumFeatureName('Viewing full profiles');
            setShowPremiumModal(true);
            return;
        }
        setSelectedProfile(profile);
        setActiveImageIndex(0);
    };

    const handleCloseModal = () => {
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
    };

    /* ---------------------------------------------------------------- */
    /* Navigate to the full partner profile                             */
    /* ---------------------------------------------------------------- */
    const handleOpenPartnerProfile = () => {
        if (!selectedProfile?.id) return;
        const userId = selectedProfile.id;
        setSelectedProfile(null);
        setActiveImageIndex(0);
        navigate(partnerProfilePath, { state: { user_id: userId } });
    };

    /* ---------------------------------------------------------------- */
    /* Carousel                                                         */
    /* ---------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------- */
    /* Actions                                                          */
    /* ---------------------------------------------------------------- */
    const removeProfileFromState = (profileId) => {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
        setSelectedProfile((prev) =>
            prev && prev.id === profileId ? null : prev
        );
    };

    const runAction = async (direction, profile) => {
        if (!profile?.id) return;
        if (isProcessingAction.current) return;
        isProcessingAction.current = true;

        const recipientId = profile.id;
        const data = { recipient_id: recipientId };

        removeProfileFromState(recipientId);

        try {
            if (direction === 'dislike') {
                data.action = ENCOUNTER_ACTION.DISLIKE;
                await dislikeUserHandler(data);
            } else {
                data.action =
                    direction === 'super_like'
                        ? ENCOUNTER_ACTION.SUPER_LIKE
                        : ENCOUNTER_ACTION.LIKE;
                await likeUserHandler(data);
            }
        } catch (err) {
            console.error(`${direction} failed:`, err);
        } finally {
            isProcessingAction.current = false;
            fetchProfiles();
        }
    };

    const handleLike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;
        runAction('like', profile);
    };

    const handleDislike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;
        runAction('dislike', profile);
    };

    const handleSuperLike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;

        if (isPremium === null) return;

        if (!isPremium) {
            setPremiumFeatureName('Super Like');
            setShowPremiumModal(true);
            return;
        }

        setSuperLikeBurst({ profileId: profile.id });
        setTimeout(() => runAction('super_like', profile), 80);
    };

    // Message — opens the chat screen with this partner.
    // The modal closes first so the navigation feels clean.
    const handleMessage = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile?.id) return;

        const partner = {
            id: profile.id,
            name: profile.name,
            picture: profile.pictures?.[0] || profile.pictures?.[0]?.path || '',
            age: profile.age,
            city: profile.city,
        };
        setSelectedProfile(null);
        setActiveImageIndex(0);
        navigate(chatPath, { state: { partner } });
    };

    // Safety net — clears the burst if something interrupts the flow
    useEffect(() => {
        if (!superLikeBurst) return;
        const t = setTimeout(() => setSuperLikeBurst(null), 900);
        return () => clearTimeout(t);
    }, [superLikeBurst]);

    const hasPictures =
        Array.isArray(selectedProfile?.pictures) &&
        selectedProfile.pictures.length > 0;

    return (
        <MainLayout pageTitle={NEARBY_TITLE} pageDetails={NEARBY_TEXT}>
            <HelmetHeader pageTitle={NEARBY_TITLE} />
            <style>{burstStyles}</style>

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-3 sm:px-4 py-6 scroll-bar">
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

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="w-full aspect-[3/4] bg-gray-800/50 animate-pulse rounded-2xl border border-white/10"
                            />
                        ))}
                    </div>
                ) : profiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
                        {profiles.map((profile, index) => (
                            <article
                                key={profile.id || index}
                                onClick={() => handleOpenProfile(profile)}
                                className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/10 border border-white/10"
                            >
                                <img
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    src={renderImageUrl(profile.pictures?.[0]) || '/placeholder-avatar.png'}
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

                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDislike(e, profile)}
                                            className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors border border-white/5"
                                            aria-label="Dislike"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleSuperLike(e, profile)}
                                            className="p-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-amber-500/20 text-amber-400 transition-colors border border-white/5"
                                            aria-label="Super Like"
                                        >
                                            <Star size={16} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={(e) => handleLike(e, profile)}
                                            className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium hover:brightness-110 transition-all shadow-md"
                                            aria-label="Like"
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
                        <h3 className="text-lg font-semibold text-white">
                            No matches nearby right now
                        </h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            Try expanding your search distance filters or check back later.
                        </p>
                    </div>
                )}
            </div>

            {/* ------------------------------------------------ */}
            {/* Profile Modal — PartnerProfile design            */}
            {/* ------------------------------------------------ */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                    <div className="relative w-full max-w-md bg-slate-50 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
                        {/* Close button floats over the hero */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 transition-colors border border-white/20"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        {/* -------- Scrollable body -------- */}
                        <div className="overflow-y-auto flex-1 scroll-bar">
                            {/* Hero image area */}
                            <div className="relative w-full aspect-[4/5] bg-slate-950 group">
                                {hasPictures ? (
                                    <>
                                        <div
                                            className="w-full h-full"
                                            onTouchStart={handleTouchStart}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <img
                                                src={
                                                    renderImageUrl(selectedProfile.pictures[activeImageIndex]) ||
                                                    renderImageUrl(selectedProfile.pictures[0]) ||
                                                    '/placeholder-avatar.png'
                                                }
                                                alt={`${selectedProfile.name} - Picture ${activeImageIndex + 1}`}
                                                className="w-full h-full object-contain"
                                                draggable={false}
                                            />
                                        </div>

                                        {/* Progress indicators */}
                                        {selectedProfile.pictures.length > 1 && (
                                            <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
                                                {selectedProfile.pictures.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setActiveImageIndex(idx)}
                                                        className="flex-1 h-1 rounded-full cursor-pointer overflow-hidden bg-white/30 backdrop-blur-sm"
                                                    >
                                                        <div
                                                            className={`h-full bg-white transition-all duration-300 ${idx === activeImageIndex ? 'w-full' : 'w-0'
                                                                }`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Prev / Next */}
                                        {selectedProfile.pictures.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrevImage();
                                                    }}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                                    aria-label="Previous photo"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNextImage();
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                                    aria-label="Next photo"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </>
                                        )}

                                        {/* Fullscreen trigger */}
                                        <button
                                            onClick={() => setIsFullscreen(true)}
                                            className="absolute bottom-3 right-3 z-20 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-2.5 rounded-full transition-all duration-200 border border-white/20 shadow-lg active:scale-95"
                                            title="View fullscreen"
                                            aria-label="View fullscreen"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>

                                        {/* Gradient scrim + name overlay */}
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-16 z-10 text-white">
                                            <h2 className="text-2xl font-bold drop-shadow-md leading-tight">
                                                {selectedProfile.name}
                                                {selectedProfile.age ? `, ${selectedProfile.age}` : ''}
                                            </h2>
                                            <p className="flex items-center gap-1 text-xs text-white/90 mt-0.5 drop-shadow">
                                                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                                                {selectedProfile.distanceFrom ??
                                                    selectedProfile.distance ??
                                                    '1'}{' '}
                                                km away
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>

                            {/* Body content */}
                            <div className="p-5 space-y-5 pb-28">
                                {/* Quick chips */}
                                <div className="flex flex-wrap gap-2">
                                    {selectedProfile.isOnline && (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Online now
                                        </span>
                                    )}
                                    {!selectedProfile.isOnline &&
                                        selectedProfile.lastSeen && (
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                                                <Clock className="w-3.5 h-3.5" />
                                                Last seen{' '}
                                                {new Date(
                                                    selectedProfile.lastSeen
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    {selectedProfile.gender && (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full capitalize">
                                            <Users className="w-3.5 h-3.5" />
                                            {selectedProfile.gender}
                                        </span>
                                    )}
                                </div>

                                {/* Bio */}
                                {selectedProfile.bio && (
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4 text-violet-500" />
                                            <h3 className="font-bold text-slate-800 text-sm">
                                                About
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            "{selectedProfile.bio}"
                                        </p>
                                    </div>
                                )}

                                {/* Details */}
                                {(selectedProfile.occupation ||
                                    selectedProfile.education) && (
                                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <h3 className="font-bold text-slate-800 text-sm">
                                                    Details
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InfoRow
                                                    icon={<Briefcase className="w-4 h-4" />}
                                                    label="Occupation"
                                                    value={selectedProfile.occupation}
                                                    iconBg="bg-amber-50"
                                                    iconColor="text-amber-500"
                                                />
                                                <InfoRow
                                                    icon={<GraduationCap className="w-4 h-4" />}
                                                    label="Education"
                                                    value={selectedProfile.education}
                                                    iconBg="bg-blue-50"
                                                    iconColor="text-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                {/* View full profile link */}
                                {isPremium && (
                                    <button
                                        onClick={handleOpenPartnerProfile}
                                        className="w-full py-3 rounded-2xl bg-violet-500/10 text-violet-700 border border-violet-200 hover:bg-violet-500/20 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                    >
                                        <User size={16} />
                                        View Full Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* -------- Sticky action bar -------- */}
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-2.5">
                            <button
                                onClick={(e) => handleDislike(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200 font-semibold flex items-center justify-center"
                                aria-label="Dislike"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={(e) => handleSuperLike(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors border border-amber-200 font-semibold flex items-center justify-center"
                                aria-label="Super Like"
                            >
                                <Star size={20} fill="currentColor" />
                            </button>
                            <button
                                onClick={(e) => handleMessage(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 font-semibold flex items-center justify-center"
                                aria-label="Message"
                            >
                                <SendHorizontal size={20} />
                            </button>
                            <button
                                onClick={(e) => handleLike(e, selectedProfile)}
                                className="flex-[1.6] py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Heart size={18} fill="currentColor" />
                                Like
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- FULLSCREEN LIGHTBOX ---------------- */}
            {isFullscreen && hasPictures && (
                <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center backdrop-blur-sm fade-in">
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="absolute top-4 left-4 text-xs font-semibold text-white/80 bg-white/10 px-3 py-1 rounded-full z-20">
                        {activeImageIndex + 1} / {selectedProfile.pictures.length}
                    </div>

                    {selectedProfile.pictures.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    <div className="w-full h-full p-4 flex items-center justify-center">
                        <img
                            src={renderImageUrl(selectedProfile.pictures[activeImageIndex])}
                            alt={`${selectedProfile.name} full view`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            draggable={false}
                        />
                    </div>
                </div>
            )}

            {/* ---------------- SUPER LIKE BURST ---------------- */}
            {superLikeBurst && (
                <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center">
                    <span className="absolute rounded-full border-4 border-amber-400/70 animate-[superRing_0.9s_ease-out_forwards]" />
                    <span className="absolute rounded-full border-4 border-yellow-300/60 animate-[superRing_0.9s_ease-out_0.1s_forwards]" />
                    <span className="absolute rounded-full border-4 border-pink-400/50 animate-[superRing_0.9s_ease-out_0.2s_forwards]" />

                    <span className="absolute text-amber-300 animate-[superStar_0.9s_ease-out_forwards]">
                        <Star size={96} fill="currentColor" strokeWidth={0} />
                    </span>

                    {[...Array(8)].map((_, i) => {
                        const angle = (i / 8) * Math.PI * 2;
                        const dx = Math.cos(angle) * 140;
                        const dy = Math.sin(angle) * 140;
                        return (
                            <span
                                key={i}
                                className="absolute text-yellow-400"
                                style={{
                                    '--dx': `${dx}px`,
                                    '--dy': `${dy}px`,
                                    animation: `superSpark 0.8s ease-out forwards`,
                                    animationDelay: `${i * 20}ms`,
                                }}
                            >
                                <Star size={16} fill="currentColor" strokeWidth={0} />
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
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

                        <h3 className="text-xl font-bold text-white mb-2">
                            Premium Feature
                        </h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            <span className="font-semibold text-amber-400">
                                {premiumFeatureName || 'This feature'}
                            </span>{' '}
                            is exclusive to Premium members. Upgrade to connect
                            instantly!
                        </p>

                        <button
                            onClick={() => {
                                setShowPremiumModal(false);
                                navigate(premiumPath);
                            }}
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