import { useState, useRef, useCallback, useEffect } from 'react';
import { Heart, Asterisk, Radar, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { format, formatRelative, parseISO } from 'date-fns';

import { CHATS_TITLE, CHATS_TEXT, baseURL, userId, socket } from '../utils/constants';
import { writeName, isSameDate, formatMessageDate } from '../utils/functions';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';
import { sendMessageHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chat() {
    const initialMessages = [
        { id: 1, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, sentAt: '2026-08-10', isDelivered: true, deliveredAt: '2026-08-13', seen: true, seenAt: '2026-08-13', content: 'Hello Joshua' },
        { id: 2, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-13', isDelivered: true, deliveredAt: '2026-08-13', seen: true, seenAt: '2026-08-13', content: 'Hello Emmanuel' },
        { id: 3, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-13', isDelivered: true, deliveredAt: '2026-08-13', seen: true, seenAt: '2026-08-13', content: "It's been a long time" },
        { id: 4, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-14', isDelivered: true, deliveredAt: '2026-08-14', seen: true, seenAt: '2026-08-13', content: 'How are you doing.' },
        { id: 5, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, sentAt: '2026-08-14', isDelivered: true, deliveredAt: '2026-08-14', seen: false, seenAt: null, content: "I'm fine. What about you" },
        { id: 6, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, sentAt: '2026-08-14', isDelivered: true, deliveredAt: '2026-08-14', seen: false, seenAt: null, content: "I'm fine. What about you" },
        { id: 7, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-14', isDelivered: true, deliveredAt: '2026-08-14', seen: true, seenAt: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 8, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-15', isDelivered: true, deliveredAt: '2026-08-15', seen: true, seenAt: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 9, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, sentAt: '2026-08-15', isDelivered: true, deliveredAt: '2026-08-15', seen: true, seenAt: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 10, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, sentAt: '2026-08-15', isDelivered: false, deliveredAt: null, seen: false, seenAt: null, content: 'What are you doing at the moment?' },
        { id: 11, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, sentAt: '2026-08-15', isDelivered: false, deliveredAt: null, seen: false, seenAt: null, content: 'What are you doing at the moment?' },
    ];

    const [profiles, setProfiles] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(initialMessages.sort((a, b) => Number(a.id) - Number(b.id)));
    // const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    let user0 = '';
    let user1 = '';
    let user2 = '';

    let message0 = {};
    let message1 = {};

    const isDetails = true;
    const userId1 = '0a31f97a-99ce-457e-9ac4-c9a01955bcbd';
    const userId2 = '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31';

    const isCurrentUser = (currentUserId, otherUserId) => currentUserId.toString() === otherUserId.toString();
    const getUserProfile = (userId, profiles) => profiles.find(profile => profile?.id.toString() === userId.toString());
    const getRecipientId = userId => userId.toString() === userId1.toString() ? userId2 : userId1;
    const isSame = (user1, user2) => user1.toString() === user2?.toString();

    const typingTimeoutRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(0);
    const isTypingRef = useRef(false);

    useEffect(() => {
        const handleNewMessage = ({ message }) => {
            if (message && isSame(message.recipient_id, userId)) {
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m.id === message.id);
                    if (exists) return prevMessages;
                    return [...prevMessages, message].sort((a, b) => Number(a.id) - Number(b.id));
                });
            }
        };

        const handlePartnerTyping = ({ recipient_id, isTyping }) => {
            if (recipient_id && isSame(recipient_id, userId))
                setIsTyping(isTyping);
        };

        const handleMessageRead = ({ sender_id, new_array }) => {
            if (sender_id && isSame(sender_id, userId)) setMessages(new_array);
        }

        socket.on('partner_typing', handlePartnerTyping);
        socket.on('new_message', handleNewMessage);
        socket.on('message_read', handleMessageRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('partner_typing', handlePartnerTyping);
        };
    }, []);

    // Debounced Typing Handler
    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessage(value);

        const recipient_id = getRecipientId(userId);
        lastKeystrokeTimeRef.current = Date.now();

        // Emit 'sender_typing_start' on first keystroke
        if (!isTypingRef.current && value.trim().length > 0) {
            isTypingRef.current = true;
            socket.emit('sender_typing_start', { recipient_id });
        }

        // Clear existing scheduled timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Schedule check 1.5 seconds after this keystroke
        typingTimeoutRef.current = setTimeout(() => {
            const timeSinceLastKeystroke = Date.now() - lastKeystrokeTimeRef.current;

            // Only trigger stop if no keystroke occurred within the last 3000ms
            if (timeSinceLastKeystroke >= 1500) {
                isTypingRef.current = false;
                socket.emit('sender_typing_stop', { recipient_id });
            }
        }, 1500);
    };

    // Cleanup typing timer on component unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    async function handleMessageSending(event) {
        event.preventDefault();

        const sender_id = userId;
        const recipient_id = getRecipientId(userId);
        const messages_length = messages.length;
        const sentAt = new Date();

        const response = await sendMessageHandler({ message, sentAt, sender_id, recipient_id, messages_length });

        const newMessage = response.message
        setMessages(prevMessages => {
            const exists = prevMessages.some(m => m.id === newMessage?.id);
            if (exists) return prevMessages;
            return [...prevMessages, newMessage].sort((a, b) => Number(a.id) - Number(b.id))
        });
        setMessage('');
        socket.emit('sender_typing_stop', { recipient_id });
    }

    // Fetch potential matches on mount
    useEffect(() => {
        (async () => {
            try {
                const response = await getPotentialMatchProfilesHandler();
                const fetchedProfiles = response?.userProfiles || [];

                if (fetchedProfiles.length > 0) {
                    setProfiles(fetchedProfiles);
                }
            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, []);

    // Auto-scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
            // chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, []);

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);


    useEffect(() => {
        scrollToBottom();
    });

    useEffect(() => {
        // console.log({ profiles });
    }, [profiles]);

    async function handleLoad(event, message) {
        event.preventDefault();

        const isOwn = isCurrentUser(userId, message.sender_id);
        if (!isOwn) {
            setTimeout(() => {
                setMessages(prevMessages => {
                    const newArray = prevMessages.map(msg => {
                        msg.sent = true;
                        msg.isDelivered = true;
                        msg.seen = true;
                        return msg;
                    });

                    const sender_id = message.sender_id;
                    const new_array = newArray;
                    socket.emit('show_sender_message_read', { sender_id, new_array });
                    return newArray;
                });
            }, 3000);
        }
    }

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className='w-full h-full flex flex-col'>
                <div ref={chatContainerRef} className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 py-2 bg-base-100 overflow-y-scroll">
                    {profiles?.length > 0 && messages?.length > 0 && messages.map((message, index) => {
                        user0 = user1;
                        user1 = message.sender_id;
                        user2 = messages[index + 1]?.sender_id || '';

                        message0 = message1;
                        message1 = message;

                        const showName = writeName(user1, user2, user0);

                        const isSameSenderAsNext = isSame(user1, user2);
                        const isOwn = isCurrentUser(userId, message.sender_id);
                        const profile = getUserProfile(message.sender_id, profiles);
                        const isSameDay = isSameDate(message0, message1);

                        // const parsedDate = parseISO(message.sentAt);
                        // const formatted = formatRelative(parsedDate, new Date());
                        // const formatted = format(new Date(), '');
                        // const formatted = format(new Date(message.sentAt), " eeee");
                        const formatted = formatMessageDate(message.sentAt);

                        return (
                            <>
                                {!isSameDay && <span className='w-fit self-center bg-slate-400 text-amber-50 px-3 my-5 rounded-md text-center'>
                                    {/* {message.sentAt.split('T')[0]} */}
                                    {formatted}
                                </span>}

                                <div key={message.id} className={`chat ${isOwn ? 'chat-end' : 'chat-start'} ${showName && isSameDay ? 'mt-3' : ''} active:bg-neutral-100`} onLoad={(event) => { handleLoad(event, message) }}>

                                    {isDetails && !isSameSenderAsNext &&
                                        <div className="chat-image avatar">
                                            <div className="w-10 rounded-full">
                                                <img
                                                    alt='Profile Picture'
                                                    src={profile.pictures[0]}
                                                />
                                            </div>
                                        </div>}
                                    {!isDetails || isSameSenderAsNext &&
                                        <div className='block w-10' />}


                                    <div className="chat-header">
                                        {/* {isDetails && !isSameSenderAsNext && <span>{getUserProfile(message.sender_id, profiles).name}</span>} */}
                                        {isDetails && showName && <span>{profile.name}</span>}
                                        {/* <time className="text-xs opacity-50">12:45</time> */}
                                    </div>
                                    <div className={`flex flex-col chat-bubble ${isOwn ? '' : 'chat-bubble-error'}`}>
                                        <span>{message.content}</span>
                                        <div className='flex self-end'>
                                            <time className="text-xs opacity-50">12:45 PM</time>
                                            {isOwn && <span className="text-xs ml-2 opacity-70 inline-block">
                                                {message.sent && !message.isDelivered && !message.seen && <span>✓</span>}
                                                {message.sent && message.isDelivered && !message.seen && <span className=''>✓✓</span>}
                                                {message.sent && message.isDelivered && message.seen && (
                                                    <span className="text-sky-600 font-bold">✓✓</span>
                                                )}
                                            </span>}
                                        </div>
                                    </div>
                                    {isOwn && <>
                                        {message.sent && message.isDelivered && message.seen && <div className="chat-footer opacity-50">Seen at 12:46</div>}
                                        {message.sent && message.isDelivered && !message.seen && <div className="chat-footer opacity-50">Delivered</div>}
                                        {message.sent && !message.isDelivered && !message.seen && <div className="chat-footer opacity-50">Sent</div>}
                                    </>}
                                </div>
                            </>
                        );
                    })}

                    {isTyping && (
                        <div className="chat chat-start absolute bottom-1">
                            <div className="chat-bubble chat-bubble-accent">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">typing</span>
                                    <span className="typing-dots">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
                <section>
                    <form action="" onSubmit={handleMessageSending}>
                        <input className='w-full border border-slate-200 resize-none' value={message}
                            // onChange={e => setMessage(e.target.value)} 
                            // onInput={typingHandler} 
                            // onKeyUp={typingStopHandler}
                            onChange={handleInputChange}
                        />
                    </form>
                </section>
            </div>
        </MainLayout >
    );
}