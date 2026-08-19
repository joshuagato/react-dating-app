import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router';
import { LiaCheckDoubleSolid, LiaCheckSolid } from 'react-icons/lia';

import { CHATS_TITLE, CHATS_TEXT, baseURL, userId, socket } from '../utils/constants';
import { buildPictureUrl, formatMessageDate, isCurrentUser, isSame } from '../utils/functions';
import { getChatsHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chats() {
    const [chats, setChats] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Fetch potential matches on mount
    useEffect(() => {
        (async () => {
            try {
                const chatsResponse = await getChatsHandler();
                const chats = chatsResponse.chats;

                if (chats.length > 0)
                    setChats(chats);

            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, []);

    useEffect(() => {
        // console.log({ isTyping });
    }, [isTyping]);

    // ========== SOCKET EVENT LISTENERS ==========
    useEffect(() => {
        const handleNewMessage = async ({ message }) => {
            if (message && isSame(message.recipient_id, userId)) {
                const chatsResponse = await getChatsHandler();
                const chats = chatsResponse.chats;

                if (chats.length > 0)
                    setChats(chats);
            }
        };

        const handlePartnerTyping = ({ recipient_id, sender_id, isTyping }) => {
            if (recipient_id && isSame(recipient_id, userId)) {
                setIsTyping(isTyping);
                setTypingUsers(prevState => [...prevState, sender_id]);
            }
        };

        const handleMessageDelivered = async ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                const chatsResponse = await getChatsHandler();
                const chats = chatsResponse.chats;

                if (chats.length > 0)
                    setChats(chats);
            }
        };

        const handleMessageRead = async ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                const chatsResponse = await getChatsHandler();
                const chats = chatsResponse.chats;

                if (chats.length > 0)
                    setChats(chats);
            }
        };

        const handleUserStatusChange = async ({ userId, isOnline }) => {
            if (isOnline) return setOnlineUsers(prevState => [...prevState, userId]);

            setOnlineUsers(prevState => prevState.filter(id => id !== userId));
        }

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

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 sm:px-8 py-2 overflow-y-scroll">
                <div className='w-full h-full grid grid-cols-1 gap-5'>
                    {chats.length > 0 && chats.map((chat, index) => {

                        const { id: chat_id, myself, partner, unread_message_count,
                            last_message: { content, sender_id, sent_at, delivered_at, read_at } } = chat;

                        const { id: partner_id, name, picture } = partner;
                        const isOwn = isCurrentUser(userId, sender_id);
                        const formatted = formatMessageDate(sent_at, true);
                        const pictureUrl = buildPictureUrl(baseURL, picture);

                        return (
                            <Link to={'/chat'} state={{ chat_id, myself, partner }} key={index} className='w-full h-15 flex justify-between items-center gap-3 cursor-pointer active:bg-neutral-100'>
                                <section className='flex gap-3'>
                                    <div className='w-15 h-15'>
                                        <img className='w-full h-full object-cover rounded-full'
                                            src={pictureUrl}
                                            alt="User Profile Picture"
                                        />
                                    </div>
                                    <div className='w-50 sm:w-80 h-15'>
                                        <div className='w-full h-full flex flex-col justify-center items-start bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                                            <h1 className='text-[14px] sm:text-[18px] flex items-center gap-2'>{name}
                                                {onlineUsers.includes(partner_id) &&
                                                    <span className='block w-2 h-2 bg-green-700 rounded-full'></span>}
                                            </h1>
                                            <p className='w-full text-[12px] sm:text-[13px]'
                                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {!isTyping && !typingUsers.includes(partner_id) || !isTyping ?
                                                    <span className='flex items-center'>
                                                        {isOwn && (
                                                            <span className="text-xs text-gray-500 mr-2 opacity-70 inline-block">
                                                                {sent_at && !delivered_at && !read_at && <LiaCheckSolid color='gray' size={15} />}
                                                                {sent_at && delivered_at && !read_at && <LiaCheckDoubleSolid color='gray' size={15} />}
                                                                {sent_at && delivered_at && read_at && <LiaCheckDoubleSolid color='blue' size={15} />}
                                                            </span>
                                                        )}
                                                        <span>{content}</span>
                                                    </span> :
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-sm">typing</span>
                                                        <span className="typing-dots">
                                                            <span className="dot"></span>
                                                            <span className="dot"></span>
                                                            <span className="dot"></span>
                                                        </span>
                                                    </span>}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                <section className='w-15'>
                                    <div className='w-full flex flex-col items-center gap-2'>
                                        {unread_message_count > 0 ?
                                            <span className="indicator-item badge badge-primary rounded-full w-6 h-6 text-[10px] font-bold">{unread_message_count}</span> :
                                            <Star size={15} />}
                                        <span className='text-[10px]'>{formatted}</span>
                                    </div>
                                </section>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
}