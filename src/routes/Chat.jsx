import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { useLocation } from 'react-router';
import EmojiPicker from 'emoji-picker-react';

import { CHATS_TITLE, CHATS_TEXT, baseURL, userId, socket } from '../utils/constants';
import {
    writeName, isSameDate, formatMessageDate, timeTo12Hour, isCurrentUser,
    getUserProfile, isSame
} from '../utils/functions';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';
import { getChatMessagesHandler, sendMessageHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import './chat.css';

export default function Chat() {
    const initialMessages = [
        { id: 1, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent_at: '2026-08-08', delivered_at: '2026-08-13', read_at: '2026-08-13', content: 'Hello Joshua' },
        { id: 2, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-13', delivered_at: '2026-08-13', read_at: '2026-08-13', content: 'Hello Emmanuel' },
        { id: 3, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-13', delivered_at: '2026-08-13', read_at: '2026-08-13', content: "It's been a long time" },
        { id: 4, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-14', delivered_at: '2026-08-14', read_at: '2026-08-13', content: 'How are you doing.' },
        { id: 5, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent_at: '2026-08-14', delivered_at: '2026-08-14', read_at: null, content: "I'm fine. What about you" },
        { id: 6, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent_at: '2026-08-14', delivered_at: '2026-08-14', read_at: null, content: "I'm fine. What about you" },
        { id: 7, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-14', delivered_at: '2026-08-14', read_at: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 8, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-15', delivered_at: '2026-08-15', read_at: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 9, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent_at: '2026-08-15', delivered_at: '2026-08-15', read_at: '2026-08-13', content: "I'm also fine. Thanks for asking." },
        { id: 10, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent_at: '2026-08-15', delivered_at: null, read_at: null, content: 'What are you doing at the moment?' },
        { id: 11, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent_at: '2026-08-15', delivered_at: null, read_at: null, content: 'What are you doing at the moment?' },
    ];

    const [profiles, setProfiles] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(initialMessages.sort((a, b) => Number(a.id) - Number(b.id)));
    const [isTyping, setIsTyping] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const location = useLocation();

    const { chat_id, myself, partner } = location.state;
    console.log({ chat_id, myself, partner });

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    const isDetails = true;

    const handleEmojiClick = emojiObject => {
        setMessage((prevText) => prevText + emojiObject.emoji);
        setShowPicker(false);
        // Focus input after emoji selection
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    };

    const typingTimeoutRef = useRef(null);
    const lastKeystrokeTimeRef = useRef(0);
    const isTypingRef = useRef(false);

    // Socket event listeners
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
            socket.off('message_read', handleMessageRead);
        };
    }, []);

    // Fetch potential matches on mount
    useEffect(() => {
        (async () => {
            try {
                const messagesResponse = await getChatMessagesHandler(chat_id);
                const messages = messagesResponse.messages;
                if (messages.length > 0) setMessages(prevMessages => [...prevMessages, ...messages])

                const response = await getPotentialMatchProfilesHandler();
                const fetchedProfiles = response?.userProfiles || [];
                if (fetchedProfiles.length > 0) setProfiles(fetchedProfiles);

            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, [chat_id]);

    // Auto-scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    }, []);

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    });

    // Cleanup typing timer on component unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const autoGrow = element => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 200) + 'px';
    };

    // Debounced Typing Handler
    const handleInputChange = e => {
        const value = e.target.value;
        setMessage(value);
        autoGrow(e.target);

        const recipient_id = partner.id;
        if (!recipient_id) return;

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

    // ========== HANDLE KEY DOWN (Enter / Shift+Enter) ==========
    const handleKeyDown = e => {
        // Shift + Enter: Add new line by inserting a line break character
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const value = message;
            const cursorPosition = e.target.selectionStart;

            // Insert newline at cursor position
            const newValue = value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
            setMessage(newValue);

            // Set cursor position after the newline
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.selectionStart = cursorPosition + 1;
                    inputRef.current.selectionEnd = cursorPosition + 1;
                }
            }, 10);
            return;
        }

        // Enter without Shift: Send message
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessageSending(e);
        }
    };

    async function handleMessageSending(event) {
        // If it's a keyboard event, prevent default
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        if (!message.trim()) return;

        const sender_id = userId;
        const recipient_id = partner.id;

        const response = await sendMessageHandler({ message, sender_id, recipient_id });
        const newMessage = response.message

        setMessages(prevMessages => {
            const exists = prevMessages.some(m => m.id === newMessage?.id);
            if (exists) return prevMessages;
            return [...prevMessages, newMessage].sort((a, b) => Number(a.id) - Number(b.id))
        });
        setMessage('');

        // Reset the textarea height to initial state
        if (inputRef.current) {
            inputRef.current.style.height = '44px'; // Reset to minHeight
        }

        socket.emit('sender_typing_stop', { recipient_id });
        // Focus input after sending
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);
    }

    async function handleLoad(event, message) {
        event.preventDefault();

        const isOwn = isCurrentUser(userId, message.sender_id);

        if (!isOwn) {
            setTimeout(() => {
                setMessages(prevMessages => {
                    const new_array = prevMessages.map(msg => {
                        if (!msg.delivered_at)
                            msg.delivered_at = new Date();
                        msg.read_at = new Date();
                        return msg;
                    });

                    const sender_id = message.sender_id;
                    socket.emit('show_sender_message_read', { sender_id, new_array });
                    return new_array;
                });
            }, 3000);
        }
    }

    // Memoize the message rendering to prevent unnecessary re-renders
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

            // Safe check for writeName - ensure all values are valid
            const showName = writeName(
                user1 || '',
                user2 || '',
                user0 || ''
            );

            const isSameSenderAsNext = isSame(user1, user2);
            const isOwn = isCurrentUser(userId, message.sender_id);
            const profile = getUserProfile(message.sender_id, profiles);
            const isSameDay = isSameDate(message0, message1);

            const { content, sent_at, delivered_at, read_at } = message;

            return (
                <Fragment key={index || message.id}>
                    {!isSameDay && (
                        <span className='w-fit self-center bg-slate-400 text-amber-50 px-3 my-5 rounded-md text-center'>
                            {formatMessageDate(sent_at)}
                        </span>
                    )}

                    <div
                        className={`chat ${isOwn ? 'chat-end' : 'chat-start'} 
                        ${showName && isSameDay ? 'mt-3' : ''} active:bg-neutral-100`}
                        onLoad={(event) => { handleLoad(event, message) }}
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
                                        {sent_at && !delivered_at && !read_at && <span>✓</span>}
                                        {sent_at && delivered_at && !read_at && <span className=''>✓✓</span>}
                                        {sent_at && delivered_at && read_at && (
                                            <span className="text-sky-600 font-bold">✓✓</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isOwn && (
                            <>
                                {sent_at && delivered_at && read_at && <div className="chat-footer opacity-50">
                                    Read at {formatMessageDate(read_at, true)}
                                </div>}
                                {sent_at && delivered_at && !read_at && <div className="chat-footer opacity-50">
                                    Delivered at {formatMessageDate(delivered_at, true)}
                                </div>}
                                {sent_at && !delivered_at && !read_at && <div className="chat-footer opacity-50">
                                    Sent at {formatMessageDate(sent_at, true)}
                                </div>}
                            </>
                        )}
                    </div>
                </Fragment>
            );
        });
    }, [isDetails, messages, profiles]);

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className='w-full h-full flex flex-col'>
                <div ref={chatContainerRef} className="relative w-full h-full flex flex-col 
                    select-none fade-in px-4 py-2 bg-base-100 scroll-bar">
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
                                onClick={() => setShowPicker((val) => !val)}
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