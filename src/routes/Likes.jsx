// Likes.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
    Heart, X, Sparkles, MapPin, Briefcase,
    GraduationCap, Crown, ChevronLeft, ChevronRight, Star, User,
} from 'lucide-react';

import {
    LIKES_TITLE, LIKES_TEXT, baseURL, premiumPath, partnerProfilePath,
    ENCOUNTER_ACTION,
} from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import { getPremiumStatusHandler } from '../tanstack/user';
import {
    usersWhoLikeMeHandler,
    usersWhoDisLikeMeHandler,
    usersDisLikedByMeHandler,
    likeUserHandler,
    dislikeUserHandler,
    // markLikesAsSeenHandler
} from '../tanstack/encounter';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

const FILTERS = {
    ALL: 'all',
    SUPER: 'super',
    REGULAR: 'regular',
};

export default function Likes() {
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [filter, setFilter] = useState(FILTERS.ALL);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const trackedSeenIds = useRef(new Set());
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
    /* Fetch likes                                                      */
    /* ---------------------------------------------------------------- */
    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await usersWhoLikeMeHandler();
            const fetchedProfiles = response?.likes || [];
            setProfiles(fetchedProfiles);
        } catch (error) {
            console.error('Failed to fetch match profiles:', error);
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
    const superLikeCount = useMemo(
        () =>
            profiles.filter((p) => p.action === ENCOUNTER_ACTION.SUPER_LIKE)
                .length,
        [profiles]
    );

    const filteredProfiles = useMemo(() => {
        if (filter === FILTERS.SUPER) {
            return profiles.filter(
                (p) => p.action === ENCOUNTER_ACTION.SUPER_LIKE
            );
        }
        if (filter === FILTERS.REGULAR) {
            return profiles.filter(
                (p) => p.action !== ENCOUNTER_ACTION.SUPER_LIKE
            );
        }
        return profiles;
    }, [profiles, filter]);

    /* ---------------------------------------------------------------- */
    /* Mark-as-seen                                                     */
    /* ---------------------------------------------------------------- */
    const markAsSeen = useCallback(async (profileId) => {
        if (!profileId || trackedSeenIds.current.has(profileId)) return;
        trackedSeenIds.current.add(profileId);
        try {
            // await markLikesAsSeenHandler([profileId]);
            console.log(`Marked profile ${profileId} as seen`);
        } catch (error) {
            console.error(`Failed to mark profile ${profileId} as seen:`, error);
        }
    }, []);

    const observerRef = useRef(null);

    const setupObserver = useCallback(() => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const profileId = entry.target.getAttribute(
                            'data-profile-id'
                        );
                        const isSeen =
                            entry.target.getAttribute('data-seen') === 'true';
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
        if (!loading && filteredProfiles.length > 0) {
            setupObserver();
        }
        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loading, filteredProfiles, setupObserver]);

    /* ---------------------------------------------------------------- */
    /* Premium guard + modal control                                    */
    /* ---------------------------------------------------------------- */
    const handleActionGuard = (callback) => {
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        if (callback) callback();
    };

    const handleOpenProfile = (profile) => {
        if (isPremium === null) return;
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

    /* ---------------------------------------------------------------- */
    /* Navigate to the full partner profile                             */
    /* ---------------------------------------------------------------- */
    const handleOpenPartnerProfile = () => {
        if (!selectedProfile?.user_id) return;
        const userId = selectedProfile.user_id;
        setSelectedProfile(null);
        setActiveImageIndex(0);
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
    /* Action handlers: like / dislike                                  */
    /* ---------------------------------------------------------------- */
    const removeProfileFromState = (profileId) => {
        setProfiles((prev) =>
            prev.filter((p) => p.user_id !== profileId)
        );
        setSelectedProfile((prev) =>
            prev && prev.user_id === profileId ? null : prev
        );
    };

    const runAction = async (direction, profile) => {
        const recipientId = profile?.user_id;
        if (!recipientId) return;
        if (isProcessingAction.current) return;
        isProcessingAction.current = true;

        const data = { recipient_id: recipientId };

        // Optimistic removal so the UI feels instant.
        removeProfileFromState(recipientId);

        try {
            if (direction === 'dislike') {
                data.action = ENCOUNTER_ACTION.DISLIKE;
                await dislikeUserHandler(data);
            } else {
                data.action = ENCOUNTER_ACTION.LIKE;
                await likeUserHandler(data);
            }
        } catch (err) {
            console.error(`${direction} failed:`, err);
        } finally {
            isProcessingAction.current = false;
            // Re-fetch so the page reflects the server's current state.
            fetchProfiles();
        }
    };

    // Match back — likes the user who already liked me.
    const handleLike = (e, profile) => {
        if (e) e.stopPropagation();
        if (!profile) return;
        if (isPremium === null) return;
        // Liking someone back from the likes list is a premium action,
        // mirroring the existing gate on the card buttons.
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        runAction('like', profile);
    };

    // Pass — dislikes the user.
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

    return (
        <MainLayout pageTitle={LIKES_TITLE} pageDetails={LIKES_TEXT}>
            <HelmetHeader pageTitle={LIKES_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-4 py-6 scroll-bar">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
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

                {/* Filter tabs */}
                {!loading && profiles.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <FilterChip
                            active={filter === FILTERS.ALL}
                            onClick={() => setFilter(FILTERS.ALL)}
                            icon={<Heart size={13} fill="currentColor" />}
                            label="All"
                            count={profiles.length}
                        />
                        <FilterChip
                            active={filter === FILTERS.SUPER}
                            onClick={() => setFilter(FILTERS.SUPER)}
                            icon={<Star size={13} fill="currentColor" />}
                            label="Super Likes"
                            count={superLikeCount}
                            accent
                        />
                        <FilterChip
                            active={filter === FILTERS.REGULAR}
                            onClick={() => setFilter(FILTERS.REGULAR)}
                            icon={<Heart size={13} />}
                            label="Likes"
                            count={profiles.length - superLikeCount}
                        />
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="w-full aspect-[3/4] bg-gray-800/50 animate-pulse rounded-2xl"
                            />
                        ))}
                    </div>
                ) : filteredProfiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                        {filteredProfiles.map((profile, index) => {
                            const profileId = profile.id || profile._id || index;
                            const isUnseen = profile.seen === false;
                            const shouldBlur = isPremium === false;
                            const isSuperLike =
                                profile.action === ENCOUNTER_ACTION.SUPER_LIKE;

                            return (
                                <article
                                    key={profileId}
                                    data-profile-card
                                    data-profile-id={profileId}
                                    data-seen={profile.seen ?? true}
                                    onClick={() => handleOpenProfile(profile)}
                                    className={`group relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border ${isSuperLike
                                        ? 'border-amber-400/60 ring-2 ring-amber-400/20 hover:shadow-amber-500/25'
                                        : 'border-white/10 hover:shadow-pink-500/10'
                                        }`}
                                >
                                    {/* Super-like card tint */}
                                    {isSuperLike && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-400/10 z-10 pointer-events-none" />
                                    )}

                                    <img
                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${shouldBlur
                                            ? 'filter blur-md scale-110 select-none pointer-events-none'
                                            : ''
                                            }`}
                                        src={
                                            buildPictureUrl(
                                                baseURL,
                                                profile.pictures?.[0]?.path
                                            ) || '/placeholder-avatar.png'
                                        }
                                        alt={`${profile.name}'s profile picture`}
                                        loading="lazy"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                                    {/* Top-right: NEW badge — reserved for the
                                        unseen state only, never displaced by
                                        the super-like indicator */}
                                    {isUnseen && (
                                        <span className="absolute top-3 right-3 z-20 flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg animate-pulse">
                                            <Sparkles size={10} /> NEW
                                        </span>
                                    )}

                                    {profile.liked_at && (
                                        <span className="absolute top-3 left-3 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white border border-white/10 z-20">
                                            {profile.liked_at}
                                        </span>
                                    )}

                                    {/* Centre overlay — super-like pill (type
                                        indicator) stacked above the crown
                                        (free-tier lock). Neither one takes
                                        the top-right badge slot. */}
                                    {(isSuperLike || shouldBlur) && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                            {isSuperLike && (
                                                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/40">
                                                    <Star
                                                        size={11}
                                                        fill="currentColor"
                                                        strokeWidth={0}
                                                    />
                                                    SUPER LIKE
                                                </span>
                                            )}

                                            {shouldBlur && (
                                                <div
                                                    className={`p-3 rounded-full backdrop-blur-md shadow-lg border ${isSuperLike
                                                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                                                        : 'bg-black/60 border-amber-500/30 text-amber-400'
                                                        }`}
                                                >
                                                    <Crown size={22} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex flex-col justify-end z-20">
                                        <h3 className="text-base sm:text-lg font-bold text-white truncate drop-shadow-md">
                                            {profile.name},{' '}
                                            <span className="font-normal">
                                                {profile.age}
                                            </span>
                                        </h3>

                                        {profile.bio && (
                                            <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                                                {profile.bio}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDislike(e, profile)}
                                                className="flex-1 py-1.5 flex items-center justify-center rounded-xl bg-gray-800/80 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors border border-white/5"
                                                aria-label="Pass"
                                            >
                                                <X size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleLike(e, profile)}
                                                className={`flex-1 py-1.5 flex items-center justify-center rounded-xl text-white font-medium hover:brightness-110 transition-all shadow-md ${isSuperLike
                                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                                    : 'bg-gradient-to-r from-pink-500 to-violet-600'
                                                    }`}
                                                aria-label="Match Back"
                                            >
                                                <Heart
                                                    size={16}
                                                    fill="currentColor"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 text-pink-500">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                            {filter === FILTERS.SUPER
                                ? 'No super likes yet'
                                : 'No likes yet'}
                        </h3>
                        <p className="text-sm text-gray-400 max-w-sm mt-1">
                            {filter === FILTERS.SUPER
                                ? 'When someone sends you a super like, it will appear here.'
                                : 'Keep active and update your profile picture to get noticed by more people nearby!'}
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed Profile Modal */}
            {selectedProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
                    <div
                        className={`relative w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden shadow-2xl max-h-[88vh] flex flex-col border ${selectedProfile.action === ENCOUNTER_ACTION.SUPER_LIKE
                            ? 'border-amber-400/40'
                            : 'border-white/10'
                            }`}
                    >
                        {/* Super-like banner inside the modal */}
                        {selectedProfile.action ===
                            ENCOUNTER_ACTION.SUPER_LIKE && (
                                <div className="absolute top-0 left-0 right-0 z-30 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center gap-2 text-slate-900 text-xs font-bold">
                                    <Star
                                        size={13}
                                        fill="currentColor"
                                        strokeWidth={0}
                                    />
                                    {selectedProfile.name} sent you a Super Like
                                </div>
                            )}

                        <button
                            onClick={handleCloseModal}
                            className="absolute right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors border border-white/10"
                            style={{
                                top:
                                    selectedProfile.action ===
                                        ENCOUNTER_ACTION.SUPER_LIKE
                                        ? '52px'
                                        : '16px',
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div
                            className="relative w-full h-80 sm:h-96 bg-black flex-shrink-0 select-none overflow-hidden"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img
                                src={
                                    buildPictureUrl(
                                        baseURL,
                                        selectedProfile.pictures?.[
                                            activeImageIndex
                                        ]?.path
                                    ) || '/placeholder-avatar.png'
                                }
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-40"
                            />
                            <img
                                src={
                                    buildPictureUrl(
                                        baseURL,
                                        selectedProfile.pictures?.[
                                            activeImageIndex
                                        ]?.path
                                    ) || '/placeholder-avatar.png'
                                }
                                alt={`${selectedProfile.name} photo ${activeImageIndex + 1
                                    }`}
                                className="relative w-full h-full object-contain z-10 transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/40 z-10 pointer-events-none" />

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

                            {selectedProfile.pictures?.length > 1 && (
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-white/10">
                                    {activeImageIndex + 1} /{' '}
                                    {selectedProfile.pictures.length}
                                </div>
                            )}

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

                            <div className="absolute bottom-6 left-4 right-4 z-20 text-white pointer-events-none">
                                <h2 className="text-2xl font-bold drop-shadow-md">
                                    {selectedProfile.name},{' '}
                                    {selectedProfile.age}
                                </h2>
                                {selectedProfile.location && (
                                    <p className="flex items-center gap-1 text-sm text-gray-200 mt-0.5 drop-shadow">
                                        <MapPin
                                            size={14}
                                            className="text-pink-400"
                                        />{' '}
                                        {selectedProfile.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-gray-300 scroll-bar">
                            {selectedProfile.bio && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                        About
                                    </h4>
                                    <p className="text-sm leading-relaxed text-gray-200">
                                        {selectedProfile.bio}
                                    </p>
                                </div>
                            )}

                            {selectedProfile.occupation && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Briefcase
                                        size={16}
                                        className="text-pink-400 flex-shrink-0"
                                    />
                                    <span>{selectedProfile.occupation}</span>
                                </div>
                            )}

                            {selectedProfile.education && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <GraduationCap
                                        size={16}
                                        className="text-violet-400 flex-shrink-0"
                                    />
                                    <span>{selectedProfile.education}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-900/90 border-t border-white/5 flex items-center gap-3 flex-shrink-0">
                            {isPremium && (
                                <button
                                    onClick={handleOpenPartnerProfile}
                                    className="p-3 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
                                    aria-label="View Full Profile"
                                    title="View Full Profile"
                                >
                                    <User size={20} />
                                </button>
                            )}
                            <button
                                onClick={(e) => handleDislike(e, selectedProfile)}
                                className="flex-1 py-3 rounded-2xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                            >
                                Pass
                            </button>
                            <button
                                onClick={(e) => handleLike(e, selectedProfile)}
                                className={`flex-1 py-3 rounded-2xl font-medium hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 ${selectedProfile.action ===
                                    ENCOUNTER_ACTION.SUPER_LIKE
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900'
                                    : 'bg-gradient-to-r from-pink-500 to-violet-600 text-white'
                                    }`}
                            >
                                <Heart size={18} fill="currentColor" /> Match
                                Back
                            </button>
                        </div>
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
                            <Crown size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                            See Who Likes You
                        </h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Unblur profile photos and match back instantly by
                            upgrading to Premium!
                        </p>

                        <button
                            onClick={() => {
                                setShowPremiumModal(false);
                                navigate(premiumPath);
                            }}
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

/* ------------------------------------------------------------------ */
/* Filter chip                                                         */
/* ------------------------------------------------------------------ */
function FilterChip({ active, onClick, icon, label, count, accent = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active
                ? accent
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-transparent shadow-md shadow-amber-500/25'
                    : 'bg-gradient-to-r from-pink-500 to-violet-600 text-white border-transparent shadow-md shadow-pink-500/25'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/25'
                }`}
        >
            {icon}
            <span>{label}</span>
            <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${active
                    ? accent
                        ? 'bg-slate-900/20 text-slate-900'
                        : 'bg-white/25 text-white'
                    : 'bg-white/10 text-gray-300'
                    }`}
            >
                {count}
            </span>
        </button>
    );
}