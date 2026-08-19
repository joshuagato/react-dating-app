import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router';
import { LiaCheckDoubleSolid, LiaCheckSolid } from 'react-icons/lia';

import { CHATS_TITLE, CHATS_TEXT, baseURL, userId } from '../utils/constants';
import { buildPictureUrl, formatMessageDate, isCurrentUser } from '../utils/functions';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';
import { getChatsHandler } from '../tanstack/chat';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chats() {
    const [profiles, setProfiles] = useState([]);
    const [chats, setChats] = useState([]);

    // Fetch potential matches on mount
    useEffect(() => {
        (async () => {
            try {
                const chatsResponse = await getChatsHandler();
                const chats = chatsResponse.chats;

                if (chats.length > 0)
                    setChats(chats);

                const response = await getPotentialMatchProfilesHandler();
                const fetchedProfiles = response.userProfiles;

                if (fetchedProfiles.length > 0) {
                    setProfiles(fetchedProfiles);
                }
            } catch (error) {
                console.error("Failed to fetch match profiles:", error);
            }
        })();
    }, []);

    useEffect(() => {
        // console.log({ profiles });
    }, [profiles]);

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 sm:px-8 py-2 overflow-y-scroll">
                <div className='w-full h-full grid grid-cols-1 gap-5'>
                    {chats.length > 0 && chats.map((chat, index) => {

                        const { id: chat_id, myself, partner, unread_message_count,
                            last_message: { content, sender_id, sent_at, delivered_at, read_at } } = chat;

                        const { name, picture } = partner;
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
                                                <span className='block w-2 h-2 bg-green-700 rounded-full'></span>
                                            </h1>
                                            <p className='w-full text-[12px] sm:text-[13px]'
                                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                <span className='flex items-center'>
                                                    {isOwn && (
                                                        <span className="text-xs text-gray-500 mr-2 opacity-70 inline-block">
                                                            {sent_at && !delivered_at && !read_at && <LiaCheckSolid color='gray' size={15} />}
                                                            {sent_at && delivered_at && !read_at && <LiaCheckDoubleSolid color='gray' size={15} />}
                                                            {sent_at && delivered_at && read_at && <LiaCheckDoubleSolid color='blue' size={15} />}
                                                        </span>
                                                    )}
                                                    <span>{content}</span>
                                                </span>
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