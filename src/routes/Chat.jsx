import { useState, useRef, useCallback, useEffect } from 'react';
import { Heart, Asterisk, Radar, Star } from 'lucide-react';
import { io } from 'socket.io-client';

import { CHATS_TITLE, CHATS_TEXT, baseURL, userId, socket } from '../utils/constants';
import { writeName } from '../utils/functions';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';
import { sendMessageHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chat() {
    const initialMessages = [
        { id: 1, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: 'Hello Joshua' },
        { id: 2, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: 'Hello Emmanuel' },
        { id: 3, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: "It's been a long time" },
        { id: 4, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: 'How are you doing.' },
        { id: 5, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: false, seenAt: null, content: "I'm fine. What about you" },
        { id: 6, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: false, seenAt: null, content: "I'm fine. What about you" },
        { id: 7, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: "I'm also fine. Thanks for asking." },
        { id: 8, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: "I'm also fine. Thanks for asking." },
        { id: 9, sender_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', recipient_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', sent: true, isDelivered: true, deliveredAt: '13/08/2026', seen: true, seenAt: '13/08/2026', content: "I'm also fine. Thanks for asking." },
        { id: 10, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, isDelivered: false, deliveredAt: null, seen: false, seenAt: null, content: 'What are you doing at the moment?' },
        { id: 11, sender_id: '0a31f97a-99ce-457e-9ac4-c9a01955bcbd', recipient_id: '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31', sent: true, isDelivered: false, deliveredAt: null, seen: false, seenAt: null, content: 'What are you doing at the moment?' },
    ];

    const [profiles, setProfiles] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(initialMessages.sort((a, b) => Number(a.id) - Number(b.id)));

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    let user0 = '';
    let user1 = '';
    let user2 = '';

    const isDetails = true;
    const userId1 = '0a31f97a-99ce-457e-9ac4-c9a01955bcbd';
    const userId2 = '39239e36-4b8f-45ad-8dc9-2cad0fcd9a31';

    const isCurrentUser = (currentUserId, otherUserId) => currentUserId.toString() === otherUserId.toString();
    const getUserProfile = (userId, profiles) => profiles.find(profile => profile?.id.toString() === userId.toString());
    const getRecipientId = userId => userId.toString() === userId1.toString() ? userId2 : userId1;
    const isSame = (user1, user2) => user1.toString() === user2?.toString();

    socket.on('new_message', ({ message }) => {
        if (message && isSame(message.recipient_id, userId))
            setMessages(prevMessages => {
                const exists = prevMessages.some(m => m.id === message.id);
                if (exists) return prevMessages;
                return [...prevMessages, message].sort((a, b) => Number(a.id) - Number(b.id))
            });
    });

    async function handleMessageSending(event) {
        event.preventDefault();

        const sender_id = userId;
        const recipient_id = getRecipientId(userId);
        const messages_length = messages.length;

        const response = await sendMessageHandler({ message, sender_id, recipient_id, messages_length });
        // socket.emit('join_conversation', { conversationId });
        const newMessage = response.message
        setMessages(prevMessages => {
            const exists = prevMessages.some(m => m.id === newMessage.id);
            if (exists) return prevMessages;
            return [...prevMessages, newMessage].sort((a, b) => Number(a.id) - Number(b.id))
        });
        setMessage('');
    }

    async function typingHandler(event) {
        event.preventDefault();


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

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className='w-full h-full flex flex-col'>
                <div ref={chatContainerRef} className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 py-2 overflow-y-scroll">
                    {profiles?.length > 0 && messages?.length > 0 && messages.map((message, index) => {
                        user0 = user1;
                        user1 = message.sender_id;
                        user2 = messages[index + 1]?.sender_id || '';

                        const showName = writeName(user1, user2, user0);

                        const isSameSenderAsNext = isSame(user1, user2);
                        const isOwn = isCurrentUser(userId, message.sender_id);
                        const profile = getUserProfile(message.sender_id, profiles);


                        return (
                            <div key={index} className={`chat ${isOwn ? 'chat-end' : 'chat-start'} active:bg-neutral-100`}>

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
                                    <div className='block w-10'></div>}


                                <div className="chat-header">
                                    {/* {isDetails && !isSameSenderAsNext && <span>{getUserProfile(message.sender_id, profiles).name}</span>} */}
                                    {isDetails && showName && <span>{profile.name}</span>}
                                    <time className="text-xs opacity-50">12:45</time>
                                </div>
                                <div className="chat-bubble">{message.content}</div>
                                {isOwn && <>
                                    {message.sent && message.isDelivered && message.seen && <div className="chat-footer opacity-50">Seen at 12:46</div>}
                                    {message.sent && message.isDelivered && !message.seen && <div className="chat-footer opacity-50">Delivered</div>}
                                    {message.sent && !message.isDelivered && !message.seen && <div className="chat-footer opacity-50">Sent</div>}
                                </>}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <section>
                    <form action="" onSubmit={handleMessageSending}>
                        <input className='w-full border border-slate-200 resize-none' value={message}
                            onChange={e => setMessage(e.target.value)} onInput={typingHandler} />
                    </form>
                </section>
            </div>
        </MainLayout>
    );
}