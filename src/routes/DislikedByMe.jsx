// DislikedByMe.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
    Heart, X, Sparkles, MapPin, Briefcase,
    GraduationCap, Crown, ChevronLeft, ChevronRight, User,
    Maximize2, SendHorizontal, Users, Clock, CheckCircle2,
    Frown, EyeOff, Ruler, Cigarette, Wine, Star,
    Heart as HeartIcon,
} from 'lucide-react';

import {
    DISLIKED_BY_ME_TITLE,
    DISLIKED_BY_ME_TEXT,
    premiumPath,
    partnerProfilePath,
    chatPath,
    ENCOUNTER_ACTION,
} from '../utils/constants';
import { renderImageUrl } from '../utils/functions';
import { getPremiumStatusHandler } from '../tanstack/user';
import {
    usersDisLikedByMeHandler,
    likeUserHandler,
    dislikeUserHandler,
} from '../tanstack/encounter';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

const FILTERS = {
    ALL: 'all',
    RECENT: 'recent',
};

const RECENT_WINDOW_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Reusable InfoRow                                                   */
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

export default function DislikedByMe() {
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [filter, setFilter] = useState(FILTERS.ALL);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const [showPremiumModal, setShowPremiumModal] = useState(false);

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
    /* Fetch                                                            */
    /* ---------------------------------------------------------------- */
    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await usersDisLikedByMeHandler();
            setProfiles(response?.disLikes || []);
        } catch (error) {
            console.error('Failed to fetch disliked profiles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    /* ---------------------------------------------------------------- */
    /* Derived lists                                                    */
    /* ---------------------------------------------------------------- */
    const recentCount = useMemo(() => {
        const cutoff = Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        return profiles.filter((p) => {
            if (!p.disliked_at_iso) return false;
            return new Date(p.disliked_at_iso).getTime() >= cutoff;
        }).length;
    }, [profiles]);

    const filteredProfiles = useMemo(() => {
        if (filter === FILTERS.RECENT) {
            const cutoff =
                Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
            return profiles.filter((p) => {
                if (!p.disliked_at_iso) return false;
                return new Date(p.disliked_at_iso).getTime() >= cutoff;
            });
        }
        return profiles;
    }, [profiles, filter]);

    /* ---------------------------------------------------------------- */
    /* Modal control                                                    */
    /* ---------------------------------------------------------------- */
    const handleOpenProfile = (profile) => {
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        setSelectedProfile(profile);
        setActiveImageIndex(0);
        setIsFullscreen(false);
    };

    const handleCloseModal = () => {
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
    };

    /* ---------------------------------------------------------------- */
    /* Navigate to full partner profile                                 */
    /* ---------------------------------------------------------------- */
    const handleOpenPartnerProfile = () => {
        if (!selectedProfile?.user_id) return;
        const userId = selectedProfile.user_id;
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
        navigate(partnerProfilePath, { state: { user_id: userId } });
    };

    /* ---------------------------------------------------------------- */
    /* Carousel                                                         */
    /* ---------------------------------------------------------------- */
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
        if (distance > 50) handleNextImage();
        else if (distance < -50) handlePrevImage();
        setTouchStartX(0);
        setTouchEndX(0);
    };

    /* ---------------------------------------------------------------- */
    /* Keyboard nav                                                     */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        if (!selectedProfile) return;
        const onKey = (e) => {
            if (isFullscreen) {
                if (e.key === 'Escape') setIsFullscreen(false);
                if (e.key === 'ArrowLeft') handlePrevImage();
                if (e.key === 'ArrowRight') handleNextImage();
                return;
            }
            if (e.key === 'Escape') handleCloseModal();
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedProfile, activeImageIndex, isFullscreen]);

    /* ---------------------------------------------------------------- */
    /* Action handlers                                                  */
    /* ---------------------------------------------------------------- */
    const removeProfileFromState = (userId) => {
        setProfiles((prev) => prev.filter((p) => p.user_id !== userId));
        setSelectedProfile((prev) =>
            prev && prev.user_id === userId ? null : prev
        );
    };

    const runAction = async (direction, profile) => {
        const recipientId = profile?.user_id;
        if (!recipientId) return;
        if (isProcessingAction.current) return;
        isProcessingAction.current = true;

        const data = { recipient_id: recipientId };
        removeProfileFromState(recipientId);

        try {
            if (direction === 'dislike') {
                data.action = ENCOUNTER_ACTION.DISLIKE;
                await dislikeUserHandler(data);
            } else if (direction === 'super_like') {
                data.action = ENCOUNTER_ACTION.SUPER_LIKE;
                await likeUserHandler(data);
            } else {
                data.action = ENCOUNTER_ACTION.LIKE;
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
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        runAction('like', profile);
    };

    const handleSuperLike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        runAction('super_like', profile);
    };

    const handleDislike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        runAction('dislike', profile);
    };

    const handleMessage = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile?.user_id) return;
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }

        const partner = {
            id: profile.user_id,
            name: profile.name,
            picture: profile.pictures?.[0]?.path || '',
            age: profile.age,
            city: profile.city,
        };
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
        navigate(chatPath, { state: { partner } });
    };

    const hasPictures =
        Array.isArray(selectedProfile?.pictures) &&
        selectedProfile.pictures.length > 0;

    return (
        <MainLayout
            pageTitle={DISLIKED_BY_ME_TITLE}
            pageDetails={DISLIKED_BY_ME_TEXT}
        >
            <HelmetHeader pageTitle={DISLIKED_BY_ME_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-4 py-6 scroll-bar">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            People You Passed
                            <span className="inline-flex items-center justify-center bg-gradient-to-r from-slate-500 to-slate-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {profiles.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            A second look never hurts.
                        </p>
                    </div>
                </div>

                {/* Filter tabs */}
                {!loading && profiles.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <FilterChip
                            active={filter === FILTERS.ALL}
                            onClick={() => setFilter(FILTERS.ALL)}
                            icon={<Frown size={13} />}
                            label="All"
                            count={profiles.length}
                        />
                        <FilterChip
                            active={filter === FILTERS.RECENT}
                            onClick={() => setFilter(FILTERS.RECENT)}
                            icon={<Clock size={13} />}
                            label="This week"
                            count={recentCount}
                            accent
                        />
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="w-full aspect-[3/4] bg-gray-800/50 animate-pulse rounded-2xl border border-white/10"
                            />
                        ))}
                    </div>
                ) : filteredProfiles.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                        {filteredProfiles.map((profile, index) => {
                            const shouldBlur = isPremium === false;

                            return (
                                <article
                                    key={profile.user_id ?? index}
                                    onClick={() => handleOpenProfile(profile)}
                                    className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border border-white/10 hover:shadow-slate-500/20"
                                >
                                    {/* Slate tint matching the Passed page */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-slate-700/10 z-10 pointer-events-none" />

                                    <img
                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${shouldBlur
                                            // ? 'filter blur-md scale-110 select-none pointer-events-none'
                                            ? ''
                                            : ''
                                            }`}
                                        src={
                                            renderImageUrl(profile.pictures?.[0]?.path) ||
                                            '/placeholder-avatar.png'
                                        }
                                        alt={`${profile.name}'s profile picture`}
                                        loading="lazy"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                                    {/* Free-tier lock */}
                                    {/* {shouldBlur && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                            <div className="p-3 rounded-full backdrop-blur-md shadow-lg border bg-black/60 border-amber-500/30 text-amber-400">
                                                <Crown size={22} />
                                            </div>
                                        </div>
                                    )} */}

                                    {/* Top-left: relative time */}
                                    {profile.disliked_at && (
                                        <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white border border-white/10 z-20">
                                            {profile.disliked_at}
                                        </span>
                                    )}

                                    {/* Top-right: online indicator */}
                                    {profile.is_online && (
                                        <span className="absolute top-3 right-3 z-20 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-lg">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            ONLINE
                                        </span>
                                    )}

                                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex flex-col justify-end z-20">
                                        <h3 className="text-base sm:text-lg font-bold text-white truncate drop-shadow-md">
                                            {profile.name},{' '}
                                            <span className="font-normal">
                                                {profile.age}
                                            </span>
                                        </h3>

                                        {profile.city && (
                                            <p className="text-xs text-gray-300 line-clamp-1 mt-0.5 flex items-center gap-1">
                                                <MapPin size={10} />
                                                {profile.city}
                                            </p>
                                        )}

                                        {/* Action buttons — pass, message,
                                            super like, like */}
                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDislike(e, profile)}
                                                className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors border border-white/5"
                                                aria-label="Pass again"
                                            >
                                                <X size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleMessage(e, profile)}
                                                className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-blue-500/20 text-gray-300 hover:text-blue-400 transition-colors border border-white/5"
                                                aria-label="Message"
                                            >
                                                <SendHorizontal size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleSuperLike(e, profile)}
                                                className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-amber-500/20 text-amber-400 transition-colors border border-white/5"
                                                aria-label="Super Like"
                                            >
                                                <Star size={16} fill="currentColor" />
                                            </button>
                                            <button
                                                onClick={(e) => handleLike(e, profile)}
                                                className="flex-[1.4] py-1.5 flex items-center justify-center rounded-xl text-white font-medium hover:brightness-110 transition-all shadow-md bg-gradient-to-r from-pink-500 to-violet-600"
                                                aria-label="Like"
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
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mb-4 text-slate-400">
                            <Frown size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                            {filter === FILTERS.RECENT
                                ? 'No recent passes'
                                : "You haven't passed on anyone yet"}
                        </h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            {filter === FILTERS.RECENT
                                ? "You haven't passed on anyone in the last 7 days."
                                : "When you pass on someone, they'll show up here. If you change your mind, you can always go back and like them."}
                        </p>
                    </div>
                )}
            </div>

            {/* ------------------------------------------------ */}
            {/* Profile Modal                                     */}
            {/* ------------------------------------------------ */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                    <div className="relative w-full max-w-md bg-slate-50 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
                        <button
                            onClick={handleCloseModal}
                            className="absolute right-3 top-3 z-30 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/75 transition-colors border border-white/20"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="overflow-y-auto flex-1 scroll-bar">
                            {/* Hero image */}
                            <div className="relative w-full aspect-[4/5] bg-slate-950">
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
                                                    renderImageUrl(
                                                        selectedProfile.pictures[activeImageIndex]?.path
                                                    ) ||
                                                    renderImageUrl(
                                                        selectedProfile.pictures[0]?.path
                                                    ) ||
                                                    '/placeholder-avatar.png'
                                                }
                                                alt={`${selectedProfile.name} - Picture ${activeImageIndex + 1}`}
                                                className="w-full h-full object-contain"
                                                draggable={false}
                                            />
                                        </div>

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

                                        {selectedProfile.pictures.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                                    aria-label="Previous photo"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 backdrop-blur-md transition-all active:scale-95"
                                                    aria-label="Next photo"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => setIsFullscreen(true)}
                                            className="absolute bottom-3 right-3 z-20 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-2.5 rounded-full transition-all duration-200 border border-white/20 shadow-lg active:scale-95"
                                            title="View fullscreen"
                                            aria-label="View fullscreen"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>

                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-16 z-10 text-white">
                                            <h2 className="text-2xl font-bold drop-shadow-md leading-tight">
                                                {selectedProfile.name}
                                                {selectedProfile.age
                                                    ? `, ${selectedProfile.age}`
                                                    : ''}
                                            </h2>
                                            {selectedProfile.city && (
                                                <p className="flex items-center gap-1 text-xs text-white/90 mt-0.5 drop-shadow">
                                                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                                                    {selectedProfile.city}
                                                </p>
                                            )}
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
                                    {selectedProfile.is_online && (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Online now
                                        </span>
                                    )}
                                    {!selectedProfile.is_online &&
                                        selectedProfile.last_seen && (
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                                                <Clock className="w-3.5 h-3.5" />
                                                Last seen{' '}
                                                {new Date(
                                                    selectedProfile.last_seen
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    {selectedProfile.gender && (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full capitalize">
                                            <Users className="w-3.5 h-3.5" />
                                            {selectedProfile.gender}
                                        </span>
                                    )}
                                    {selectedProfile.disliked_at && (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                                            <Frown className="w-3.5 h-3.5" />
                                            You passed{' '}
                                            {selectedProfile.disliked_at}
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

                                {/* Details grid — same as Passed */}
                                {(selectedProfile.reason_on_app ||
                                    selectedProfile.education ||
                                    selectedProfile.relationship_status ||
                                    selectedProfile.height_cm ||
                                    selectedProfile.smoking ||
                                    selectedProfile.drinking) && (
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
                                                    label="Looking for"
                                                    value={selectedProfile.reason_on_app}
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
                                                <InfoRow
                                                    icon={<HeartIcon className="w-4 h-4" />}
                                                    label="Relationship"
                                                    value={selectedProfile.relationship_status}
                                                    iconBg="bg-pink-50"
                                                    iconColor="text-pink-500"
                                                />
                                                <InfoRow
                                                    icon={<Ruler className="w-4 h-4" />}
                                                    label="Height"
                                                    value={
                                                        selectedProfile.height_cm
                                                            ? `${selectedProfile.height_cm} cm`
                                                            : null
                                                    }
                                                    iconBg="bg-indigo-50"
                                                    iconColor="text-indigo-500"
                                                />
                                                <InfoRow
                                                    icon={<Cigarette className="w-4 h-4" />}
                                                    label="Smoking"
                                                    value={selectedProfile.smoking}
                                                    iconBg="bg-slate-100"
                                                    iconColor="text-slate-500"
                                                />
                                                <InfoRow
                                                    icon={<Wine className="w-4 h-4" />}
                                                    label="Drinking"
                                                    value={selectedProfile.drinking}
                                                    iconBg="bg-purple-50"
                                                    iconColor="text-purple-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                {/* View full profile */}
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

                        {/* Sticky action bar — 4 buttons */}
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-2">
                            <button
                                onClick={(e) => handleDislike(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200 font-semibold flex items-center justify-center"
                                aria-label="Pass again"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={(e) => handleMessage(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 font-semibold flex items-center justify-center"
                                aria-label="Message"
                            >
                                <SendHorizontal size={20} />
                            </button>
                            <button
                                onClick={(e) => handleSuperLike(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors border border-amber-200 font-semibold flex items-center justify-center"
                                aria-label="Super Like"
                            >
                                <Star size={20} fill="currentColor" />
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

            {/* Fullscreen Lightbox */}
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
                            src={renderImageUrl(selectedProfile.pictures[activeImageIndex]?.path)}
                            alt={`${selectedProfile.name} full view`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            draggable={false}
                        />
                    </div>
                </div>
            )}

            {/* Premium Modal */}
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
                            <EyeOff size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                            Premium Feature
                        </h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Viewing full profiles, messaging, and liking back
                            people you passed on is exclusive to Premium
                            members. Upgrade to reconnect!
                        </p>

                        <button
                            onClick={() => {
                                setShowPremiumModal(false);
                                navigate(premiumPath);
                            }}
                            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                            <Crown size={18} />
                            Unlock with Premium
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Filter chip                                                        */
/* ------------------------------------------------------------------ */
function FilterChip({ active, onClick, icon, label, count, accent = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active
                ? accent
                    ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white border-transparent shadow-md shadow-slate-500/25'
                    : 'bg-gradient-to-r from-slate-600 to-slate-800 text-white border-transparent shadow-md shadow-slate-500/25'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/25'
                }`}
        >
            {icon}
            <span>{label}</span>
            <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${active
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-gray-300'
                    }`}
            >
                {count}
            </span>
        </button>
    );
}