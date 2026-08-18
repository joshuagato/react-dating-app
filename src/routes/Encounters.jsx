import { useState, useRef, useCallback, useEffect } from 'react';
import { Swiper as ReactSwiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { Heart, Asterisk, Radar, Star, Megaphone, CheckCircle } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './Encounters.css';

import { POTENTIAL_MATCH_PROFILE, ENCOUNTERS_TITLE, ENCOUNTERS_TEXT, baseURL, ENCOUNTER_ACTION } from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import { getPotentialMatchProfilesHandler, getEncountersProfilesHandler } from '../tanstack/user';
import { likeUserHandler, dislikeUserHandler } from '../tanstack/encounter';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Encounters({ isFreeUser = true }) { // Added isFreeUser prop (defaults to true)
    const [profiles, setProfiles] = useState([]);
    const [cards, setCards] = useState([]);

    const [likeTrigger, setLikeTrigger] = useState(false);
    const [dislikeTrigger, setDislikeTrigger] = useState(false);

    const nextCardId = useRef(0);
    const dragInfo = useRef({ startX: 0, startY: 0, isDragging: false });
    const isProcessingDismiss = useRef(false);

    // Helper to construct card data (Handles Profiles, Ads, and End Cards)
    const createCardData = useCallback((item, id) => {
        if (item.type === 'ad') {
            return {
                id,
                type: 'ad',
                title: item.title || 'Sponsored Advertisement',
                description: item.description || 'Upgrade to Premium for an ad-free experience and unlimited likes!',
                image: item.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80',
                isDismissing: false,
                transform: '',
                transition: ''
            };
        }

        if (item.type === 'end') {
            return {
                id,
                type: 'end',
                title: "You're All Caught Up!",
                description: "You have seen all potential matches for today. Check back tomorrow for more matches!",
                isDismissing: false,
                transform: '',
                transition: ''
            };
        }

        const fallbackImg = 'https://via.placeholder.com/400x600?text=No+Image';
        const pictures = item?.pictures?.length > 0 ? item.pictures : [fallbackImg];

        return {
            id,
            type: 'profile',
            profileId: item.id,
            name: item.name,
            age: item.age,
            city: item.city,
            distanceFrom: item.distance_from,
            pictures,
            isDismissing: false,
            transform: '',
            transition: ''
        };
    }, []);

    // Helper function to interleave Ads and attach End Card
    const buildCardSequence = useCallback((userProfiles, freeTier) => {
        const sequence = [];

        userProfiles.forEach((profile, index) => {
            sequence.push({ ...profile, type: 'profile' });

            // Insert Ad after every 4th profile (only for free users)
            if (freeTier && (index + 1) % 4 === 0) {
                sequence.push({
                    type: 'ad',
                    id: `ad-${index}`,
                    title: 'Special Promotion',
                    description: 'Get 50% off Premium Membership today!'
                });
            }
        });

        // Add the end-of-cards item at the very bottom of the sequence
        sequence.push({ type: 'end' });

        return sequence;
    }, []);

    // Append the next item in the queue
    const appendNewCard = useCallback((currentProfilesList) => {
        const activeProfiles = currentProfilesList || profiles;
        if (activeProfiles.length === 0) return;

        setCards(prev => {
            const nextIndex = nextCardId.current;
            if (nextIndex >= activeProfiles.length) return prev;

            const newCard = createCardData(activeProfiles[nextIndex], nextIndex);
            nextCardId.current += 1;
            return [...prev, newCard];
        });
    }, [profiles, createCardData]);

    // Fetch potential matches on mount
    useEffect(() => {
        (async () => {
            try {
                const query = `max_distance=211`;
                const response = await getEncountersProfilesHandler(query);
                const fetchedProfiles = response?.users || [];

                if (fetchedProfiles.length > 0) {
                    // 1. Interleave Ads & Append End Card
                    const sequencedItems = buildCardSequence(fetchedProfiles, isFreeUser);

                    // 2. Reverse list so Index 0 renders on top of LIFO stack
                    const orderedProfiles = [...sequencedItems].reverse();
                    setProfiles(orderedProfiles);

                    const initialCount = Math.min(12, orderedProfiles.length);
                    const initialCards = [];

                    for (let i = 0; i < initialCount; i++) {
                        initialCards.push(createCardData(orderedProfiles[i], i));
                    }

                    nextCardId.current = initialCount;
                    setCards(initialCards);
                }
            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, [createCardData, buildCardSequence, isFreeUser]);

    const triggerButtonFeedback = (direction) => {
        if (direction === 'like') {
            setLikeTrigger(prev => !prev);
        } else {
            setDislikeTrigger(prev => !prev);
        }
    };

    const handleSwipeDecision = (direction, card) => {
        // Only trigger backend like/dislike API for real profile cards
        if (card.type === 'profile') {
            const data = { recipient_id: card.profileId };

            if (direction === 'like') {
                data.action = ENCOUNTER_ACTION.LIKE;
                likeUserHandler(data);
            } else if (direction === 'dislike') {
                data.action = ENCOUNTER_ACTION.DISLIKE;
                dislikeUserHandler(data);
            }
        }
    };

    const handleButtonClick = (direction) => {
        if (isProcessingDismiss.current) return;
        isProcessingDismiss.current = true;

        setCards(prev => {
            if (prev.length === 0) {
                isProcessingDismiss.current = false;
                return prev;
            }
            const updated = [...prev];
            const activeIdx = updated.length - 1;
            const activeCard = updated[activeIdx];

            // Prevent dismissing the End Card
            if (activeCard.isDismissing || activeCard.type === 'end') {
                isProcessingDismiss.current = false;
                return prev;
            }

            const multiplier = direction === 'like' ? 1 : -1;

            activeCard.isDismissing = true;
            activeCard.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            activeCard.transform = `translate(${multiplier * window.innerWidth}px, -40px) rotate(${45 * multiplier}deg)`;

            triggerButtonFeedback(direction);
            handleSwipeDecision(direction, activeCard);

            setTimeout(() => {
                setCards(p => p.filter(c => c.id !== activeCard.id));
                isProcessingDismiss.current = false;
            }, 800);

            appendNewCard();
            return updated;
        });
    };

    const isTouchDevice = () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    const handleDragStart = (e) => {
        const activeCard = cards[cards.length - 1];
        // Prevent dragging/swiping the End Card
        if (activeCard?.type === 'end') return;

        if (
            e.target.closest('.swiper-button-next') ||
            e.target.closest('.swiper-button-prev') ||
            e.target.closest('.swiper-pagination')
        ) {
            return;
        }

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragInfo.current = { startX: clientX, startY: clientY, isDragging: true };

        setCards(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                transition: 'transform 0s'
            };
            return updated;
        });
    };

    const handleDragMove = useCallback((e) => {
        if (!dragInfo.current.isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const offsetX = clientX - dragInfo.current.startX;
        const offsetY = clientY - dragInfo.current.startY;
        const rotate = offsetX * 0.1;

        setCards(prev => {
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
                activeCard.transform = `translate(${multiplier * window.innerWidth}px, ${offsetY}px) rotate(${90 * multiplier}deg)`;

                triggerButtonFeedback(direction);
                handleSwipeDecision(direction, activeCard);

                setTimeout(() => {
                    setCards(p => p.filter(c => c.id !== activeCard.id));
                    isProcessingDismiss.current = false;
                }, 1000);

                appendNewCard();
            } else {
                activeCard.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
            }

            return updated;
        });
    }, [appendNewCard]);

    const handleDragEnd = useCallback(() => {
        if (!dragInfo.current.isDragging) return;
        dragInfo.current.isDragging = false;

        setCards(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const activeIdx = updated.length - 1;
            updated[activeIdx] = {
                ...updated[activeIdx],
                transform: '',
                transition: 'transform 0.5s ease'
            };
            return updated;
        });
    }, []);

    const activeCards = cards.filter(c => !c.isDismissing);
    const topCard = activeCards[activeCards.length - 1];

    const renderBullet = (index, className) => '<span class="' + className + '">' + (index + 1) + '</span>';

    return (
        <MainLayout pageTitle={ENCOUNTERS_TITLE} pageDetails={ENCOUNTERS_TEXT}>
            <HelmetHeader pageTitle={ENCOUNTERS_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none rounded-xl fade-in">
                <div id="swiper" className="relative pt-[5vh] w-full h-[64vh] flex justify-center items-center perspective">
                    {cards.map((card) => {
                        const stackIndex = activeCards.indexOf(card);
                        const visualIndex = card.isDismissing ? 0 : Math.max(0, activeCards.length - 1 - stackIndex);

                        const stackStyle = !card.isDismissing
                            ? {
                                transform: `translateZ(calc(-30px * ${visualIndex})) translateY(calc(-20px * ${visualIndex})) rotate(calc(-4deg * ${visualIndex}))`,
                            }
                            : {};

                        const isTopCard = stackIndex === activeCards.length - 1;
                        const interactiveProps = isTopCard && card.type !== 'end'
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
                                className={`absolute rounded-[20px] overflow-hidden shadow-[2px_2px_20px_rgba(0,0,0,0.5)] card-token
                                    transition-all ${card.isDismissing ? 'pointer-events-none' : ''} ${card.type === 'end' ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                                style={{
                                    ...stackStyle,
                                    transform: card.transform || stackStyle.transform,
                                    transition: card.transition || 'transform 0.5s ease',
                                    zIndex: stackIndex,
                                }}
                                {...interactiveProps}
                                onDragStart={(e) => e.preventDefault()}
                            >
                                {/* 1. ADVERTISEMENT CARD */}
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
                                            <h3 className="text-xl font-bold text-yellow-400">{card.title}</h3>
                                            <p className="text-sm text-gray-300 mt-2 px-2">{card.description}</p>
                                        </div>
                                        <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl shadow-lg hover:brightness-110">
                                            Learn More
                                        </button>
                                    </div>
                                )}

                                {/* 2. END OF CARDS CARD */}
                                {card.type === 'end' && (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
                                        <CheckCircle size={64} className="text-emerald-400 mb-4 animate-bounce" />
                                        <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                                        <p className="text-sm text-gray-300 max-w-xs mb-6">{card.description}</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold hover:bg-white/20 transition-all"
                                        >
                                            Refresh List
                                        </button>
                                    </div>
                                )}

                                {/* 3. STANDARD USER PROFILE CARD */}
                                {card.type === 'profile' && (
                                    <>
                                        <ReactSwiper
                                            key={`swiper-${card.id}-${isTopCard ? 'top' : 'stacked'}`}
                                            pagination={{ clickable: true, renderBullet }}
                                            navigation={isTopCard}
                                            modules={[Pagination, Navigation]}
                                            allowTouchMove={false}
                                            className="w-full h-full"
                                        >
                                            {card.pictures.map((picture, idx) => (
                                                <SwiperSlide key={idx}>
                                                    <img
                                                        src={buildPictureUrl(baseURL, picture.path)}
                                                        alt={`${card.name || 'Profile'} picture ${idx + 1}`}
                                                        className="w-full h-full object-cover pointer-events-none"
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </ReactSwiper>

                                        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/70 to-transparent text-white pointer-events-none">
                                            <h3 className="text-lg font-bold leading-tight">
                                                {card.name}{card.age ? `, ${card.age}` : ''}
                                            </h3>
                                            {card.distanceFrom !== undefined && (
                                                <p className="text-xs text-gray-200 mt-1">
                                                    📍 <span className='font-bold'>{card.distanceFrom}</span> KM Away, (<span className='font-bold'>{card.city}</span>)
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Hide control buttons when the top card is the End Card */}
                {topCard?.type !== 'end' && (
                    <article className='w-full h-[12vh] flex justify-center items-center gap-3 bottom-buttons'>
                        <div
                            id="star"
                            onClick={() => handleButtonClick('dislike')}
                            className={`icon-button star-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'}`}
                        >
                            <Star size={17} />
                        </div>
                        <div
                            id="dislike"
                            onClick={() => handleButtonClick('dislike')}
                            className={`icon-button dislike-color cursor-pointer ${dislikeTrigger ? 'trigger-alt' : 'trigger'}`}
                        >
                            <Asterisk size={30} />
                        </div>
                        <div
                            id="like"
                            onClick={() => handleButtonClick('like')}
                            className={`icon-button like-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'}`}
                        >
                            <Heart size={30} />
                        </div>
                        <div
                            id="message"
                            onClick={() => handleButtonClick('like')}
                            className={`icon-button message-color cursor-pointer ${likeTrigger ? 'trigger-alt' : 'trigger'}`}
                        >
                            <Radar size={17} />
                        </div>
                    </article>
                )}
            </div>
        </MainLayout>
    );
}