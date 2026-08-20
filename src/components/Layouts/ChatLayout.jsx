// import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
    SlidersHorizontal, LocateFixed, Copy, Heart, MessageCircleCode, User,
    MoreHorizontal, Menu
} from 'lucide-react';
import { chatsPath, encountersPath, likesPath, nearbyPath, profilePath, socket, userId } from '../../utils/constants';
import { chooseColour, chooseTextColour, isSame, pathMatched } from '../../utils/functions';
import { getUnreadChatsCountHandler } from '../../tanstack/chat';
import { getNewLikesCountHandler } from '../../tanstack/encounter';

import AdSense from '../AdSense';

const MainLayout = ({ children, partnerName, partnerAge, lastSeen, onlineStatus, chat_id }) => {
    const currentPathName = useLocation().pathname;
    const [unreadChatsCount, setUnreadChatsCount] = useState(0);
    const [newLikesCount, setNewLikesCount] = useState(0);

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
            if (message && isSame(message.recipient_id, userId) && !isSame(message.chat_id, chat_id)) {
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
    }, []);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 select-none">
            <div className='relative h-full w-full lg:max-w-xl flex flex-col'>

                {/* Header Section: 7vh */}
                <section className="w-full h-[7vh] flex justify-between items-center bg-white py-2 px-4 z-10 border-b border-[#e2e8f0]">
                    <div className='bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <span>{partnerName}, {partnerAge}</span>
                            {onlineStatus && <span className='block w-2 h-2 bg-green-700 rounded-full'></span>}
                        </h1>
                        {lastSeen && <p className='text-sm'>{lastSeen}</p>}
                    </div>
                    {pathMatched(encountersPath, currentPathName) &&
                        <div className='flex gap-4'>
                            <article className='cursor-pointer'>
                                <div onClick={() => document.getElementById('my_modal_3').showModal()}>
                                    <SlidersHorizontal />
                                </div>
                                <dialog id="my_modal_3" className="modal">
                                    <div className="modal-box">
                                        <form method="dialog">
                                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                                        </form>
                                        <h3 className="font-bold text-lg">Hello!</h3>
                                        <p className="py-4">Press ESC key or click on ✕ button to close</p>
                                        <input type="range" min={0} max="100" defaultValue="30" className="range range-xs" />
                                    </div>
                                </dialog>
                            </article>

                            <article className="dropdown dropdown-end">
                                <div tabIndex={0} role="button" className="cursor-pointer"><MoreHorizontal /></div>
                                <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                    <li><a>Item 1</a></li>
                                    <li><a>Item 2</a></li>
                                </ul>
                            </article>

                            <article className="drawer">
                                <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                                <div className="drawer-content">
                                    <label htmlFor="my-drawer-1" className="cursor-pointer"><Menu /></label>
                                </div>
                                <div className="drawer-side z-50">
                                    <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
                                    <ul className="menu bg-base-200 min-h-full w-80 p-4">
                                        <li><a>Sidebar Item 1</a></li>
                                        <li><a>Sidebar Item 2</a></li>
                                    </ul>
                                </div>
                            </article>
                        </div>
                    }

                    {pathMatched(nearbyPath, currentPathName) &&
                        <div className='flex gap-4'>
                            <article className='cursor-pointer'>
                                <SlidersHorizontal />
                            </article>
                            <article className='cursor-pointer'>
                                <MoreHorizontal />
                            </article>
                        </div>
                    }
                </section>

                {/* Main Content Area: 76vh */}
                <section className="w-full h-[76vh] bg-[#f8fafc] border-x border-[#e2e8f0] overflow-y-auto">
                    {children}
                </section>

                {/* Bottom Navigation Section: 10vh */}
                <section className="h-[10vh] w-full flex justify-between items-center bg-white py-2 px-4 border-t border-x border-[#e2e8f0] z-10">
                    <div className='w-full flex justify-around'>
                        <NavLink to={nearbyPath} className='flex flex-col items-center cursor-pointer'>
                            <LocateFixed color={chooseColour(nearbyPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(nearbyPath, currentPathName)}`}>Nearby</p>
                        </NavLink>
                        <NavLink to={encountersPath} className='flex flex-col items-center cursor-pointer'>
                            <Copy color={chooseColour(encountersPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(encountersPath, currentPathName)}`}>Encounters</p>
                        </NavLink>
                        <NavLink to={likesPath} className='indicator flex flex-col items-center cursor-pointer'>
                            {newLikesCount > 0 &&
                                <span className="indicator-item badge badge-accent rounded-full w-6 h-6 text-[10px] font-bold">
                                    {newLikesCount}
                                </span>}
                            <Heart color={chooseColour(likesPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(likesPath, currentPathName)}`}>Likes</p>
                        </NavLink>
                        <NavLink to={chatsPath} className='indicator flex flex-col items-center cursor-pointer'>
                            {unreadChatsCount > 0 &&
                                <span className="indicator-item badge badge-primary rounded-full w-6 h-6 text-[10px] font-bold">
                                    {unreadChatsCount}
                                </span>}
                            <MessageCircleCode color={chooseColour(chatsPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(chatsPath, currentPathName)}`}>Chats</p>
                        </NavLink>
                        <NavLink to={profilePath} className='flex flex-col items-center cursor-pointer'>
                            <User color={chooseColour(profilePath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(profilePath, currentPathName)}`}>Profile</p>
                        </NavLink>
                    </div>
                </section>

                {/* AdSense Section: 7vh */}
                <section className="h-[7vh] w-full flex justify-center items-center bg-white border-t border-x border-[#e2e8f0] overflow-hidden z-10">
                    <div className="w-full h-full flex justify-center items-center">
                        <AdSense
                            client="ca-pub-1951941014525314"
                            slot="4437680249"
                            format="horizontal"
                            responsive="true"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
};

export default MainLayout;