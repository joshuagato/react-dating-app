// Chat.jsx
import { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LiaCheckSolid, LiaCheckDoubleSolid } from 'react-icons/lia';
import { CornerUpLeft, Info, X, Crown, Copy, Edit2, SendHorizontal, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Capacitor } from '@capacitor/core';

import { CHAT_TITLE, userId, socket, baseURL, premiumPath } from '../utils/constants';
import {
    writeName, isSameDate, formatMessageDate, timeTo12Hour, isCurrentUser,
    getUserProfile, isSame, buildPictureUrl, encryptText, decryptText
} from '../utils/functions';
import {
    getChatMessagesHandler,
    markMessageAsReadHandler,
    sendMessageHandler,
    editMessageHandler,
} from '../tanstack/chat';
import { getPremiumStatusHandler } from '../tanstack/user';

import ChatLayout from '../components/Layouts/ChatLayout';
import HelmetHeader from '../components/HelmetHeader';

/* ------------------------------------------------------------------ */
/* Injected CSS                                                       */
/* ------------------------------------------------------------------ */
const chatStyles = `
.typing-dots { display: inline-flex; gap: 3px; align-items: center; }
.typing-dots .dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: currentColor; opacity: 0.5;
    animation: typing-blink 1.2s infinite ease-in-out;
}
.typing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-blink {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-2px); }
}
.emoji-picker-anchor {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 8px;
    z-index: 50;
}
`;

/* ------------------------------------------------------------------ */
/* Timestamp helper — combines the date with a 12-hour clock          */
/* ------------------------------------------------------------------ */
const formatFullTimestamp = (iso) => {
    if (!iso) return null;
    const datePart = formatMessageDate(iso, false, true);
    const timePart = timeTo12Hour(iso);
    if (!datePart && !timePart) return null;
    return `${datePart} · ${timePart}`;
};

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
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

    const {
        chat_id,
        myself,
        partner = {
            id: '',
            name: '',
            picture: '',
            is_online: null,
            last_seen: null,
        },
    } = location.state || {};

    const isNative = Capacitor.isNativePlatform();

    /* ---------------------------------------------------------------- */
    /* Premium status                                                   */
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
    /* Redirect if no chat context                                      */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        if (!chat_id && !partner.id && !partner.name) {
            navigate('/chats');
        }
    }, [chat_id, navigate]);

    /* ---------------------------------------------------------------- */
    /* Refs                                                             */
    /* ---------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------- */
    /* Scroll helpers                                                   */
    /* ---------------------------------------------------------------- */
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    }, []);

    const scrollToMessage = useCallback((targetId) => {
        if (!targetId || !chatContainerRef.current) return;

        const targetElement = chatContainerRef.current.querySelector(
            `[data-message-id="${targetId}"]`
        );
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

    /* ---------------------------------------------------------------- */
    /* Mark as read                                                     */
    /* ---------------------------------------------------------------- */
    const markMessageAsRead = useCallback(async (msg) => {
        if (processedMessageIdsRef.current.has(msg.id)) return;
        if (isCurrentUser(userId, msg.sender_id)) return;
        if (msg.read_at) return;

        try {
            processedMessageIdsRef.current.add(msg.id);
            await markMessageAsReadHandler(msg.id);

            setMessages((prevMessages) =>
                prevMessages.map((m) =>
                    m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m
                )
            );
        } catch (error) {
            processedMessageIdsRef.current.delete(msg.id);
            console.error('Failed to mark message as read:', error);
        }
    }, []);

    /* ---------------------------------------------------------------- */
    /* Intersection observer                                            */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const messageId = entry.target.dataset.messageId;
                        if (messageId) {
                            const msg = messages.find((m) => m.id === messageId);
                            if (msg) markMessageAsRead(msg);
                        }
                    }
                });
            },
            { root: chatContainerRef.current, rootMargin: '0px', threshold: 0.3 }
        );

        const messageElements =
            chatContainerRef.current?.querySelectorAll('[data-message-id]');
        if (messageElements) {
            messageElements.forEach((el) => observerRef.current.observe(el));
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [messages, markMessageAsRead]);

    /* ---------------------------------------------------------------- */
    /* Fetch initial messages                                           */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const messagesResponse = await getChatMessagesHandler(chat_id);
                if (messagesResponse?.messages) {
                    setMessages(messagesResponse.messages);
                }

                setTimeout(() => {
                    if (chatContainerRef.current && chat_id) {
                        const savedPosition = localStorage.getItem(
                            `chat_scroll_${chat_id}`
                        );
                        if (savedPosition !== null) {
                            chatContainerRef.current.scrollTop = parseInt(
                                savedPosition,
                                10
                            );
                        }
                    }
                }, 100);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        if (chat_id) fetchData();
    }, [chat_id]);

    /* ---------------------------------------------------------------- */
    /* Socket listeners                                                 */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        const handleNewMessage = ({ message: newMsg }) => {
            if (
                newMsg &&
                isSame(newMsg.recipient_id, userId) &&
                isSame(newMsg.chat_id, chat_id)
            ) {
                setMessages((prevMessages) => {
                    const exists = prevMessages.some((m) => m.id === newMsg.id);
                    if (exists) return prevMessages;
                    return [...prevMessages, newMsg];
                });
            }
        };

        const handleMessageEdited = ({ message: editedMsg }) => {
            if (editedMsg && isSame(editedMsg.chat_id, chat_id)) {
                setMessages((prevMessages) =>
                    prevMessages.map((m) => (m.id === editedMsg.id ? editedMsg : m))
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
                setMessages((prevMessages) =>
                    prevMessages.map((msg) => (msg.id === delMsg.id ? delMsg : msg))
                );
            }
        };

        const handleMessageRead = ({ message: readMsg }) => {
            if (readMsg && isSame(readMsg.sender_id, userId)) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) => (msg.id === readMsg.id ? readMsg : msg))
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

    /* ---------------------------------------------------------------- */
    /* Cleanup timers                                                   */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        };
    }, []);

    /* ---------------------------------------------------------------- */
    /* Auto-grow textarea                                               */
    /* ---------------------------------------------------------------- */
    const autoGrow = useCallback((element) => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 200) + 'px';
    }, []);

    /* ---------------------------------------------------------------- */
    /* Typing handler                                                   */
    /* ---------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------- */
    /* Send or edit                                                     */
    /* ---------------------------------------------------------------- */
    const handleMessageSending = async (event) => {
        if (event?.preventDefault) event.preventDefault();
        if (!message.trim() || !partner?.id) return;

        const sender_id = userId;
        const recipient_id = partner.id;

        try {
            const encryptedContent = encryptText(message);

            if (editingMessage) {
                const response = await editMessageHandler({
                    message_id: editingMessage.id,
                    content: encryptedContent,
                    sender_id,
                });

                if (response?.success) {
                    setMessages((prevMessages) =>
                        prevMessages.map((m) =>
                            m.id === editingMessage.id ? response.message : m
                        )
                    );
                }
                setEditingMessage(null);
            } else {
                const response = await sendMessageHandler({
                    message: encryptedContent,
                    sender_id,
                    recipient_id,
                    reply_to_id: replyingTo ? replyingTo.id : null,
                });

                const newMessage = response.message;
                setMessages((prevMessages) => {
                    const exists = prevMessages.some((m) => m.id === newMessage?.id);
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
            console.error('Failed to send/edit message:', error);
        }
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setMessage('');
        if (inputRef.current) inputRef.current.style.height = '44px';
    };

    /* ---------------------------------------------------------------- */
    /* Key down                                                         */
    /* ---------------------------------------------------------------- */
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                const value = message;
                const cursorPosition = e.target.selectionStart;
                const newValue =
                    value.slice(0, cursorPosition) + '\n' + value.slice(cursorPosition);
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
        },
        [message]
    );

    /* ---------------------------------------------------------------- */
    /* Emoji                                                            */
    /* ---------------------------------------------------------------- */
    const handleEmojiClick = useCallback((emojiObject) => {
        setMessage((prevText) => prevText + emojiObject.emoji);
        setShowPicker(false);
        setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);
    }, []);

    /* ---------------------------------------------------------------- */
    /* Context menu handlers                                            */
    /* ---------------------------------------------------------------- */
    const handleOpenContextMenu = (msg) => setActiveActionMessage(msg);

    const handleSelectReply = (msg) => {
        setReplyingTo(msg);
        setActiveActionMessage(null);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleSelectEdit = async (msg) => {
        setActiveActionMessage(null);
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
        } else {
            setEditingMessage(msg);
            const plainContent = decryptText(msg.content);
            setMessage(plainContent);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const handleSelectDetails = (msg) => {
        setActiveActionMessage(null);
        // Details is only offered on your own messages, and only for premium.
        // The context menu already hides the button for partner messages, but
        // guard here too in case the menu is ever triggered another way.
        if (!isCurrentUser(userId, msg.sender_id)) return;
        if (isPremium === null) return;
        if (!isPremium) {
            setShowPremiumModal(true);
        } else {
            setDetailsModalMessage(msg);
        }
    };

    const handleCopyMessage = async (msg) => {
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

    /* ---------------------------------------------------------------- */
    /* Message interaction (double-click / long press)                  */
    /* ---------------------------------------------------------------- */
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

    /* ---------------------------------------------------------------- */
    /* Render                                                           */
    /* ---------------------------------------------------------------- */
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
            const { name } = profile;

            const { content, sent_at, delivered_at, read_at, id, reply_to_id, edited_at } = msg;
            const isHighlighted = highlightedMessageId === id;

            const repliedMessage = reply_to_id
                ? messages.find((m) => m.id === reply_to_id)
                : null;
            const repliedSenderProfile = repliedMessage
                ? getUserProfile(repliedMessage.sender_id, [myself, partner])
                : null;
            const decryptedRepliedContent = repliedMessage
                ? decryptText(repliedMessage.content)
                : null;

            const bubbleBase = isOwn
                ? 'bg-[#2b5278] text-white'
                : 'bg-white text-gray-900 border border-gray-200';

            return (
                <Fragment key={id || index}>
                    {!isSameDay && (
                        <span className="self-center text-[11px] font-medium text-gray-600 bg-white/70 backdrop-blur-sm px-3 py-1 my-3 rounded-full shadow-sm">
                            {formatMessageDate(sent_at)}
                        </span>
                    )}

                    <div
                        className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} ${showName && isSameDay ? 'mt-3' : 'mt-1'
                            }`}
                    >
                        <div
                            className="flex flex-col max-w-[85%] sm:max-w-[70%]"
                            style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}
                        >
                            {!isOwn && showName && isSameDay && name && (
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 px-2">
                                    {name}
                                </span>
                            )}

                            <div
                                className={`relative px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${bubbleBase} ${isHighlighted ? 'ring-4 ring-amber-400 shadow-lg' : ''
                                    } cursor-pointer transition-all`}
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
                                {repliedMessage && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            scrollToMessage(repliedMessage.id);
                                        }}
                                        className={`mb-1.5 rounded-md border-l-[3px] px-2 py-1 text-[11px] cursor-pointer ${isOwn
                                            ? 'bg-white/15 border-white/70 text-white/90'
                                            : 'bg-gray-100 border-blue-500 text-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`font-semibold block ${isOwn ? 'text-white' : 'text-blue-600'
                                                }`}
                                        >
                                            {repliedSenderProfile?.name || 'User'}
                                        </span>
                                        <p className="line-clamp-2 opacity-90">
                                            {decryptedRepliedContent}
                                        </p>
                                    </div>
                                )}

                                <span
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {decryptText(content)}
                                </span>

                                <div
                                    className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-500'
                                        }`}
                                >
                                    {edited_at && (
                                        <span className="italic opacity-80">edited</span>
                                    )}

                                    <span>{timeTo12Hour(sent_at)}</span>

                                    {isOwn && isPremium && (
                                        <span className="inline-block">
                                            {sent_at && !delivered_at && !read_at && (
                                                <LiaCheckSolid
                                                    color="rgba(255,255,255,0.7)"
                                                    size={14}
                                                />
                                            )}
                                            {sent_at && delivered_at && !read_at && (
                                                <LiaCheckDoubleSolid
                                                    color="rgba(255,255,255,0.7)"
                                                    size={14}
                                                />
                                            )}
                                            {sent_at && delivered_at && read_at && (
                                                <LiaCheckDoubleSolid
                                                    color="#4ade80"
                                                    size={14}
                                                />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Fragment>
            );
        });
    }, [messages, myself, partner, isPremium, highlightedMessageId, scrollToMessage]);

    return (
        <ChatLayout
            partnerId={partner.id}
            partnerName={partner.name}
            partnerAge={partner.age}
            partnerPicture={partner.picture}
            chat_id={chat_id}
            lastSeen={partner.last_seen}
            onlineStatus={partner.is_online}
        >
            <HelmetHeader pageTitle={CHAT_TITLE} />

            <style>{chatStyles}</style>

            <div className="w-full h-full flex flex-col relative">
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="w-full h-full flex flex-col select-none fade-in px-3 sm:px-4 py-2 scroll-bar"
                    style={{
                        backgroundColor: '#efeae2',
                        backgroundImage:
                            'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                >
                    {renderMessages()}
                    <div ref={messagesEndRef} />
                </div>

                {isTyping && (
                    <div className="px-4 pb-1">
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                            <span className="text-xs text-gray-500">typing</span>
                            <span className="typing-dots text-gray-500">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </span>
                        </div>
                    </div>
                )}

                <section
                    className={`relative p-3 sm:p-4 border-t border-gray-200 transition-colors ${editingMessage
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-white'
                        }`}
                >
                    {editingMessage && (
                        <div className="flex items-center justify-between bg-amber-100 border-l-4 border-amber-500 p-2.5 mb-2 rounded-r-lg">
                            <div className="text-xs overflow-hidden pr-2">
                                <span className="font-semibold text-amber-700 block flex items-center gap-1">
                                    <Edit2 size={12} /> Editing Message
                                </span>
                                <p className="text-gray-600 truncate mt-0.5">
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

                    {replyingTo && !editingMessage && (
                        <div className="flex items-center justify-between bg-gray-100 border-l-4 border-blue-500 p-2.5 mb-2 rounded-r-lg">
                            <div className="text-xs overflow-hidden pr-2">
                                <span className="font-semibold text-blue-600 block">
                                    Replying to{' '}
                                    {
                                        getUserProfile(replyingTo.sender_id, [
                                            myself,
                                            partner,
                                        ]).name
                                    }
                                </span>
                                <p className="text-gray-600 truncate mt-0.5">
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

                    {showPicker && (
                        <div className="emoji-picker-anchor">
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                width={300}
                                height={400}
                            />
                        </div>
                    )}

                    <form
                        onSubmit={handleMessageSending}
                        className="flex items-end gap-2"
                    >
                        <button
                            type="button"
                            onClick={() => setShowPicker((val) => !val)}
                            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
                            aria-label={showPicker ? 'Close emoji picker' : 'Open emoji picker'}
                        >
                            {showPicker ? <X size={22} /> : <Smile size={22} />}
                        </button>

                        <textarea
                            ref={inputRef}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                editingMessage
                                    ? 'Edit message...'
                                    : '(Shift+Enter for new line)'
                            }
                            className={`flex-1 border rounded-2xl px-4 py-2.5 focus:outline-none transition-all resize-none ${editingMessage
                                ? 'border-amber-400 focus:border-amber-600 bg-amber-50/30'
                                : 'border-slate-200 focus:border-blue-500'
                                }`}
                            style={{
                                minHeight: '44px',
                                maxHeight: '200px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: '1.5',
                            }}
                            rows={1}
                        />

                        <button
                            type="submit"
                            className={`w-11 h-11 flex items-center justify-center rounded-full text-white transition-colors disabled:opacity-50 flex-shrink-0 ${editingMessage
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            disabled={!message.trim()}
                            aria-label={editingMessage ? 'Save edit' : 'Send message'}
                        >
                            <SendHorizontal size={20} />
                        </button>
                    </form>
                </section>

                {showCopyToast && (
                    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in-up">
                        Copied to clipboard!
                    </div>
                )}

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

                            {isCurrentUser(userId, activeActionMessage.sender_id) && (
                                <>
                                    <button
                                        onClick={() => handleSelectEdit(activeActionMessage)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <Edit2 size={18} className="text-amber-500" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleSelectDetails(activeActionMessage)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <Info size={18} className="text-violet-500" />
                                        Details
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => handleCopyMessage(activeActionMessage)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Copy size={18} className="text-gray-500" />
                                Copy
                            </button>
                        </div>
                    </div>
                )}

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
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-gray-500">Sent:</span>
                                    <span className="font-semibold text-right">
                                        {formatFullTimestamp(
                                            detailsModalMessage.sent_at
                                        ) || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-gray-500">Delivered:</span>
                                    <span className="font-semibold text-right">
                                        {formatFullTimestamp(
                                            detailsModalMessage.delivered_at
                                        ) || 'Not delivered yet'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-gray-500">Read:</span>
                                    <span className="font-semibold text-blue-600 text-right">
                                        {formatFullTimestamp(
                                            detailsModalMessage.read_at
                                        ) || 'Unread'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Premium Feature
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Message editing and detailed read/delivery timestamps
                                are exclusive to Premium members. Upgrade to unlock
                                full access!
                            </p>

                            <button
                                onClick={() => {
                                    setShowPremiumModal(false);
                                    navigate(premiumPath);
                                }}
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