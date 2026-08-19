import { useState, useRef, useCallback, useEffect, Fragment, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LiaCheckSolid, LiaCheckDoubleSolid } from "react-icons/lia";
import EmojiPicker from 'emoji-picker-react';

import { CHATS_TITLE, CHATS_TEXT, userId, socket } from '../utils/constants';
import {
    writeName, isSameDate, formatMessageDate, timeTo12Hour, isCurrentUser,
    getUserProfile, isSame
} from '../utils/functions';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';
import { getChatMessagesHandler, markMessageAsReadHandler, sendMessageHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import './chat.css';

export default function Chat() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const location = useLocation();

    const { chat_id, myself, partner } = location.state || {};

    // Redirect if no chat_id
    useEffect(() => {
        if (!chat_id) {
            navigate('/chats');
        }
    }, [chat_id, navigate]);

    // Refs
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(0);
    const isTypingRef = useRef(false);
    const processedMessageIdsRef = useRef(new Set()); // Track processed messages
    const observerRef = useRef(null);

    const isDetails = true;

    // ========== SCROLL FUNCTIONS ==========
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior,
                block: 'end'
            });
        }
    }, []);

    // ========== MESSAGE READ HANDLER ==========
    const markMessageAsRead = useCallback(async (message) => {
        // Skip if already processed, or it's the user's own message, or already read
        if (processedMessageIdsRef.current.has(message.id)) return;
        if (isCurrentUser(userId, message.sender_id)) return;
        if (message.read_at) return;

        try {
            // Mark as processed immediately to prevent duplicate calls
            processedMessageIdsRef.current.add(message.id);

            await markMessageAsReadHandler(message.id);

            // Update local state to reflect read status
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === message.id
                        ? { ...msg, read_at: new Date().toISOString() }
                        : msg
                )
            );
        } catch (error) {
            // If failed, remove from processed set so it can be retried
            processedMessageIdsRef.current.delete(message.id);
            console.error("Failed to mark message as read:", error);
        }
    }, []);

    // ========== INTERSECTION OBSERVER SETUP ==========
    useEffect(() => {
        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        // Create new observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.dataset.messageId;
                        if (messageId) {
                            // Find the message in state
                            const message = messages.find(m => m.id === messageId);
                            if (message) {
                                markMessageAsRead(message);
                            }
                        }
                    }
                });
            },
            {
                root: chatContainerRef.current,
                rootMargin: '0px',
                threshold: 0.3 // 30% visibility threshold
            }
        );

        // Observe all message elements
        const messageElements = chatContainerRef.current?.querySelectorAll('[data-message-id]');
        if (messageElements) {
            messageElements.forEach(el => {
                observerRef.current.observe(el);
            });
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [messages, markMessageAsRead]);

    // ========== FETCH INITIAL DATA ==========
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [messagesResponse, profilesResponse] = await Promise.all([
                    getChatMessagesHandler(chat_id),
                    getPotentialMatchProfilesHandler()
                ]);

                if (messagesResponse?.messages) {
                    setMessages(messagesResponse.messages);
                }

                if (profilesResponse?.userProfiles) {
                    setProfiles(profilesResponse.userProfiles);
                }

                // Scroll to bottom after messages load
                setTimeout(() => scrollToBottom('auto'), 100);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        if (chat_id) {
            fetchData();
        }
    }, [chat_id, scrollToBottom]);

    // ========== SOCKET EVENT LISTENERS ==========
    useEffect(() => {
        const handleNewMessage = ({ message }) => {
            if (message && isSame(message.recipient_id, userId)) {
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m.id === message.id);
                    if (exists) return prevMessages;
                    return [...prevMessages, message];
                });
                // Scroll to bottom for new messages
                setTimeout(scrollToBottom, 100);
            }
        };

        const handlePartnerTyping = ({ recipient_id, isTyping }) => {
            if (recipient_id && isSame(recipient_id, userId)) {
                setIsTyping(isTyping);
            }
        };

        const handleMessageDelivered = ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === message.id ? message : msg
                    )
                );
            }
        };

        const handleMessageRead = ({ message }) => {
            if (message && isSame(message.sender_id, userId)) {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === message.id ? message : msg
                    )
                );
            }
        };

        socket.on('partner_typing', handlePartnerTyping);
        socket.on('new_message', handleNewMessage);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('message_read', handleMessageRead);

        return () => {
            socket.off('partner_typing', handlePartnerTyping);
            socket.off('new_message', handleNewMessage);
            socket.off('message_delivered', handleMessageDelivered);
            socket.off('message_read', handleMessageRead);
        };
    }, [scrollToBottom]);

    // ========== CLEANUP TYPING TIMER ==========
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // ========== AUTO-GROW TEXTAREA ==========
    const autoGrow = useCallback((element) => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 200) + 'px';
    }, []);

    // ========== TYPING HANDLER ==========
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setMessage(value);
        autoGrow(e.target);

        const recipient_id = partner?.id;
        const sender_id = userId;
        if (!recipient_id) return;

        lastKeystrokeTimeRef.current = Date.now();

        if (!isTypingRef.current && value.trim().length > 0) {
            isTypingRef.current = true;
            socket.emit('sender_typing_start', { recipient_id, sender_id });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            const timeSinceLastKeystroke = Date.now() - lastKeystrokeTimeRef.current;
            if (timeSinceLastKeystroke >= 1500) {
                isTypingRef.current = false;
                socket.emit('sender_typing_stop', { recipient_id, sender_id });
            }
        }, 1500);
    }, [partner?.id, autoGrow]);

    // ========== SEND MESSAGE ==========
    const handleMessageSending = async (event) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }

        if (!message.trim() || !partner?.id) return;

        const sender_id = userId;
        const recipient_id = partner.id;

        try {
            const response = await sendMessageHandler({
                message,
                sender_id,
                recipient_id
            });

            const newMessage = response.message;

            setMessages(prevMessages => {
                const exists = prevMessages.some(m => m.id === newMessage?.id);
                if (exists) return prevMessages;
                return [...prevMessages, newMessage];
            });

            setMessage('');

            if (inputRef.current) {
                inputRef.current.style.height = '44px';
                inputRef.current.focus();
            }

            socket.emit('sender_typing_stop', { recipient_id, sender_id });

            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // ========== KEY DOWN HANDLER ==========
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const value = message;
            const cursorPosition = e.target.selectionStart;
            const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
            setMessage(newValue);

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.selectionStart = cursorPosition + 1;
                    inputRef.current.selectionEnd = cursorPosition + 1;
                }
            }, 10);
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessageSending(e);
        }
    }, [message]);

    // ========== EMOJI HANDLER ==========
    const handleEmojiClick = useCallback((emojiObject) => {
        setMessage(prevText => prevText + emojiObject.emoji);
        setShowPicker(false);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    }, []);

    // ========== RENDER MESSAGES ==========
    const renderMessages = useCallback(() => {
        if (!profiles?.length || !messages?.length) return null;

        let user0 = '';
        let user1 = '';
        let user2 = '';
        let message0 = {};
        let message1 = {};

        return messages.map((message, index) => {
            user0 = user1;
            user1 = message?.sender_id || '';
            user2 = messages[index + 1]?.sender_id || '';

            message0 = message1;
            message1 = message;

            const showName = writeName(
                user1 || '',
                user2 || '',
                user0 || ''
            );

            const isSameSenderAsNext = isSame(user1, user2);
            const isOwn = isCurrentUser(userId, message.sender_id);
            const profile = getUserProfile(message.sender_id, profiles);
            const isSameDay = isSameDate(message0, message1);

            const { content, sent_at, delivered_at, read_at, id } = message;

            return (
                <Fragment key={id || index}>
                    {!isSameDay && (
                        <span className='w-fit self-center bg-slate-400 text-amber-50 px-3 my-5 rounded-md text-center'>
                            {formatMessageDate(sent_at)}
                        </span>
                    )}

                    <div
                        className={`chat ${isOwn ? 'chat-end' : 'chat-start'} 
                            ${showName && isSameDay ? 'mt-3' : ''} active:bg-neutral-100`}
                        data-message-id={id}
                    >
                        {isDetails && !isSameSenderAsNext && profile?.pictures?.[0] && (
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                    <img
                                        alt='Profile Picture'
                                        src={profile.pictures[0]}
                                    />
                                </div>
                            </div>
                        )}
                        {(!isDetails || isSameSenderAsNext) && (
                            <div className='block w-10' />
                        )}

                        <div className="chat-header">
                            {isDetails && showName && profile?.name && (
                                <span>{profile.name}</span>
                            )}
                        </div>
                        <div className={`flex flex-col chat-bubble ${isOwn ? '' : 'chat-bubble-error'}`}>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
                            <div className='flex self-end'>
                                <time className="text-xs opacity-50">{timeTo12Hour(sent_at)}</time>
                                {isOwn && (
                                    <span className="text-xs ml-2 opacity-70 inline-block">
                                        {sent_at && !delivered_at && !read_at && <LiaCheckSolid color='gray' size={15} />}
                                        {sent_at && delivered_at && !read_at && <LiaCheckDoubleSolid color='gray' size={15} />}
                                        {sent_at && delivered_at && read_at && <LiaCheckDoubleSolid color='blue' size={15} />}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isOwn && (
                            <>
                                {sent_at && delivered_at && read_at && (
                                    <div className="chat-footer opacity-50">
                                        Read at {formatMessageDate(read_at, true)}
                                    </div>
                                )}
                                {sent_at && delivered_at && !read_at && (
                                    <div className="chat-footer opacity-50">
                                        Delivered at {formatMessageDate(delivered_at, true)}
                                    </div>
                                )}
                                {sent_at && !delivered_at && !read_at && (
                                    <div className="chat-footer opacity-50">
                                        Sent at {formatMessageDate(sent_at, true)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Fragment>
            );
        });
    }, [isDetails, messages, profiles]);

    // ========== RENDER ==========
    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className='w-full h-full flex flex-col'>
                <div
                    ref={chatContainerRef}
                    className="relative w-full h-full flex flex-col 
                        select-none fade-in px-4 py-2 bg-base-100 scroll-bar"
                >
                    {renderMessages()}

                    {isTyping && (
                        <div className="chat chat-start">
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

                <section className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleMessageSending} className="flex flex-col gap-2">
                        {showPicker && (
                            <div className="relative">
                                <div className="absolute bottom-full mb-2 z-50">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        width={300}
                                        height={400}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowPicker(val => !val)}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors self-center"
                            >
                                {showPicker ? '✕' : '😊'}
                            </button>

                            <textarea
                                ref={inputRef}
                                value={message}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message... (Shift+Enter for new line)"
                                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-all resize-none"
                                style={{
                                    minHeight: '44px',
                                    maxHeight: '200px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.5'
                                }}
                                rows={1}
                            />

                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 self-center"
                                disabled={!message.trim()}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </MainLayout>
    );
}