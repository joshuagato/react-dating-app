import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LiaCheckSolid, LiaCheckDoubleSolid } from "react-icons/lia";
import { CornerUpLeft, Info, X, Crown, Copy, Edit2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Capacitor } from '@capacitor/core';

import { CHAT_TITLE, userId, socket, baseURL } from '../utils/constants';
import {
    writeName, isSameDate, formatMessageDate, timeTo12Hour, isCurrentUser,
    getUserProfile, isSame, buildPictureUrl, encryptText, decryptText
} from '../utils/functions';
import { getChatMessagesHandler, markMessageAsReadHandler, sendMessageHandler, editMessageHandler } from '../tanstack/chat';

import ChatLayout from '../components/Layouts/ChatLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    // User context status
    const [isPremium] = useState(true);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    // const [decryptedMessages, setDecryptedMessages] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    // Popover Context Menu, Reply, Edit, & Highlight States
    const [activeActionMessage, setActiveActionMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [detailsModalMessage, setDetailsModalMessage] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const { chat_id, myself, partner = {
        id: '', name: '', picture: '',
        is_online: null, last_seen: null
    } } = location.state || {};

    const isNative = Capacitor.isNativePlatform();

    // Decrypt batch of messages for rendering
    useEffect(() => {
        let isMounted = true;
        const decryptAll = async () => {
            const map = {};
            for (const msg of messages) {
                if (msg.content) {
                    map[msg.id] = decryptText(msg.content);
                }
            }
            if (isMounted) {
                // setDecryptedMessages(map);
            }
        };

        if (messages.length > 0) {
            // decryptAll();
        }
        return () => { isMounted = false; };
    }, [messages]);

    // Redirect if no chat_id
    useEffect(() => {
        if (!chat_id && !partner.id && !partner.name) {
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
    const processedMessageIdsRef = useRef(new Set());
    const observerRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const clickCountRef = useRef(0);
    const clickTimeoutRef = useRef(null);

    const isDetails = true;

    // ========== SCROLL & HIGHLIGHT FUNCTIONS ==========
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    }, []);

    const scrollToMessage = useCallback((targetId) => {
        if (!targetId || !chatContainerRef.current) return;

        const targetElement = chatContainerRef.current.querySelector(`[data-message-id="${targetId}"]`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(targetId);

            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 1500);
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (chatContainerRef.current && chat_id) {
            const scrollTop = chatContainerRef.current.scrollTop;
            localStorage.setItem(`chat_scroll_${chat_id}`, scrollTop.toString());
        }
    }, [chat_id]);

    useEffect(() => {
        return () => {
            if (chatContainerRef.current && chat_id) {
                const scrollTop = chatContainerRef.current.scrollTop;
                localStorage.setItem(`chat_scroll_${chat_id}`, scrollTop.toString());
            }
        };
    }, [chat_id]);

    // ========== MESSAGE READ HANDLER ==========
    const markMessageAsRead = useCallback(async (msg) => {
        if (processedMessageIdsRef.current.has(msg.id)) return;
        if (isCurrentUser(userId, msg.sender_id)) return;
        if (msg.read_at) return;

        try {
            processedMessageIdsRef.current.add(msg.id);
            await markMessageAsReadHandler(msg.id);

            setMessages(prevMessages =>
                prevMessages.map(m =>
                    m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m
                )
            );
        } catch (error) {
            processedMessageIdsRef.current.delete(msg.id);
            console.error("Failed to mark message as read:", error);
        }
    }, []);

    // ========== INTERSECTION OBSERVER SETUP ==========
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.dataset.messageId;
                        if (messageId) {
                            const msg = messages.find(m => m.id === messageId);
                            if (msg) markMessageAsRead(msg);
                        }
                    }
                });
            },
            { root: chatContainerRef.current, rootMargin: '0px', threshold: 0.3 }
        );

        const messageElements = chatContainerRef.current?.querySelectorAll('[data-message-id]');
        if (messageElements) {
            messageElements.forEach(el => observerRef.current.observe(el));
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
                const messagesResponse = await getChatMessagesHandler(chat_id);
                if (messagesResponse?.messages) {
                    setMessages(messagesResponse.messages);
                }

                setTimeout(() => {
                    if (chatContainerRef.current && chat_id) {
                        const savedPosition = localStorage.getItem(`chat_scroll_${chat_id}`);
                        if (savedPosition !== null) {
                            chatContainerRef.current.scrollTop = parseInt(savedPosition, 10);
                        }
                    }
                }, 100);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        if (chat_id) fetchData();
    }, [chat_id]);

    // ========== SOCKET EVENT LISTENERS ==========
    useEffect(() => {
        const handleNewMessage = ({ message: newMsg }) => {
            if (newMsg && isSame(newMsg.recipient_id, userId) && isSame(newMsg.chat_id, chat_id)) {
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m.id === newMsg.id);
                    if (exists) return prevMessages;
                    return [...prevMessages, newMsg];
                });
            }
        };

        const handleMessageEdited = ({ message: editedMsg }) => {
            if (editedMsg && isSame(editedMsg.chat_id, chat_id)) {
                setMessages(prevMessages =>
                    prevMessages.map(m => m.id === editedMsg.id ? editedMsg : m)
                );
            }
        };

        const handlePartnerTyping = ({ recipient_id, isTyping: partnerTyping }) => {
            if (recipient_id && isSame(recipient_id, userId)) {
                setIsTyping(partnerTyping);
            }
        };

        const handleMessageDelivered = ({ message: delMsg }) => {
            if (delMsg && isSame(delMsg.sender_id, userId)) {
                setMessages(prevMessages =>
                    prevMessages.map(msg => msg.id === delMsg.id ? delMsg : msg)
                );
            }
        };

        const handleMessageRead = ({ message: readMsg }) => {
            if (readMsg && isSame(readMsg.sender_id, userId)) {
                setMessages(prevMessages =>
                    prevMessages.map(msg => msg.id === readMsg.id ? readMsg : msg)
                );
            }
        };

        socket.on('partner_typing', handlePartnerTyping);
        socket.on('new_message', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_delivered', handleMessageDelivered);
        socket.on('message_read', handleMessageRead);

        return () => {
            socket.off('partner_typing', handlePartnerTyping);
            socket.off('new_message', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_delivered', handleMessageDelivered);
            socket.off('message_read', handleMessageRead);
        };
    }, [chat_id]);

    // ========== CLEANUP TIMERS ==========
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        };
    }, []);

    // ========== AUTO-GROW TEXTAREA ==========
    const autoGrow = useCallback((element) => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 200) + 'px';
    }, []);

    // ========== TYPING HANDLER ==========
    const handleInputChange = (e) => {
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

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            const timeSinceLastKeystroke = Date.now() - lastKeystrokeTimeRef.current;
            if (timeSinceLastKeystroke >= 1500) {
                isTypingRef.current = false;
                socket.emit('sender_typing_stop', { recipient_id, sender_id });
            }
        }, 1500);
    };

    // ========== SEND OR EDIT MESSAGE ==========
    const handleMessageSending = async (event) => {
        if (event?.preventDefault) event.preventDefault();
        if (!message.trim() || !partner?.id) return;

        const sender_id = userId;
        const recipient_id = partner.id;

        try {
            const encryptedContent = encryptText(message);

            if (editingMessage) {
                // Editing mode
                const response = await editMessageHandler({
                    message_id: editingMessage.id,
                    content: encryptedContent,
                    sender_id
                });

                if (response?.success) {
                    setMessages(prevMessages =>
                        prevMessages.map(m => m.id === editingMessage.id ? response.message : m)
                    );
                }
                setEditingMessage(null);
            } else {
                // New message mode
                const response = await sendMessageHandler({
                    message: encryptedContent,
                    sender_id,
                    recipient_id,
                    reply_to_id: replyingTo ? replyingTo.id : null
                });

                const newMessage = response.message;
                setMessages(prevMessages => {
                    const exists = prevMessages.some(m => m.id === newMessage?.id);
                    if (exists) return prevMessages;
                    return [...prevMessages, newMessage];
                });
            }

            setMessage('');
            setReplyingTo(null);

            if (inputRef.current) {
                inputRef.current.style.height = '44px';
                inputRef.current.focus();
            }

            socket.emit('sender_typing_stop', { recipient_id, sender_id });
            setTimeout(() => scrollToBottom('smooth'), 100);
        } catch (error) {
            console.error("Failed to send/edit message:", error);
        }
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setMessage('');
        if (inputRef.current) inputRef.current.style.height = '44px';
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
    });

    // ========== EMOJI HANDLER ==========
    const handleEmojiClick = useCallback((emojiObject) => {
        setMessage(prevText => prevText + emojiObject.emoji);
        setShowPicker(false);
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);
    }, []);

    // ========== CONTEXT MENU HANDLERS ==========
    const handleOpenContextMenu = (msg) => setActiveActionMessage(msg);

    const handleSelectReply = (msg) => {
        setReplyingTo(msg);
        setActiveActionMessage(null);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleSelectEdit = async (msg) => {
        setActiveActionMessage(null);
        if (!isPremium) {
            setShowPremiumModal(true);
        } else {
            setEditingMessage(msg);
            // const plainContent = decryptedMessages[msg.id] || msg.content;
            const plainContent = decryptText(msg.content);
            setMessage(plainContent);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const handleSelectDetails = (msg) => {
        setActiveActionMessage(null);
        if (!isPremium) {
            setShowPremiumModal(true);
        } else {
            setDetailsModalMessage(msg);
        }
    };

    const handleCopyMessage = async (msg) => {
        // const plainText = decryptedMessages[msg.id] || msg.content;
        const plainText = decryptText(msg.content);
        try {
            await navigator.clipboard.writeText(plainText);
            setActiveActionMessage(null);
            setShowCopyToast(true);
            setTimeout(() => setShowCopyToast(false), 2000);
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = plainText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setActiveActionMessage(null);
            setShowCopyToast(true);
            setTimeout(() => setShowCopyToast(false), 2000);
        }
    };

    // ========== MESSAGE CLICK/LONG PRESS HANDLERS ==========
    const handleMessageInteraction = (e, msg) => {
        e.preventDefault();
        if (isNative) return;

        clickCountRef.current += 1;
        if (clickCountRef.current === 1) {
            clickTimeoutRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 300);
        } else if (clickCountRef.current >= 2) {
            clearTimeout(clickTimeoutRef.current);
            clickCountRef.current = 0;
            handleOpenContextMenu(msg);
        }
    };

    const handleTouchStart = (e, msg) => {
        if (!isNative) return;
        longPressTimerRef.current = setTimeout(() => {
            handleOpenContextMenu(msg);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleTouchMove = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // ========== RENDER MESSAGES ==========
    const renderMessages = useCallback(() => {
        if (!messages?.length) return null;

        let user0 = '';
        let user1 = '';
        let user2 = '';
        let message0 = {};
        let message1 = {};

        return messages.map((msg, index) => {
            user0 = user1;
            user1 = msg?.sender_id || '';
            user2 = messages[index + 1]?.sender_id || '';

            message0 = message1;
            message1 = msg;

            const showName = writeName(user1 || '', user2 || '', user0 || '');
            const isSameSenderAsNext = isSame(user1, user2);
            const isOwn = isCurrentUser(userId, msg.sender_id);
            const isSameDay = isSameDate(message0, message1);
            const profile = getUserProfile(msg.sender_id, [myself, partner]);
            const { name, picture } = profile;
            const pictureUrl = buildPictureUrl(baseURL, picture);

            const { content, sent_at, delivered_at, read_at, id, reply_to_id, edited_at } = msg;

            // const decryptedContent = decryptedMessages[id] || 'Decrypting...';
            const isHighlighted = highlightedMessageId === id;

            // Resolve replied parent message details
            const repliedMessage = reply_to_id ? messages.find(m => m.id === reply_to_id) : null;
            const repliedSenderProfile = repliedMessage ? getUserProfile(repliedMessage.sender_id, [myself, partner]) : null;
            // const decryptedRepliedContent = repliedMessage ? (decryptedMessages[repliedMessage.id] || repliedMessage.content) : null;
            const decryptedRepliedContent = repliedMessage ? (decryptText(repliedMessage.content)) : null;

            return (
                <Fragment key={id || index}>
                    {!isSameDay && (
                        <span className='w-fit self-center bg-slate-400 text-amber-50 px-3 my-5 rounded-md text-center text-xs'>
                            {formatMessageDate(sent_at)}
                        </span>
                    )}

                    <div
                        className={`chat ${isOwn ? 'chat-end' : 'chat-start'} 
                            ${showName && isSameDay ? 'mt-3' : ''} cursor-pointer relative group`}
                        data-message-id={id}
                        onClick={(e) => handleMessageInteraction(e, msg)}
                        onTouchStart={(e) => handleTouchStart(e, msg)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (!isNative) handleOpenContextMenu(msg);
                        }}
                    >
                        {isDetails && !isSameSenderAsNext && pictureUrl && (
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                    <img alt='Profile Picture' src={pictureUrl} />
                                </div>
                            </div>
                        )}
                        {(!isDetails || isSameSenderAsNext) && (
                            <div className='block w-10' />
                        )}

                        <div className="chat-header">
                            {isDetails && showName && name && (
                                <span>{name}</span>
                            )}
                        </div>

                        <div className={`flex flex-col chat-bubble ${isOwn ? '' : 'chat-bubble-error'} relative max-w-md transition-all duration-300 ${isHighlighted ? 'ring-4 ring-amber-400 scale-[1.02] shadow-lg' : ''
                            }`}>
                            {/* Attached Quoted Message Snippet */}
                            {repliedMessage && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        scrollToMessage(repliedMessage.id);
                                    }}
                                    className="mb-2 p-2 bg-black/20 hover:bg-black/30 transition-colors rounded border-l-4 border-amber-400 text-xs cursor-pointer select-none"
                                >
                                    <span className="font-semibold block text-amber-200">
                                        {repliedSenderProfile?.name || 'User'}
                                    </span>
                                    <p className="line-clamp-2 text-gray-200 italic">{decryptedRepliedContent}</p>
                                </div>
                            )}

                            {/* <span style={{ whiteSpace: 'pre-wrap' }}>{decryptedContent}</span> */}
                            <span style={{ whiteSpace: 'pre-wrap' }}>{decryptText(content)}</span>

                            <div className="flex items-center justify-end gap-1 mt-1">
                                {edited_at && (
                                    <span className="text-[10px] opacity-70 italic">edited</span>
                                )}

                                {/* Status Indicators */}
                                {isOwn && isPremium && (
                                    <>
                                        <span className="chat-footer opacity-50">{timeTo12Hour(sent_at)}</span>

                                        <span className="text-xs inline-block">
                                            {sent_at && !delivered_at && !read_at && <LiaCheckSolid color='gray' size={15} />}
                                            {sent_at && delivered_at && !read_at && <LiaCheckDoubleSolid color='gray' size={15} />}
                                            {sent_at && delivered_at && read_at && <LiaCheckDoubleSolid color='blue' size={15} />}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Fragment>
            );
        });
    }, [isDetails, messages, myself, partner, isPremium, highlightedMessageId, scrollToMessage]);

    // ========== RENDER ==========
    return (
        <ChatLayout partnerName={partner.name} partnerAge={partner.age} partnerPicture={partner.picture}
            chat_id={chat_id} lastSeen={partner.last_seen} onlineStatus={partner.is_online}>
            <HelmetHeader pageTitle={CHAT_TITLE} />

            <div className='w-full h-full flex flex-col relative'>
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="w-full h-full flex flex-col select-none fade-in px-4 py-2 bg-base-100 scroll-bar"
                >
                    {renderMessages()}
                    <div ref={messagesEndRef} />
                </div>

                {isTyping && (
                    <div className="chat chat-start px-4">
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

                {/* Input Toolbar Area */}
                <section className={`p-4 border-t border-gray-200 transition-colors ${editingMessage ? 'bg-amber-50/60 border-amber-300' : 'bg-white'}`}>
                    {/* Editing Attachment Bar */}
                    {editingMessage && (
                        <div className="flex items-center justify-between bg-amber-100 border-l-4 border-amber-500 p-2.5 mb-2 rounded-r-lg">
                            <div className="text-xs overflow-hidden pr-2">
                                <span className="font-semibold text-amber-700 block flex items-center gap-1">
                                    <Edit2 size={12} /> Editing Message
                                </span>
                                <p className="text-gray-600 truncate mt-0.5">
                                    {/* {decryptedMessages[editingMessage.id] || editingMessage.content} */}
                                    {decryptText(editingMessage.content)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-amber-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Replying Attachment Bar */}
                    {replyingTo && !editingMessage && (
                        <div className="flex items-center justify-between bg-gray-100 border-l-4 border-blue-500 p-2.5 mb-2 rounded-r-lg">
                            <div className="text-xs overflow-hidden pr-2">
                                <span className="font-semibold text-blue-600 block">
                                    Replying to {getUserProfile(replyingTo.sender_id, [myself, partner]).name}
                                </span>
                                <p className="text-gray-600 truncate mt-0.5">
                                    {/* {decryptedMessages[replyingTo.id] || replyingTo.content} */}
                                    {decryptText(replyingTo.content)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

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
                                placeholder={editingMessage ? "Edit message..." : "(Shift+Enter for new line)"}
                                className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none transition-all resize-none ${editingMessage
                                    ? 'border-amber-400 focus:border-amber-600 bg-amber-50/30'
                                    : 'border-slate-200 focus:border-blue-500'
                                    }`}
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
                                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 self-center ${editingMessage ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                disabled={!message.trim()}
                            >
                                {editingMessage ? 'Save' : 'Send'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Copy Toast Notification */}
                {showCopyToast && (
                    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-up">
                        Copied to clipboard!
                    </div>
                )}

                {/* Popover Action Menu Modal */}
                {activeActionMessage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
                        onClick={() => setActiveActionMessage(null)}
                    >
                        <div
                            className="bg-white rounded-2xl p-2 w-64 shadow-2xl border border-gray-100 space-y-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => handleSelectReply(activeActionMessage)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <CornerUpLeft size={18} className="text-blue-500" />
                                Reply
                            </button>

                            {/* Edit Option (Only available on own messages) */}
                            {isCurrentUser(userId, activeActionMessage.sender_id) && (
                                <button
                                    onClick={() => handleSelectEdit(activeActionMessage)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <Edit2 size={18} className="text-amber-500" />
                                    Edit
                                </button>
                            )}

                            <button
                                onClick={() => handleCopyMessage(activeActionMessage)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Copy size={18} className="text-gray-500" />
                                Copy
                            </button>
                            <button
                                onClick={() => handleSelectDetails(activeActionMessage)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Info size={18} className="text-violet-500" />
                                Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Premium Details Info Modal */}
                {detailsModalMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-gray-800">
                            <button
                                onClick={() => setDetailsModalMessage(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                                <Info size={20} className="text-violet-500" /> Message Details
                            </h3>

                            <div className="space-y-3 text-sm border-t border-gray-100 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Sent:</span>
                                    <span className="font-semibold">{detailsModalMessage.sent_at ? formatMessageDate(detailsModalMessage.sent_at, true) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Delivered:</span>
                                    <span className="font-semibold">{detailsModalMessage.delivered_at ? formatMessageDate(detailsModalMessage.delivered_at, true) : 'Not delivered yet'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Read:</span>
                                    <span className="font-semibold text-blue-600">{detailsModalMessage.read_at ? formatMessageDate(detailsModalMessage.read_at, true) : 'Unread'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Free User Premium Feature Upsell Modal */}
                {showPremiumModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative flex flex-col items-center">
                            <button
                                onClick={() => setShowPremiumModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500">
                                <Crown size={30} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Message editing and detailed read/delivery timestamps are exclusive to Premium members. Upgrade to unlock full access!
                            </p>

                            <button
                                onClick={() => navigate('/premium')}
                                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            >
                                <Crown size={18} />
                                Upgrade to Premium
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ChatLayout>
    );
}