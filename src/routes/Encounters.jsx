import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Swiper as ReactSwiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Heart, X, SendHorizontal, Star, Megaphone, CheckCircle, Clock, Sparkles, User, Crown,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './Encounters.css';

import {
    ENCOUNTERS_TITLE, ENCOUNTERS_TEXT, baseURL, ENCOUNTER_ACTION, chatPath,
    partnerProfilePath, premiumPath,
    AD_EVERY_N_CARDS as FALLBACK_AD_EVERY_N,
} from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import { getEncountersProfilesHandler } from '../tanstack/encounter';
import { likeUserHandler, dislikeUserHandler } from '../tanstack/encounter';
import { getPremiumStatusHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

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

    // Premium status — null while loading, true/false once resolved.
    const [isPremium, setIsPremium] = useState(null);

    // Premium Feature Modal State
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [premiumFeatureName, setPremiumFeatureName] = useState('');

    // Match overlay state. When non-null, the overlay is shown and the
    // card stack is paused.
    const [matchInfo, setMatchInfo] = useState(null);

    // Super-like burst overlay. Non-null while the burst is playing.
    // Shape: { cardId }
    const [superLikeBurst, setSuperLikeBurst] = useState(null);

    const [likeTrigger, setLikeTrigger] = useState(false);
    const [dislikeTrigger, setDislikeTrigger] = useState(false);

    const nextCardId = useRef(0);
    const dragInfo = useRef({ startX: 0, startY: 0, isDragging: false });
    const isProcessingDismiss = useRef(false);

    /* ---------------------------------------------------------------- */
    /* Premium status query                                             */
    /* ---------------------------------------------------------------- */
    const { data: premiumStatusData } = useQuery({
        queryKey: ['premium-status'],
        queryFn: getPremiumStatusHandler,
    });

    useEffect(() => {
        if (!premiumStatusData) return;
        setIsPremium(Boolean(premiumStatusData.is_premium));
    }, [premiumStatusData]);

    // Derived convenience flag. `null` while the query is loading.
    const isFreeUser = isPremium === null ? null : !isPremium;

    // Navigate directly to partner profile with user_id state
    const handleOpenPartnerProfile = (e, userId) => {
        e.stopPropagation();
        if (!userId) return;
        navigate(partnerProfilePath, { state: { user_id: userId } });
    };

    /* ---------------------------------------------------------------- */
    /* Card factory                                                     */
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
                title:
                    item.title ||
                    (item.variant === 'quota'
                        ? "You've reached today's limit"
                        : "You're All Caught Up!"),
                description:
                    item.description ||
                    (item.variant === 'quota'
                        ? 'Come back later for more encounters.'
                        : 'You have seen all potential matches for today. Check back tomorrow for more matches!'),
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
            is_online: item.is_online,
            last_seen: item.last_seen,
            distanceFrom: item.distance_from,
            pictures,
            isDismissing: false,
            transform: '',
            transition: '',
        };
    }, []);

    /* ---------------------------------------------------------------- */
    /* Sequence builder                                                 */
    /* ---------------------------------------------------------------- */
    const buildCardSequence = useCallback(
        (userProfiles, freeTier, adEveryN, quotaVariant, resetsAt) => {
            const sequence = [];
            userProfiles.forEach((profile, index) => {
                sequence.push({ ...profile, type: 'profile' });
                if (
                    freeTier &&
                    adEveryN > 0 &&
                    (index + 1) % adEveryN === 0
                ) {
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

    /* ---------------------------------------------------------------- */
    /* Fetch                                                            */
    /* ---------------------------------------------------------------- */
    const { data: encounterData, refetch: refetchEncounters } = useQuery({
        queryKey: ['encounters'],
        queryFn: () => getEncountersProfilesHandler('max_distance=211'),
    });

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
    }, [encounterData, seedCards, isFreeUser]);

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
    /* Swipe decision — handles like / dislike / super_like             */
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
    /* Swipe animation for a card                                       */
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

                // Clear the burst once the card is gone
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

    // Public entry point for the bottom action buttons (dislike, like)
    const handleButtonClick = (direction) => triggerSwipe(direction);

    /* ---------------------------------------------------------------- */
    /* Super like button — burst, then swipe                            */
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

        // Show the burst first, then kick off the swipe on the next tick
        // so the overlay gets a paint before the card starts flying off.
        setSuperLikeBurst({ cardId: activeCard.id });
        setTimeout(() => triggerSwipe('super_like'), 80);
    };

    // Safety net — clears the burst if something interrupts the flow
    useEffect(() => {
        if (!superLikeBurst) return;
        const t = setTimeout(() => setSuperLikeBurst(null), 900);
        return () => clearTimeout(t);
    }, [superLikeBurst]);

    /* ---------------------------------------------------------------- */
    /* Keep `partner` in sync with the top card                         */
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

    // Handle clicks on the message button in the bottom bar
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
    /* Drag handlers                                                    */
    /* ---------------------------------------------------------------- */
    const isTouchDevice = () =>
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const handleDragStart = (e) => {
        if (matchInfo) return;
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
        [appendNewCard, matchInfo]
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
        queryClient.invalidateQueries({ queryKey: ['encounters'] });
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

    const formatResetTime = (iso) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleString();
    };

    return (
        <MainLayout pageTitle={ENCOUNTERS_TITLE} pageDetails={ENCOUNTERS_TEXT}>
            <HelmetHeader pageTitle={ENCOUNTERS_TITLE} />
            <style>{burstStyles}</style>

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none rounded-xl fade-in">
                <div
                    id="swiper"
                    className="relative pt-[5vh] w-full h-[64vh] flex justify-center items-center perspective"
                >
                    {cards.map((card) => {
                        const stackIndex = activeCards.indexOf(card);
                        const visualIndex = card.isDismissing
                            ? 0
                            : Math.max(0, activeCards.length - 1 - stackIndex);

                        const stackStyle = !card.isDismissing
                            ? {
                                transform: `translateZ(calc(-30px * ${visualIndex})) translateY(calc(-20px * ${visualIndex})) rotate(calc(-4deg * ${visualIndex}))`,
                            }
                            : {};

                        const isTopCard =
                            stackIndex === activeCards.length - 1;

                        const interactiveProps =
                            isTopCard && card.type !== 'end'
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
                                className={`absolute rounded-[20px] overflow-hidden shadow-[2px_2px_20px_rgba(0,0,0,0.5)] card-token transition-all ${card.isDismissing ? 'pointer-events-none' : ''
                                    } ${card.type === 'end'
                                        ? 'cursor-default'
                                        : 'cursor-grab active:cursor-grabbing'
                                    }`}
                                style={{
                                    ...stackStyle,
                                    transform:
                                        card.transform || stackStyle.transform,
                                    transition:
                                        card.transition || 'transform 0.5s ease',
                                    zIndex: stackIndex,
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
                                            <Clock
                                                size={64}
                                                className="text-amber-400 mb-4"
                                            />
                                        ) : (
                                            <CheckCircle
                                                size={64}
                                                className="text-emerald-400 mb-4 animate-bounce"
                                            />
                                        )}
                                        <h3 className="text-2xl font-bold mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-gray-300 max-w-xs mb-6">
                                            {card.description}
                                        </p>
                                        {card.variant === 'quota' &&
                                            card.resetsAt && (
                                                <p className="text-xs text-amber-200 mb-4">
                                                    Resets at{' '}
                                                    {formatResetTime(card.resetsAt)}
                                                </p>
                                            )}
                                        {card.variant !== 'quota' && (
                                            <button
                                                onClick={handleRefreshList}
                                                className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold hover:bg-white/20 transition-all"
                                            >
                                                Refresh List
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* PROFILE CARD */}
                                {card.type === 'profile' && (
                                    <>
                                        <ReactSwiper
                                            key={`swiper-${card.id}-${isTopCard ? 'top' : 'stacked'
                                                }`}
                                            pagination={{
                                                clickable: true,
                                                renderBullet,
                                            }}
                                            navigation={isTopCard}
                                            modules={[Pagination, Navigation]}
                                            allowTouchMove={false}
                                            className="w-full h-full"
                                        >
                                            {card.pictures.map((picture, idx) => (
                                                <SwiperSlide key={idx}>
                                                    <img
                                                        src={buildPictureUrl(
                                                            baseURL,
                                                            picture.path
                                                        )}
                                                        alt={`${card.name || 'Profile'
                                                            } picture ${idx + 1}`}
                                                        className="w-full h-full object-cover pointer-events-none"
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </ReactSwiper>

                                        <div
                                            onClick={(e) =>
                                                handleOpenPartnerProfile(
                                                    e,
                                                    card.profileId
                                                )
                                            }
                                            className="profile-click-area absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/70 to-transparent text-white cursor-pointer hover:via-black/80 transition-all flex justify-between items-end pointer-events-auto"
                                        >
                                            <div>
                                                <h3 className="text-lg font-bold leading-tight flex items-center gap-1.5">
                                                    {card.name}
                                                    {card.age ? `, ${card.age}` : ''}
                                                </h3>
                                                {card.distanceFrom !== undefined && (
                                                    <p className="text-xs text-gray-200 mt-1">
                                                        📍{' '}
                                                        <span className="font-bold">
                                                            {card.distanceFrom}
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
                    })}
                </div>

                {/* Control buttons */}
                {topCard?.type !== 'end' && !matchInfo && (
                    <article className="w-full h-[12vh] flex justify-center items-center gap-3 bottom-buttons">
                        {partner.id && partner.name && (
                            <div
                                id="star"
                                onClick={handleSuperLikeClick}
                                className={`icon-button star-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'
                                    }`}
                            >
                                <Star size={17} />
                            </div>
                        )}
                        <div
                            id="dislike"
                            onClick={() => handleButtonClick('dislike')}
                            className={`icon-button dislike-color cursor-pointer ${dislikeTrigger ? 'trigger-alt' : 'trigger'
                                }`}
                        >
                            <X size={30} />
                        </div>
                        <div
                            id="like"
                            onClick={() => handleButtonClick('like')}
                            className={`icon-button like-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'
                                }`}
                        >
                            <Heart size={30} />
                        </div>
                        {partner.id && partner.name && (
                            <div
                                id="message"
                                onClick={handleMessageClick}
                                className={`icon-button message-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'
                                    }`}
                            >
                                <SendHorizontal size={17} />
                            </div>
                        )}
                    </article>
                )}

                {/* Quota hint — only shown to free users */}
                {isFreeUser && quota && !quotaExhausted && !matchInfo && (
                    <div className="text-xs text-gray-400 text-center pb-1">
                        {quota.remaining} of {quota.limit} encounters left today
                    </div>
                )}

                {/* ---------------- SUPER LIKE BURST ---------------- */}
                {superLikeBurst && (
                    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                        {/* Radiating rings */}
                        <span className="absolute rounded-full border-4 border-amber-400/70 animate-[superRing_0.9s_ease-out_forwards]" />
                        <span className="absolute rounded-full border-4 border-yellow-300/60 animate-[superRing_0.9s_ease-out_0.1s_forwards]" />
                        <span className="absolute rounded-full border-4 border-pink-400/50 animate-[superRing_0.9s_ease-out_0.2s_forwards]" />

                        {/* Central star burst */}
                        <span className="absolute text-amber-300 animate-[superStar_0.9s_ease-out_forwards]">
                            <Star size={96} fill="currentColor" strokeWidth={0} />
                        </span>

                        {/* Flying sparks */}
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

                {/* ---------------- MATCH OVERLAY ---------------- */}
                {matchInfo && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in">
                        <div className="w-[88%] max-w-sm rounded-3xl bg-gradient-to-br from-pink-600 via-rose-600 to-fuchsia-700 p-6 text-white shadow-2xl text-center">
                            <div className="flex justify-center mb-3">
                                <Sparkles size={42} className="text-yellow-300" />
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
                                    src={buildPictureUrl(
                                        baseURL,
                                        matchInfo.picture
                                    )}
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

                {/* ---------------- PREMIUM FEATURE MODAL ---------------- */}
                {showPremiumModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 fade-in">
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
                                direct messages, super likes, and enjoy unlimited
                                encounters!
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
            </div>
        </MainLayout>
    );
}