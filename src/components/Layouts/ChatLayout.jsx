// ChatLayout.jsx
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
    LocateFixed, Copy, Heart, MessageCircleCode, User,
    ArrowLeft, ChevronRight, Crown,
} from 'lucide-react';

import {
    chatsPath, encountersPath, likesPath, nearbyPath, profilePath,
    partnerProfilePath, premiumPath, socket, userId,
} from '../../utils/constants';
import {
    chooseColour, chooseTextColour, isSame, formatLastSeenDate, renderImageUrl,
} from '../../utils/functions';
import { getUnreadChatsCountHandler } from '../../tanstack/chat';
import { getNewLikesCountHandler } from '../../tanstack/encounter';
import { getPremiumStatusHandler } from '../../tanstack/user';

import AdSense from '../AdSense';

const ChatLayout = ({
    children,
    partnerId,
    partnerName,
    partnerAge,
    partnerPicture,
    lastSeen,
    onlineStatus,
    chat_id,
}) => {
    const currentPathName = useLocation().pathname;
    const navigate = useNavigate();
    const [unreadChatsCount, setUnreadChatsCount] = useState(0);
    const [newLikesCount, setNewLikesCount] = useState(0);

    /* ---------------------------------------------------------------- */
    /* Premium status — shares the cached result with Chat/Encounters/  */
    /* Nearby/Likes via the same query key.                             */
    /* ---------------------------------------------------------------- */
    const { data: premiumStatusData } = useQuery({
        queryKey: ['premium-status'],
        queryFn: getPremiumStatusHandler,
    });

    const isPremium =
        premiumStatusData === undefined
            ? null
            : Boolean(premiumStatusData?.is_premium);

    useEffect(() => {
        (async () => {
            const chatsResponse = await getUnreadChatsCountHandler();
            setUnreadChatsCount(chatsResponse.count);

            const newLikesResposne = await getNewLikesCountHandler();
            setNewLikesCount(newLikesResposne.count);
        })();
    }, []);

    useEffect(() => {
        const handleNewMessage = async ({ message }) => {
            if (
                message &&
                isSame(message.recipient_id, userId) &&
                chat_id &&
                !isSame(message.chat_id, chat_id)
            ) {
                const chatsResponse = await getUnreadChatsCountHandler();
                setUnreadChatsCount(chatsResponse.count);
            }
        };

        const handleMessageRead = async ({ recipient_id }) => {
            if (recipient_id && isSame(recipient_id, userId)) {
                const chatsResponse = await getUnreadChatsCountHandler();
                setUnreadChatsCount(chatsResponse.count);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_read', handleMessageRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_read', handleMessageRead);
        };
    }, [chat_id]);

    const pictureUrl = renderImageUrl(partnerPicture);

    const openPartnerProfile = () => {
        if (!partnerId) return;
        navigate(partnerProfilePath, { state: { user_id: partnerId } });
    };

    /* ---------------------------------------------------------------- */
    /* Status line — three states:                                      */
    /*   1. Online       → always shown to everyone                     */
    /*   2. Last seen    → premium only, others see an upgrade CTA      */
    /*   3. Offline/no   → "Offline" for premium, upgrade CTA for free  */
    /* ---------------------------------------------------------------- */
    const renderStatusLine = () => {
        if (onlineStatus) {
            return (
                <span className="text-emerald-600 font-medium">Online</span>
            );
        }

        // Premium users get the real last-seen timestamp (or "Offline")
        if (isPremium) {
            return lastSeen ? (
                formatLastSeenDate(lastSeen)
            ) : (
                'Offline'
            );
        }

        // Free users see an upgrade prompt. During the null loading window
        // we render nothing so there's no flash of the wrong state.
        if (isPremium === null) {
            return <span className="opacity-0">···</span>;
        }

        return (
            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <Crown size={11} className="flex-shrink-0" />
                Upgrade to see last seen
            </span>
        );
    };

    // Free users get a tappable status line that goes to the premium page.
    // Premium users get a plain span (no pointer interaction needed).
    const isStatusClickable = !onlineStatus && isPremium === false;

    const handleStatusClick = (e) => {
        if (!isStatusClickable) return;
        e.stopPropagation(); // don't trigger the partner-profile navigation
        navigate(premiumPath);
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 select-none">
            <div className="relative h-full w-full lg:max-w-2xl flex flex-col">
                {/* Header */}
                <section className="w-full h-[7vh] flex items-center justify-between bg-white py-2 px-3 sm:px-4 z-10 border-b border-[#e2e8f0] shadow-sm">
                    <button
                        type="button"
                        onClick={openPartnerProfile}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-2xl px-1 py-0.5 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={pictureUrl}
                                alt={partnerName || 'Profile'}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                            {onlineStatus && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1 truncate">
                                <span className="truncate">
                                    {partnerName}
                                    {partnerAge ? `, ${partnerAge}` : ''}
                                </span>
                                <ChevronRight
                                    size={16}
                                    className="text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors"
                                />
                            </h1>

                            {/* Status line — pointer-events only enabled for the
                                upgrade prompt so tapping it doesn't also open
                                the partner profile */}
                            <p
                                onClick={handleStatusClick}
                                className={`text-[11px] sm:text-xs text-slate-500 truncate ${isStatusClickable
                                    ? 'cursor-pointer hover:underline pointer-events-auto'
                                    : 'pointer-events-none'
                                    }`}
                            >
                                {renderStatusLine()}
                            </p>
                        </div>
                    </button>

                    {/* Back arrow — far right */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0 ml-2"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                </section>

                {/* Main content */}
                <section className="w-full h-[76vh] bg-[#f8fafc] border-x border-[#e2e8f0] overflow-y-auto">
                    {children}
                </section>

                {/* Bottom navigation */}
                <section className="h-[10vh] w-full flex justify-between items-center bg-white py-2 px-4 border-t border-x border-[#e2e8f0] z-10">
                    <div className="w-full flex justify-around">
                        <NavLink to={nearbyPath} className="flex flex-col items-center cursor-pointer">
                            <LocateFixed color={chooseColour(nearbyPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(nearbyPath, currentPathName)}`}>
                                Nearby
                            </p>
                        </NavLink>
                        <NavLink to={encountersPath} className="flex flex-col items-center cursor-pointer">
                            <Copy color={chooseColour(encountersPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(encountersPath, currentPathName)}`}>
                                Encounters
                            </p>
                        </NavLink>
                        <NavLink to={likesPath} className="indicator flex flex-col items-center cursor-pointer">
                            {newLikesCount > 0 && (
                                <span className="indicator-item badge badge-accent rounded-full w-6 h-6 text-[10px] font-bold">
                                    {newLikesCount}
                                </span>
                            )}
                            <Heart color={chooseColour(likesPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(likesPath, currentPathName)}`}>
                                Likes
                            </p>
                        </NavLink>
                        <NavLink to={chatsPath} className="indicator flex flex-col items-center cursor-pointer">
                            {unreadChatsCount > 0 && (
                                <span className="indicator-item badge badge-primary rounded-full w-6 h-6 text-[10px] font-bold">
                                    {unreadChatsCount}
                                </span>
                            )}
                            <MessageCircleCode color={chooseColour(chatsPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(chatsPath, currentPathName)}`}>
                                Chats
                            </p>
                        </NavLink>
                        <NavLink to={profilePath} className="flex flex-col items-center cursor-pointer">
                            <User color={chooseColour(profilePath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(profilePath, currentPathName)}`}>
                                Profile
                            </p>
                        </NavLink>
                    </div>
                </section>

                {/* AdSense */}
                <section className="h-[7vh] w-full flex justify-center items-center bg-white border-t border-x border-[#e2e8f0] overflow-hidden z-10">
                    <div className="w-full h-full flex justify-center items-center">
                        Advertisement Here
                        {/* <AdSense
                            client="ca-pub-1951941014525314"
                            slot="4437680249"
                            format="horizontal"
                            responsive="true"
                        /> */}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ChatLayout;