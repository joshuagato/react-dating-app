import { useState, useEffect } from 'react';
import { Star, MessageCircle, Users, Crown } from 'lucide-react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LiaCheckDoubleSolid, LiaCheckSolid } from 'react-icons/lia';

import {
    CHATS_TITLE, CHATS_TEXT, baseURL, userId, socket, chatPath,
} from '../utils/constants';
import {
    buildPictureUrl, formatMessageDate, isCurrentUser, isSame, decryptText,
} from '../utils/functions';
import { getChatsHandler } from '../tanstack/chat';
import { getPremiumStatusHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chats() {
    const [chats, setChats] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ---------------------------------------------------------------- */
    /* Premium status — shared query key with the rest of the app       */
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
    /* Fetch chats on mount                                             */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const chatsResponse = await getChatsHandler();
                const fetchedChats = chatsResponse.chats;

                if (fetchedChats.length > 0) setChats(fetchedChats);
            } catch (error) {
                console.error('Failed to fetch match profiles:', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ---------------------------------------------------------------- */
    /* Socket listeners                                                 */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        const refreshChats = async () => {
            const chatsResponse = await getChatsHandler();
            const fetchedChats = chatsResponse.chats;
            if (fetchedChats.length > 0) setChats(fetchedChats);
        };

        const handleNewMessage = async ({ message }) => {
            if (message && isSame(message.recipient_id, userId)) {
                await refreshChats();
            }
        };

        const handlePartnerTyping = ({ recipient_id, sender_id, isTyping }) => {
            if (recipient_id && isSame(recipient_id, userId)) {
                if (isTyping)
                    return setTypingUsers((prevState) => [...prevState, sender_id]);

                setTypingUsers((prevState) =>
                    prevState.filter((id) => id !== sender_id)
                );
            }
        };

        const handleMessageDelivered = async ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                await refreshChats();
            }
        };

        const handleMessageRead = async ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                await refreshChats();
            }
        };

        const handleUserStatusChange = async ({ user_id, is_online }) => {
            await refreshChats();

            if (is_online)
                return setOnlineUsers((prevState) => [...prevState, user_id]);

            setOnlineUsers((prevState) => prevState.filter((id) => id !== user_id));
        };

        socket.on('partner_typing', handlePartnerTyping);
        socket.on('new_message', handleNewMessage);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('message_read', handleMessageRead);
        socket.on('user_status_change', handleUserStatusChange);

        return () => {
            socket.off('partner_typing', handlePartnerTyping);
            socket.off('new_message', handleNewMessage);
            socket.off('message_delivered', handleMessageDelivered);
            socket.off('message_read', handleMessageRead);
            socket.off('user_status_change', handleUserStatusChange);
        };
    }, []);

    /* ---------------------------------------------------------------- */
    /* Empty state                                                      */
    /* ---------------------------------------------------------------- */
    const renderEmptyState = () => (
        <div className="w-full h-full flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-violet-600/10 to-pink-600/10 flex items-center justify-center">
                    <MessageCircle size={48} className="text-violet-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center shadow-lg">
                    <Users size={20} className="text-white" />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">No Conversations Yet</h3>
            <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
                Start a conversation by matching with someone new. Your chats
                will appear here once you've connected with others.
            </p>

            <Link
                to="/nearby"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white font-medium hover:brightness-110 transition-all shadow-lg hover:shadow-pink-500/25"
            >
                <Users size={18} />
                Find People to Chat With
            </Link>

            <div className="mt-8 flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Online now</span>
                </div>
                <div className="flex items-center gap-2">
                    <LiaCheckDoubleSolid size={14} className="text-blue-500" />
                    <span>Read receipts</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                    <span>Real-time typing</span>
                </div>
            </div>
        </div>
    );

    /* ---------------------------------------------------------------- */
    /* Loading state                                                    */
    /* ---------------------------------------------------------------- */
    const renderLoading = () => (
        <div className="w-full space-y-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="w-full h-16 flex items-center gap-3 animate-pulse"
                >
                    <div className="w-14 h-14 rounded-full bg-gray-800/50 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-800/50 rounded w-32"></div>
                        <div className="h-3 bg-gray-800/50 rounded w-48"></div>
                    </div>
                    <div className="w-12 h-10 bg-gray-800/50 rounded"></div>
                </div>
            ))}
        </div>
    );

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 sm:px-8 py-2 overflow-y-scroll">
                {loading ? (
                    renderLoading()
                ) : chats.length > 0 ? (
                    <div className="w-full grid grid-cols-1 gap-4">
                        {chats.map((chat, index) => {
                            const {
                                id: chat_id,
                                myself,
                                partner,
                                unread_message_count = 0,
                                last_message = {},
                            } = chat;
                            const {
                                content = '',
                                sender_id = '',
                                sent_at = '',
                                delivered_at = '',
                                read_at = '',
                            } = last_message || {};

                            const { id: partner_id, name, picture, is_online } = partner;

                            const isOwn = isCurrentUser(userId, sender_id);
                            const formatted = formatMessageDate(sent_at, true);
                            const pictureUrl = buildPictureUrl(baseURL, picture);

                            // Read receipts are premium-only. Free users
                            // still see their messages, just no tick marks.
                            const showReceipts = isOwn && isPremium;

                            return (
                                <Link
                                    to={chatPath}
                                    state={{ chat_id, myself, partner }}
                                    key={index}
                                    className="w-full h-15 flex justify-between items-center cursor-pointer active:bg-neutral-100 rounded-lg hover:bg-white/5 transition-colors p-2"
                                >
                                    <section className="flex gap-3">
                                        <div className="w-15 h-15 relative flex-shrink-0">
                                            <img
                                                className="w-full h-full object-cover rounded-full"
                                                src={pictureUrl}
                                                alt="User Profile Picture"
                                            />
                                            {(is_online ||
                                                onlineUsers.includes(partner_id)) && (
                                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></span>
                                                )}
                                        </div>
                                        <div className="w-50 sm:w-80 h-15">
                                            <div className="w-full h-full flex flex-col justify-center items-start">
                                                <h1 className="text-[14px] sm:text-[18px] font-semibold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">
                                                    {name}
                                                </h1>
                                                <p
                                                    className="w-full text-[12px] sm:text-[13px] text-gray-400"
                                                    style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {!typingUsers.includes(partner_id) ? (
                                                        <span className="flex items-center">
                                                            {showReceipts && (
                                                                <span className="text-xs text-gray-500 mr-2 opacity-70 inline-block">
                                                                    {sent_at &&
                                                                        !delivered_at &&
                                                                        !read_at && (
                                                                            <LiaCheckSolid
                                                                                color="gray"
                                                                                size={15}
                                                                            />
                                                                        )}
                                                                    {sent_at &&
                                                                        delivered_at &&
                                                                        !read_at && (
                                                                            <LiaCheckDoubleSolid
                                                                                color="gray"
                                                                                size={15}
                                                                            />
                                                                        )}
                                                                    {sent_at &&
                                                                        delivered_at &&
                                                                        read_at && (
                                                                            <LiaCheckDoubleSolid
                                                                                color="blue"
                                                                                size={15}
                                                                            />
                                                                        )}
                                                                </span>
                                                            )}
                                                            <span>{decryptText(content)}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-sm text-violet-400">
                                                                typing
                                                            </span>
                                                            <span className="typing-dots">
                                                                <span className="dot"></span>
                                                                <span className="dot"></span>
                                                                <span className="dot"></span>
                                                            </span>
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                    <section className="w-16 flex-shrink-0">
                                        <div className="w-full flex flex-col items-center gap-2">
                                            {unread_message_count > 0 ? (
                                                <span className="indicator-item badge badge-primary rounded-full w-6 h-6 text-[10px] font-bold bg-gradient-to-r from-violet-600 to-pink-600 border-none">
                                                    {unread_message_count}
                                                </span>
                                            ) : (
                                                <Star size={15} className="text-gray-400" />
                                            )}
                                            <span className="text-[10px] text-gray-500">
                                                {formatted}
                                            </span>
                                        </div>
                                    </section>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    renderEmptyState()
                )}
            </div>

            <style jsx>{`
                .typing-dots {
                    display: inline-flex;
                    gap: 3px;
                    align-items: center;
                }
                .typing-dots .dot {
                    width: 4px;
                    height: 4px;
                    background-color: #8b5cf6;
                    border-radius: 50%;
                    animation: typing-bounce 1.4s both infinite;
                }
                .typing-dots .dot:nth-child(1) {
                    animation-delay: -0.32s;
                }
                .typing-dots .dot:nth-child(2) {
                    animation-delay: -0.16s;
                }
                .typing-dots .dot:nth-child(3) {
                    animation-delay: 0s;
                }

                @keyframes typing-bounce {
                    0%,
                    80%,
                    100% {
                        transform: scale(0.6);
                        opacity: 0.4;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </MainLayout>
    );
}