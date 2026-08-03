import { useState, useRef, useCallback, useEffect } from 'react';
import { Swiper as ReactSwiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { Heart, Asterisk, Radar, Star } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import './Encounters.css';

import { POTENTIAL_MATCH_PROFILE, ENCOUNTERS_TITLE, ENCOUNTERS_TEXT } from '../functions/constants';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Encounters() {
    const [profiles, setProfiles] = useState([]);
    const [cards, setCards] = useState([]);

    const [likeTrigger, setLikeTrigger] = useState(false);
    const [dislikeTrigger, setDislikeTrigger] = useState(false);

    const nextCardId = useRef(0);
    const dragInfo = useRef({ startX: 0, startY: 0, isDragging: false });

    // Helper to construct card data
    const createCardData = useCallback((profile, id) => {
        const fallbackImg = 'https://via.placeholder.com/400x600?text=No+Image';
        const pictures = profile?.pictures?.length > 0 ? profile.pictures : [fallbackImg];

        return {
            id,
            profileId: profile._id || profile.id,
            name: profile.name,
            age: profile.age,
            distanceFrom: profile.distanceFrom,
            pictures,
            isDismissing: false,
            transform: '',
            transition: ''
        };
    }, []);

    // Append the next profile in the queue
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
                const response = await getPotentialMatchProfilesHandler();
                const fetchedProfiles = response?.userProfiles || [];

                if (fetchedProfiles.length > 0) {
                    setProfiles(fetchedProfiles);

                    const initialCount = Math.min(12, fetchedProfiles.length);
                    const initialCards = [];

                    for (let i = 0; i < initialCount; i++) {
                        initialCards.push(createCardData(fetchedProfiles[i], i));
                    }

                    nextCardId.current = initialCount;
                    setCards(initialCards);
                }
            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, [createCardData]);

    const triggerButtonFeedback = (direction) => {
        if (direction === 'like') {
            setLikeTrigger(prev => !prev);
        } else {
            setDislikeTrigger(prev => !prev);
        }
    };

    const handleSwipeDecision = (direction, card) => {
        console.log(`Action: ${direction.toUpperCase()} | User: ${card.name}`);

        if (direction === 'like') {
            // TODO: POST /api/like -> { profileId: card.profileId }
        } else if (direction === 'dislike') {
            // TODO: POST /api/dislike -> { profileId: card.profileId }
        }
    };

    const handleButtonClick = (direction) => {
        setCards(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const activeIdx = updated.length - 1;
            const activeCard = updated[activeIdx];

            if (activeCard.isDismissing) return prev;

            const multiplier = direction === 'like' ? 1 : -1;

            activeCard.isDismissing = true;
            activeCard.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            activeCard.transform = `translate(${multiplier * window.innerWidth}px, -40px) rotate(${45 * multiplier}deg)`;

            triggerButtonFeedback(direction);
            handleSwipeDecision(direction, activeCard);

            setTimeout(() => {
                setCards(p => p.filter(c => c.id !== activeCard.id));
            }, 800);

            appendNewCard();
            return updated;
        });
    };

    const isTouchDevice = () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    };

    const handleDragStart = (e) => {
        // Ignore drags originating directly on Swiper pagination or navigation buttons
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

    const renderBullet = (index, className) => '<span class="' + className + '">' + (index + 1) + '</span>';

    return (
        <MainLayout pageTitle={ENCOUNTERS_TITLE} pageDetails={ENCOUNTERS_TEXT}>
            <HelmetHeader pageTitle={ENCOUNTERS_TITLE} />

            {/* <div className="relative w-full h-full mx-auto overflow-hidden bg-gradient-to-b from-[#ff6036] to-[#fd267a] select-none my-4 rounded-xl"> */}
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
                        const interactiveProps = isTopCard
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
                                // className={`absolute w-70 sm:80 h-95 sm:h-120 rounded-[20px] overflow-hidden cursor-grab 
                                className={`absolute rounded-[20px] overflow-hidden cursor-grab 
                                    active:cursor-grabbing shadow-[2px_2px_20px_rgba(0,0,0,0.5)] card-token
                                    transition-all ${card.isDismissing ? 'pointer-events-none' : ''}`}
                                style={{
                                    ...stackStyle,
                                    transform: card.transform || stackStyle.transform,
                                    transition: card.transition || 'transform 0.5s ease',
                                    zIndex: stackIndex,
                                }}
                                {...interactiveProps}
                                onDragStart={(e) => e.preventDefault()}
                            >
                                {/* 
                                  Keying Swiper by `swiper-top-${isTopCard}` forces React to initialize Swiper 
                                  with full navigation controls as soon as this card moves to the top of the stack.
                                */}
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
                                                src={picture}
                                                alt={`${card.name || 'Profile'} picture ${idx + 1}`}
                                                className="w-full h-full object-cover pointer-events-none"
                                            />
                                        </SwiperSlide>
                                    ))}
                                </ReactSwiper>

                                {/* Profile Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/70 to-transparent text-white pointer-events-none">
                                    <h3 className="text-lg font-bold leading-tight">
                                        {card.name}{card.age ? `, ${card.age}` : ''}
                                    </h3>
                                    {card.distanceFrom !== undefined && (
                                        <p className="text-xs text-gray-200 mt-1">
                                            📍 {card.distanceFrom} miles away
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <article className='z-30 w-full h-[12vh] flex justify-center items-center gap-3 bottom-buttons'>
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
            </div>
        </MainLayout>
    );
}