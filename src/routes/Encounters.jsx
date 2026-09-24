// Encounters.jsx
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Swiper as ReactSwiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Heart, X, SendHorizontal, Star, Megaphone, CheckCircle, Clock,
    Sparkles, User, Crown, SlidersHorizontal, Lock, MapPin,
    Briefcase, GraduationCap, ChevronLeft, ChevronRight, Maximize2,
    Users, CheckCircle2, Ruler, Cigarette, Wine,
    Heart as HeartIcon,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './Encounters.css';

import {
    ENCOUNTERS_TITLE, ENCOUNTERS_TEXT, ENCOUNTER_ACTION, chatPath,
    partnerProfilePath, premiumPath, GENDER,
    AD_EVERY_N_CARDS as FALLBACK_AD_EVERY_N,
} from '../utils/constants';
import { renderImageUrl } from '../utils/functions';
import {
    getEncountersProfilesHandler,
    likeUserHandler,
    dislikeUserHandler,
    saveEncountersFilterHandler,
} from '../tanstack/encounter';
import { getPremiumStatusHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

/* ------------------------------------------------------------------ */
/* Injected keyframes for the super-like burst and card entry         */
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
@keyframes cardIn {
    0%   { opacity: 0; transform: scale(0.96); }
    100% { opacity: 1; transform: scale(1);    }
}
`;

const DEFAULT_FILTER = {
    max_distance_km: 200,
    interested_in: GENDER.EVERYONE,
    min_age: 18,
    max_age: 100,
    online_only: false,
    premium_only: false,
};

/* ------------------------------------------------------------------ */
/* Reusable InfoRow (matches DislikedByMe / Passed)                   */
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

export default function Encounters() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [profiles, setProfiles] = useState([]);
    const [myself, setMyself] = useState({});
    const [partner, setPartner] = useState({});
    const [cards, setCards] = useState([]);
    const [quota, setQuota] = useState(null);
    const [quotaExhausted, setQuotaExhausted] = useState(false);
    const [adEveryN, setAdEveryN] = useState(FALLBACK_AD_EVERY_N);

    // Premium status
    const [isPremium, setIsPremium] = useState(null);

    // Premium Feature Modal
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [premiumFeatureName, setPremiumFeatureName] = useState('');

    // Filter modal
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filterDraft, setFilterDraft] = useState(DEFAULT_FILTER);
    const [activeFilter, setActiveFilter] = useState(null);

    // Match overlay
    const [matchInfo, setMatchInfo] = useState(null);

    // Super-like burst
    const [superLikeBurst, setSuperLikeBurst] = useState(null);

    // ----------------------------------------------------------------
    // Profile detail modal (NEW — replaces the old navigate-to-page
    // behavior when tapping the profile area of a card).
    // ----------------------------------------------------------------
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const [likeTrigger, setLikeTrigger] = useState(false);
    const [dislikeTrigger, setDislikeTrigger] = useState(false);

    const nextCardId = useRef(0);
    const dragInfo = useRef({ startX: 0, startY: 0, isDragging: false });
    const isProcessingDismiss = useRef(false);
    const filterDraftTouched = useRef(false);

    /* ---------------------------------------------------------------- */
    /* Premium status                                                   */
    /* ---------------------------------------------------------------- */
    const { data: premiumStatusData } = useQuery({
        queryKey: ['premium-status'],
        queryFn: getPremiumStatusHandler,
    });

    useEffect(() => {
        if (!premiumStatusData) return;
        setIsPremium(Boolean(premiumStatusData.is_premium));
    }, [premiumStatusData]);

    const isFreeUser = isPremium === null ? null : !isPremium;

    /* ---------------------------------------------------------------- */
    /* Fetch                                                            */
    /* ---------------------------------------------------------------- */
    const {
        data: encounterData,
        refetch: refetchEncounters,
        isFetching: isFetchingEncounters,
    } = useQuery({
        queryKey: ['encounters'],
        queryFn: () => getEncountersProfilesHandler(),
    });

    useEffect(() => {
        const serverFilter = encounterData?.filter;
        if (!serverFilter) return;
        if (filterDraftTouched.current) return;
        setFilterDraft({ ...DEFAULT_FILTER, ...serverFilter });
        setActiveFilter({ ...DEFAULT_FILTER, ...serverFilter });
    }, [encounterData]);

    useEffect(() => {
        if (!encounterData) return;
        if (isFreeUser === null) return;

        const {
            users: fetchedProfiles = [],
            myself: fetchedMyself = {},
            quota: fetchedQuota = null,
            quotaExhausted: fetchedExhausted = false,
            adEveryN: fetchedAdEveryN = FALLBACK_AD_EVERY_N,
        } = encounterData;

        setMyself(fetchedMyself);
        setQuota(fetchedQuota);
        setQuotaExhausted(fetchedExhausted);
        setAdEveryN(fetchedAdEveryN);

        if (fetchedExhausted || fetchedProfiles.length === 0) {
            const resetsAt = fetchedQuota?.resetsAt || null;
            seedCards([], fetchedExhausted, resetsAt, isFreeUser);
            return;
        }
        seedCards(fetchedProfiles, false, null, isFreeUser);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [encounterData, isFreeUser]);

    /* ---------------------------------------------------------------- */
    /* Card factory — now preserves the profile-sourced fields so the   */
    /* modal can display them without a second fetch.                   */
    /* ---------------------------------------------------------------- */
    const createCardData = useCallback((item, id) => {
        if (item.type === 'ad') {
            return {
                id,
                type: 'ad',
                title: item.title || 'Sponsored Advertisement',
                description:
                    item.description ||
                    'Upgrade to Premium for an ad-free experience and unlimited likes!',
                image:
                    item.image ||
                    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80',
                isDismissing: false,
                transform: '',
                transition: '',
            };
        }
        if (item.type === 'end') {
            return {
                id,
                type: 'end',
                variant: item.variant || 'default',
                title: item.title || null,
                description: item.description || null,
                resetsAt: item.resetsAt || null,
                isDismissing: false,
                transform: '',
                transition: '',
            };
        }
        const fallbackImg = 'https://via.placeholder.com/400x600?text=No+Image';
        const pictures =
            item?.pictures?.length > 0 ? item.pictures : [fallbackImg];
        return {
            id,
            type: 'profile',
            profileId: item.id,
            name: item.name,
            age: item.age,
            city: item.city,
            gender: item.gender,
            is_online: item.is_online,
            last_seen: item.last_seen,
            distanceFrom: item.distance_from,
            pictures,
            // Profile-sourced fields — carried through for the modal.
            bio: item.bio,
            education: item.education,
            reason_on_app: item.reason_on_app,
            relationship_status: item.relationship_status,
            height_cm: item.height_cm,
            smoking: item.smoking,
            drinking: item.drinking,
            isDismissing: false,
            transform: '',
            transition: '',
        };
    }, []);

    /* ---------------------------------------------------------------- */
    /* Sequence builder                                                 */
    /* ---------------------------------------------------------------- */
    const buildCardSequence = useCallback(
        (userProfiles, freeTier, everyN, quotaVariant, resetsAt) => {
            const sequence = [];
            userProfiles.forEach((profile, index) => {
                sequence.push({ ...profile, type: 'profile' });
                if (freeTier && everyN > 0 && (index + 1) % everyN === 0) {
                    sequence.push({
                        type: 'ad',
                        id: `ad-${index}`,
                        title: 'Sponsored Offer',
                        description:
                            'Upgrade to Premium for unlimited cards and zero ads!',
                    });
                }
            });
            sequence.push({
                type: 'end',
                variant: quotaVariant ? 'quota' : 'default',
                resetsAt: resetsAt || null,
            });
            return sequence;
        },
        []
    );

    const seedCards = useCallback(
        (fetchedProfiles, quotaVariant, resetsAt, freeTier) => {
            const sequencedItems = buildCardSequence(
                fetchedProfiles,
                freeTier,
                adEveryN,
                quotaVariant,
                resetsAt
            );
            const orderedProfiles = [...sequencedItems].reverse();
            setProfiles(orderedProfiles);

            const initialCount = Math.min(12, orderedProfiles.length);
            const initialCards = [];
            for (let i = 0; i < initialCount; i++) {
                initialCards.push(createCardData(orderedProfiles[i], i));
            }
            nextCardId.current = initialCount;
            setCards(initialCards);
        },
        [adEveryN, buildCardSequence, createCardData]
    );

    const appendNewCard = useCallback(
        (currentProfilesList) => {
            const activeProfiles = currentProfilesList || profiles;
            if (activeProfiles.length === 0) return;

            setCards((prev) => {
                const nextIndex = nextCardId.current;
                if (nextIndex >= activeProfiles.length) return prev;
                const newCard = createCardData(
                    activeProfiles[nextIndex],
                    nextIndex
                );
                nextCardId.current += 1;
                return [...prev, newCard];
            });
        },
        [profiles, createCardData]
    );

    const triggerButtonFeedback = (direction) => {
        if (direction === 'like' || direction === 'super_like') {
            setLikeTrigger((prev) => !prev);
        } else {
            setDislikeTrigger((prev) => !prev);
        }
    };

    /* ---------------------------------------------------------------- */
    /* Swipe decision                                                   */
    /* ---------------------------------------------------------------- */
    const handleSwipeDecision = async (direction, card) => {
        if (card.type !== 'profile') return;

        if (isFreeUser) {
            setQuota((prev) => {
                if (!prev) return prev;
                const seen = prev.seen + 1;
                const remaining = Math.max(0, prev.limit - seen);
                return { ...prev, seen, remaining };
            });
        }

        const data = { recipient_id: card.profileId };

        if (direction === 'dislike') {
            data.action = ENCOUNTER_ACTION.DISLIKE;
            dislikeUserHandler(data);
            return;
        }

        data.action =
            direction === 'super_like'
                ? ENCOUNTER_ACTION.SUPER_LIKE
                : ENCOUNTER_ACTION.LIKE;

        try {
            const response = await likeUserHandler(data);

            if (response?.match) {
                setMatchInfo({
                    chatId: response.chatId || null,
                    recipientId: card.profileId,
                    name: card.name,
                    picture: card.pictures?.[0]?.path || null,
                    age: card.age || null,
                    city: card.city || null,
                });
                return;
            }
        } catch (err) {
            console.error('likeUser failed:', err);
        }

        appendNewCard();
    };

    /* ---------------------------------------------------------------- */
    /* Swipe animation                                                  */
    /* ---------------------------------------------------------------- */
    const triggerSwipe = (direction) => {
        if (isProcessingDismiss.current) return;
        if (matchInfo) return;
        isProcessingDismiss.current = true;

        setCards((prev) => {
            if (prev.length === 0) {
                isProcessingDismiss.current = false;
                return prev;
            }
            const updated = [...prev];
            const activeIdx = updated.length - 1;
            const activeCard = updated[activeIdx];

            if (activeCard.isDismissing || activeCard.type === 'end') {
                isProcessingDismiss.current = false;
                return prev;
            }

            const multiplier = direction === 'dislike' ? -1 : 1;

            activeCard.isDismissing = true;
            activeCard.transition =
                'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            activeCard.transform = `translate(${multiplier * window.innerWidth
                }px, -40px) rotate(${45 * multiplier}deg)`;

            triggerButtonFeedback(direction);

            setTimeout(() => {
                setCards((p) => p.filter((c) => c.id !== activeCard.id));
                isProcessingDismiss.current = false;

                setSuperLikeBurst((prevBurst) =>
                    prevBurst && prevBurst.cardId === activeCard.id
                        ? null
                        : prevBurst
                );
            }, 800);

            handleSwipeDecision(direction, activeCard);
            return updated;
        });
    };

    const handleButtonClick = (direction) => triggerSwipe(direction);

    /* ---------------------------------------------------------------- */
    /* Super like                                                       */
    /* ---------------------------------------------------------------- */
    const handleSuperLikeClick = () => {
        if (isFreeUser === null) return;

        if (isFreeUser) {
            setPremiumFeatureName('Super Like');
            setShowPremiumModal(true);
            return;
        }

        if (isProcessingDismiss.current) return;
        if (matchInfo) return;

        const activeCard = cards[cards.length - 1];
        if (
            !activeCard ||
            activeCard.isDismissing ||
            activeCard.type === 'end' ||
            activeCard.type === 'ad'
        ) {
            return;
        }

        setSuperLikeBurst({ cardId: activeCard.id });
        setTimeout(() => triggerSwipe('super_like'), 80);
    };

    useEffect(() => {
        if (!superLikeBurst) return;
        const t = setTimeout(() => setSuperLikeBurst(null), 900);
        return () => clearTimeout(t);
    }, [superLikeBurst]);

    /* ---------------------------------------------------------------- */
    /* partner sync                                                     */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        if (cards?.length > 0) {
            const targetCard = cards[cards.length - 1];
            const {
                profileId: id = '',
                name = '',
                age = '',
                pictures = [{ path: '' }],
                is_online = null,
                last_seen = null,
            } = targetCard;
            setPartner({
                id,
                name,
                age,
                picture: pictures[0]?.path || '',
                is_online,
                last_seen,
            });
        }
    }, [cards]);

    const handleMessageClick = () => {
        if (isFreeUser === null) return;

        if (isFreeUser) {
            setPremiumFeatureName('Direct Messaging');
            setShowPremiumModal(true);
            return;
        }

        if (!partner.id) return;
        navigate(chatPath, { state: { myself, partner } });
    };

    /* ---------------------------------------------------------------- */
    /* Filter modal                                                     */
    /* ---------------------------------------------------------------- */
    const handleOpenFilters = () => {
        filterDraftTouched.current = false;
        setFilterDraft({ ...DEFAULT_FILTER, ...filterDraft });
        setShowFilterModal(true);
    };

    const handleFilterChange = (patch) => {
        filterDraftTouched.current = true;
        setFilterDraft((prev) => ({ ...prev, ...patch }));
    };

    const handleApplyFilters = async () => {
        setShowFilterModal(false);
        filterDraftTouched.current = false;

        const nextFilter = { ...filterDraft };
        setActiveFilter(nextFilter);

        setCards([]);
        setProfiles([]);
        nextCardId.current = 0;

        try {
            await saveEncountersFilterHandler(nextFilter);
        } catch (err) {
            console.error('Failed to save filters:', err);
        }

        await queryClient.invalidateQueries({ queryKey: ['encounters'] });
        await refetchEncounters();
    };

    /* ---------------------------------------------------------------- */
    /* Profile detail modal handlers (NEW)                              */
    /* ---------------------------------------------------------------- */
    const handleOpenProfile = (card) => {
        if (!card || card.type !== 'profile') return;
        setSelectedProfile(card);
        setActiveImageIndex(0);
        setIsFullscreen(false);
    };

    const handleCloseProfileModal = () => {
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
    };

    // "View Full Profile" — navigates to the standalone partner page.
    const handleOpenPartnerProfile = () => {
        if (!selectedProfile?.profileId) return;
        const userId = selectedProfile.profileId;
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
        navigate(partnerProfilePath, { state: { user_id: userId } });
    };

    // Carousel
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

    // Keyboard nav for the modal + lightbox
    useEffect(() => {
        if (!selectedProfile) return;
        const onKey = (e) => {
            if (isFullscreen) {
                if (e.key === 'Escape') setIsFullscreen(false);
                if (e.key === 'ArrowLeft') handlePrevImage();
                if (e.key === 'ArrowRight') handleNextImage();
                return;
            }
            if (e.key === 'Escape') handleCloseProfileModal();
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedProfile, activeImageIndex, isFullscreen]);

    /* ---------------------------------------------------------------- */
    /* Profile modal — action handlers                                  */
    /* These just call the existing swipe / super-like / message        */
    /* handlers, but act on the selectedProfile card.                   */
    /* ---------------------------------------------------------------- */
    const handleProfileModalLike = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile) return;
        setSelectedProfile(null);
        triggerSwipe('like');
    };

    const handleProfileModalDislike = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile) return;
        setSelectedProfile(null);
        triggerSwipe('dislike');
    };

    const handleProfileModalSuperLike = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile) return;
        if (isFreeUser) {
            setPremiumFeatureName('Super Like');
            setShowPremiumModal(true);
            return;
        }
        // Trigger the burst then swipe, same as the bottom bar button.
        setSuperLikeBurst({ cardId: selectedProfile.id });
        setSelectedProfile(null);
        setTimeout(() => triggerSwipe('super_like'), 80);
    };

    const handleProfileModalMessage = (e) => {
        if (e) e.stopPropagation();
        if (!selectedProfile) return;
        if (isFreeUser) {
            setPremiumFeatureName('Direct Messaging');
            setShowPremiumModal(true);
            return;
        }
        const chatPartner = {
            id: selectedProfile.profileId,
            name: selectedProfile.name,
            picture: selectedProfile.pictures?.[0]?.path || '',
            age: selectedProfile.age,
            city: selectedProfile.city,
        };
        setSelectedProfile(null);
        setActiveImageIndex(0);
        setIsFullscreen(false);
        navigate(chatPath, { state: { myself, partner: chatPartner } });
    };

    /* ---------------------------------------------------------------- */
    /* Drag handlers                                                    */
    /* ---------------------------------------------------------------- */
    const isTouchDevice = () =>
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const handleDragStart = (e) => {
        if (matchInfo) return;
        if (selectedProfile) return; // don't start a drag if the modal is open
        const activeCard = cards[cards.length - 1];
        if (activeCard?.type === 'end') return;
        if (
            e.target.closest('.swiper-button-next') ||
            e.target.closest('.swiper-button-prev') ||
            e.target.closest('.swiper-pagination') ||
            e.target.closest('.profile-click-area')
        ) {
            return;
        }

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragInfo.current = { startX: clientX, startY: clientY, isDragging: true };

        setCards((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                transition: 'transform 0s',
            };
            return updated;
        });
    };

    const handleDragMove = useCallback(
        (e) => {
            if (!dragInfo.current.isDragging) return;
            if (matchInfo) return;
            if (selectedProfile) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const offsetX = clientX - dragInfo.current.startX;
            const offsetY = clientY - dragInfo.current.startY;
            const rotate = offsetX * 0.1;

            setCards((prev) => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const activeIdx = updated.length - 1;
                const activeCard = updated[activeIdx];

                const limit = window.innerWidth * 0.15;
                if (Math.abs(offsetX) > limit) {
                    if (isProcessingDismiss.current) return prev;
                    isProcessingDismiss.current = true;
                    dragInfo.current.isDragging = false;

                    const direction = offsetX > 0 ? 'like' : 'dislike';
                    const multiplier = offsetX > 0 ? 1 : -1;

                    activeCard.isDismissing = true;
                    activeCard.transition = 'transform 1s ease-in-out';
                    activeCard.transform = `translate(${multiplier * window.innerWidth
                        }px, ${offsetY}px) rotate(${90 * multiplier}deg)`;

                    triggerButtonFeedback(direction);

                    setTimeout(() => {
                        setCards((p) => p.filter((c) => c.id !== activeCard.id));
                        isProcessingDismiss.current = false;
                    }, 1000);

                    handleSwipeDecision(direction, activeCard);
                } else {
                    activeCard.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
                }
                return updated;
            });
        },
        [matchInfo, selectedProfile]
    );

    const handleDragEnd = useCallback(() => {
        if (!dragInfo.current.isDragging) return;
        dragInfo.current.isDragging = false;
        setCards((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const activeIdx = updated.length - 1;
            updated[activeIdx] = {
                ...updated[activeIdx],
                transform: '',
                transition: 'transform 0.5s ease',
            };
            return updated;
        });
    }, []);

    const handleRefreshList = async () => {
        setCards([]);
        setProfiles([]);
        nextCardId.current = 0;
        await refetchEncounters();
    };

    const handleMatchDismiss = () => {
        setMatchInfo(null);
        appendNewCard();
    };

    const handleMatchOpenChat = () => {
        if (!matchInfo) return;
        const chatPartner = {
            id: matchInfo.recipientId,
            name: matchInfo.name,
            picture: matchInfo.picture,
            age: matchInfo.age,
            city: matchInfo.city,
        };
        const payload = { myself, partner: chatPartner };
        if (matchInfo.chatId) payload.chatId = matchInfo.chatId;
        setMatchInfo(null);
        navigate(chatPath, { state: payload });
    };

    const activeCards = cards.filter((c) => !c.isDismissing);
    const topCard = activeCards[activeCards.length - 1];

    const renderBullet = (index, className) =>
        '<span class="' + className + '">' + (index + 1) + '</span>';

    const hasPictures =
        Array.isArray(selectedProfile?.pictures) &&
        selectedProfile.pictures.length > 0;

    return (
        <MainLayout
            pageTitle={ENCOUNTERS_TITLE}
            pageDetails={ENCOUNTERS_TEXT}
            onOpenFilters={handleOpenFilters}
        >
            <HelmetHeader pageTitle={ENCOUNTERS_TITLE} />
            <style>{burstStyles}</style>

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none rounded-xl fade-in">
                {/* CARD AREA */}
                <div
                    id="swiper"
                    className="relative w-full flex-1 flex justify-center items-center overflow-hidden"
                >
                    {isFetchingEncounters && !topCard ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="loading loading-spinner loading-lg text-violet-400" />
                        </div>
                    ) : (
                        (() => {
                            const card = topCard;
                            if (!card) return null;

                            const interactiveProps =
                                card.type !== 'end'
                                    ? isTouchDevice()
                                        ? {
                                            onTouchStart: handleDragStart,
                                            onTouchMove: handleDragMove,
                                            onTouchEnd: handleDragEnd,
                                        }
                                        : {
                                            onMouseDown: handleDragStart,
                                            onMouseMove: handleDragMove,
                                            onMouseUp: handleDragEnd,
                                            onMouseLeave: handleDragEnd,
                                        }
                                    : {};

                            return (
                                <div
                                    key={card.id}
                                    className={`absolute rounded-[20px] overflow-hidden shadow-[2px_2px_20px_rgba(0,0,0,0.5)] card-token animate-[cardIn_0.25s_ease-out] ${card.isDismissing
                                        ? 'pointer-events-none'
                                        : ''
                                        } ${card.type === 'end'
                                            ? 'cursor-default'
                                            : 'cursor-grab active:cursor-grabbing'
                                        }`}
                                    style={{
                                        transform: card.transform || '',
                                        transition:
                                            card.transition ||
                                            'transform 0.5s ease',
                                        zIndex: 1,
                                    }}
                                    {...interactiveProps}
                                    onDragStart={(e) => e.preventDefault()}
                                >
                                    {/* AD CARD */}
                                    {card.type === 'ad' && (
                                        <div className="w-full h-full bg-slate-900 text-white flex flex-col justify-between p-6 relative">
                                            <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                <Megaphone size={12} /> Sponsored
                                            </div>
                                            <div className="mt-8 flex-1 flex flex-col justify-center items-center text-center">
                                                <img
                                                    src={card.image}
                                                    alt="Ad"
                                                    className="w-full h-48 object-cover rounded-xl mb-4 shadow-md"
                                                />
                                                <h3 className="text-xl font-bold text-yellow-400">
                                                    {card.title}
                                                </h3>
                                                <p className="text-sm text-gray-300 mt-2 px-2">
                                                    {card.description}
                                                </p>
                                            </div>
                                            <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110">
                                                Learn More
                                            </button>
                                        </div>
                                    )}

                                    {/* END CARD */}
                                    {card.type === 'end' && (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
                                            {card.variant === 'quota' ? (
                                                <>
                                                    <Clock
                                                        size={64}
                                                        className="text-amber-400 mb-4"
                                                    />
                                                    <h3 className="text-2xl font-bold mb-2">
                                                        You've reached today's
                                                        limit
                                                    </h3>
                                                    <p className="text-sm text-gray-300 max-w-xs mb-6">
                                                        You have seen all
                                                        potential matches for
                                                        today. Check back
                                                        tomorrow for more
                                                        matches!
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle
                                                        size={64}
                                                        className="text-emerald-400 mb-4 animate-bounce"
                                                    />
                                                    <h3 className="text-2xl font-bold mb-2">
                                                        No more profiles for now
                                                    </h3>
                                                    <p className="text-sm text-gray-300 max-w-xs mb-6">
                                                        Try widening your search
                                                        filters to see more
                                                        people.
                                                    </p>
                                                    <button
                                                        onClick={
                                                            handleOpenFilters
                                                        }
                                                        className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
                                                    >
                                                        <SlidersHorizontal
                                                            size={16}
                                                        />
                                                        Adjust Filters
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* PROFILE CARD */}
                                    {card.type === 'profile' && (
                                        <>
                                            <ReactSwiper
                                                pagination={{
                                                    clickable: true,
                                                    renderBullet,
                                                }}
                                                navigation
                                                modules={[
                                                    Pagination,
                                                    Navigation,
                                                ]}
                                                allowTouchMove={false}
                                                className="w-full h-full"
                                            >
                                                {card.pictures.map(
                                                    (picture, idx) => (
                                                        <SwiperSlide key={idx}>
                                                            <img
                                                                src={renderImageUrl(picture.path)}
                                                                alt={`${card.name ||
                                                                    'Profile'
                                                                    } picture ${idx + 1
                                                                    }`}
                                                                className="w-full h-full object-cover pointer-events-none"
                                                            />
                                                        </SwiperSlide>
                                                    )
                                                )}
                                            </ReactSwiper>

                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenProfile(card);
                                                }}
                                                className="profile-click-area absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/70 to-transparent text-white cursor-pointer hover:via-black/80 transition-all flex justify-between items-end pointer-events-auto"
                                            >
                                                <div>
                                                    <h3 className="text-lg font-bold leading-tight flex items-center gap-1.5">
                                                        {card.name}
                                                        {card.age
                                                            ? `, ${card.age}`
                                                            : ''}
                                                    </h3>
                                                    {card.distanceFrom !==
                                                        undefined && (
                                                            <p className="text-xs text-gray-200 mt-1">
                                                                📍{' '}
                                                                <span className="font-bold">
                                                                    {
                                                                        card.distanceFrom
                                                                    }
                                                                </span>{' '}
                                                                KM Away, (
                                                                <span className="font-bold">
                                                                    {card.city}
                                                                </span>
                                                                )
                                                            </p>
                                                        )}
                                                </div>

                                                <div className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full border border-white/30 text-white transition-all">
                                                    <User size={18} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>

                {/* CONTROL BUTTONS */}
                {topCard?.type !== 'end' && !matchInfo && (
                    <article className="w-full py-4 flex justify-center items-center gap-3 flex-shrink-0">
                        {partner.id && partner.name && (
                            <div
                                id="star"
                                onClick={handleSuperLikeClick}
                                className={`icon-button star-color ${likeTrigger ? 'trigger-alt' : 'trigger'
                                    }`}
                            >
                                <Star size={20} />
                            </div>
                        )}
                        <div
                            id="dislike"
                            onClick={() => handleButtonClick('dislike')}
                            className={`icon-button dislike-color ${dislikeTrigger ? 'trigger-alt' : 'trigger'
                                }`}
                        >
                            <X size={30} />
                        </div>
                        <div
                            id="like"
                            onClick={() => handleButtonClick('like')}
                            className={`icon-button like-color ${likeTrigger ? 'trigger-alt' : 'trigger'
                                }`}
                        >
                            <Heart size={30} />
                        </div>
                        {partner.id && partner.name && (
                            <div
                                id="message"
                                onClick={handleMessageClick}
                                className={`icon-button message-color ${likeTrigger ? 'trigger-alt' : 'trigger'
                                    }`}
                            >
                                <SendHorizontal size={20} />
                            </div>
                        )}
                    </article>
                )}

                {/* Quota hint */}
                {isFreeUser && quota && !quotaExhausted && !matchInfo && (
                    <div className="text-xs text-gray-400 text-center pb-2 flex-shrink-0">
                        {quota.remaining} of {quota.limit} encounters left today
                    </div>
                )}

                {/* SUPER LIKE BURST */}
                {superLikeBurst && (
                    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
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
                                    <Star
                                        size={16}
                                        fill="currentColor"
                                        strokeWidth={0}
                                    />
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* MATCH OVERLAY */}
                {matchInfo && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in">
                        <div className="w-[88%] max-w-sm rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-700 p-6 text-white shadow-2xl text-center">
                            <div className="flex justify-center mb-3">
                                <Sparkles
                                    size={42}
                                    className="text-yellow-300"
                                />
                            </div>
                            <h2 className="text-2xl font-extrabold mb-1">
                                It's a Match!
                            </h2>
                            <p className="text-sm text-white/80 mb-5">
                                You and{' '}
                                <span className="font-semibold">
                                    {matchInfo.name}
                                </span>{' '}
                                liked each other.
                            </p>

                            {matchInfo.picture && (
                                <img
                                    src={renderImageUrl(matchInfo.picture)}
                                    alt={matchInfo.name}
                                    className="w-28 h-28 rounded-full object-cover mx-auto mb-5 ring-4 ring-white/30"
                                />
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleMatchOpenChat}
                                    className="w-full py-3 rounded-xl bg-white text-rose-700 font-bold hover:brightness-95 transition"
                                >
                                    Send a Message
                                </button>
                                <button
                                    onClick={handleMatchDismiss}
                                    className="w-full py-3 rounded-xl bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition"
                                >
                                    Keep Swiping
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- PROFILE DETAIL MODAL ---------------- */}
                {selectedProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                        <div className="relative w-full max-w-md bg-slate-50 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
                            <button
                                onClick={handleCloseProfileModal}
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
                                        {selectedProfile.distanceFrom !==
                                            undefined && (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-full">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {selectedProfile.distanceFrom} km away
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

                                    {/* Details grid */}
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
                                    <button
                                        onClick={handleOpenPartnerProfile}
                                        className="w-full py-3 rounded-2xl bg-violet-500/10 text-violet-700 border border-violet-200 hover:bg-violet-500/20 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                                    >
                                        <User size={16} />
                                        View Full Profile
                                    </button>
                                </div>
                            </div>

                            {/* Sticky action bar */}
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-2">
                                <button
                                    onClick={handleProfileModalDislike}
                                    className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200 font-semibold flex items-center justify-center"
                                    aria-label="Pass"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={handleProfileModalMessage}
                                    className="flex-1 py-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 font-semibold flex items-center justify-center"
                                    aria-label="Message"
                                >
                                    <SendHorizontal size={20} />
                                </button>
                                <button
                                    onClick={handleProfileModalSuperLike}
                                    className="flex-1 py-3 rounded-2xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors border border-amber-200 font-semibold flex items-center justify-center"
                                    aria-label="Super Like"
                                >
                                    <Star size={20} fill="currentColor" />
                                </button>
                                <button
                                    onClick={handleProfileModalLike}
                                    className="flex-[1.6] py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Heart size={18} fill="currentColor" />
                                    Like
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FULLSCREEN LIGHTBOX */}
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
                                src={renderImageUrl(
                                    selectedProfile.pictures[activeImageIndex]?.path
                                )}
                                alt={`${selectedProfile.name} full view`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                draggable={false}
                            />
                        </div>
                    </div>
                )}

                {/* PREMIUM FEATURE MODAL */}
                {showPremiumModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 fade-in">
                        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl text-center relative overflow-hidden">
                            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                                <Crown size={32} className="text-slate-950" />
                            </div>

                            <h3 className="text-xl font-bold mb-2">
                                Unlock Premium
                            </h3>

                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                <span className="font-semibold text-amber-400">
                                    {premiumFeatureName}
                                </span>{' '}
                                is a premium feature. Upgrade your plan to send
                                direct messages, super likes, and enjoy
                                unlimited encounters!
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setShowPremiumModal(false);
                                        navigate(premiumPath);
                                    }}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold hover:brightness-105 transition shadow-md"
                                >
                                    Upgrade to Premium
                                </button>
                                <button
                                    onClick={() => setShowPremiumModal(false)}
                                    className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FILTER MODAL */}
                {showFilterModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 fade-in">
                        <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 pt-5 pb-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal
                                        size={18}
                                        className="text-violet-400"
                                    />
                                    <h3 className="text-lg font-bold">
                                        Filters
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                                    aria-label="Close filters"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold">
                                            Max Distance
                                        </label>
                                        <span className="text-sm font-bold text-violet-400">
                                            {filterDraft.max_distance_km} km
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={isFreeUser ? 200 : 500}
                                        step={1}
                                        value={filterDraft.max_distance_km}
                                        onChange={(e) =>
                                            handleFilterChange({
                                                max_distance_km: Number(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-full range range-xs range-primary"
                                    />
                                    {isFreeUser ? (
                                        <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                                            <Crown size={11} />
                                            Upgrade to Premium to search up to
                                            500 km.
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-500 mt-2">
                                            Premium: up to 500 km.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold mb-2 block">
                                        Show me
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: GENDER.MEN, label: 'Men' },
                                            {
                                                key: GENDER.WOMEN,
                                                label: 'Women',
                                            },
                                            {
                                                key: GENDER.EVERYONE,
                                                label: 'Everyone',
                                            },
                                        ].map((opt) => {
                                            const active =
                                                filterDraft.interested_in ===
                                                opt.key;
                                            return (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() =>
                                                        handleFilterChange({
                                                            interested_in:
                                                                opt.key,
                                                        })
                                                    }
                                                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${active
                                                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-md'
                                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold">
                                            Age Range
                                        </label>
                                        <span className="text-sm font-bold text-violet-400">
                                            {filterDraft.min_age} –{' '}
                                            {filterDraft.max_age}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                                <span>Min</span>
                                                <span>
                                                    {filterDraft.min_age}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={18}
                                                max={100}
                                                value={filterDraft.min_age}
                                                onChange={(e) => {
                                                    const v = Number(
                                                        e.target.value
                                                    );
                                                    handleFilterChange({
                                                        min_age: Math.min(
                                                            v,
                                                            filterDraft.max_age
                                                        ),
                                                    });
                                                }}
                                                className="w-full range range-xs range-primary"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                                <span>Max</span>
                                                <span>
                                                    {filterDraft.max_age}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={18}
                                                max={100}
                                                value={filterDraft.max_age}
                                                onChange={(e) => {
                                                    const v = Number(
                                                        e.target.value
                                                    );
                                                    handleFilterChange({
                                                        max_age: Math.max(
                                                            v,
                                                            filterDraft.min_age
                                                        ),
                                                    });
                                                }}
                                                className="w-full range range-xs range-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <ToggleRow
                                        label="Online users only"
                                        description="Only show people who are online right now."
                                        checked={filterDraft.online_only}
                                        locked={isFreeUser}
                                        onToggle={() =>
                                            !isFreeUser &&
                                            handleFilterChange({
                                                online_only:
                                                    !filterDraft.online_only,
                                            })
                                        }
                                    />
                                    <ToggleRow
                                        label="Premium users only"
                                        description="Only show users with an active premium plan."
                                        checked={filterDraft.premium_only}
                                        locked={isFreeUser}
                                        onToggle={() =>
                                            !isFreeUser &&
                                            handleFilterChange({
                                                premium_only:
                                                    !filterDraft.premium_only,
                                            })
                                        }
                                    />
                                    {isFreeUser && (
                                        <p className="text-[11px] text-amber-400 flex items-center gap-1">
                                            <Crown size={11} />
                                            Online-only and Premium-only filters
                                            require Premium.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-800 flex gap-3 flex-shrink-0">
                                <button
                                    onClick={() => setShowFilterModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold hover:brightness-110 transition shadow-md"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

/* ------------------------------------------------------------------ */
/* Toggle row used in the filter modal                                 */
/* ------------------------------------------------------------------ */
function ToggleRow({ label, description, checked, locked, onToggle }) {
    return (
        <div
            className={`flex items-start justify-between gap-4 p-3 rounded-xl border ${locked
                ? 'bg-slate-900/50 border-slate-800 opacity-70'
                : 'bg-slate-800/60 border-slate-700'
                }`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{label}</span>
                    {locked && <Lock size={12} className="text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                    {description}
                </p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                disabled={locked}
                className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-violet-600' : 'bg-slate-700'
                    } ${locked ? 'cursor-not-allowed' : ''}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}