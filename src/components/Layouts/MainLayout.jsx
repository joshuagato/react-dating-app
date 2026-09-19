// import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
    SlidersHorizontal, LocateFixed, Copy, Heart, MessageCircleCode, User,
    MoreHorizontal, Menu
} from 'lucide-react';
import {
    chatsPath, encountersPath, likesPath, nearbyPath, premiumPath, profilePath, socket, userId
} from '../../utils/constants';
import { chooseColour, chooseTextColour, isSame, pathMatched } from '../../utils/functions';
import { getUnreadChatsCountHandler } from '../../tanstack/chat';
import { getNewLikesCountHandler } from '../../tanstack/encounter';

import AdSense from '../AdSense';
import { Sparkles, Crown, Lock, ArrowLeft } from 'lucide-react';

const MainLayout = ({ children, pageTitle, pageDetails }) => {
    const currentPathName = useLocation().pathname;
    const [unreadChatsCount, setUnreadChatsCount] = useState(0);
    const [newLikesCount, setNewLikesCount] = useState(0);
    const navigate = useNavigate();

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
            if (message && isSame(message.recipient_id, userId)) {
                const chatsResponse = await getUnreadChatsCountHandler();
                setUnreadChatsCount(chatsResponse.count);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, []);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 select-none">
            <div className='relative h-full w-full lg:max-w-2xl flex flex-col'>

                {/* Header Section: 7vh */}
                <section className="w-full h-[7vh] flex justify-between items-center bg-white py-2 px-4 z-10 border-b border-[#e2e8f0]">
                    <div className='bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                        <h1 className="text-xl font-bold">
                            {pageTitle}
                        </h1>
                        <p className='text-sm'>{pageDetails}</p>
                    </div>

                    <div className='flex gap-4'>
                        {pathMatched(encountersPath, currentPathName) &&
                            <div className='flex gap-4'>
                                {/* <article className='cursor-pointer'>
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
                            </article> */}
                                <article className="cursor-pointer">
                                    <div onClick={() => document.getElementById('my_modal_3').showModal()}>
                                        <SlidersHorizontal className="hover:text-violet-600 transition-colors" />
                                    </div>

                                    <dialog id="my_modal_3" className="modal modal-bottom sm:modal-middle">
                                        <div className="modal-box bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl relative text-left">
                                            {/* Close Button */}
                                            <form method="dialog">
                                                <button className="btn btn-sm btn-circle btn-ghost text-slate-400 hover:text-slate-700 absolute right-3 top-3">
                                                    ✕
                                                </button>
                                            </form>

                                            {/* Header Badge */}
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold mb-3">
                                                <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                <span>Premium Feature</span>
                                            </div>

                                            {/* Title & Description */}
                                            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">
                                                Advanced Distance Filters
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                                                Adjusting match radius and age criteria beyond defaults requires an active premium pass.
                                            </p>

                                            {/* Disabled/Locked Input Preview */}
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-6 relative overflow-hidden">
                                                <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-2">
                                                    <span>Search Radius</span>
                                                    <span className="font-bold text-slate-400">30 km (Locked)</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max="100"
                                                    defaultValue="30"
                                                    disabled
                                                    className="range range-xs range-primary opacity-40 cursor-not-allowed"
                                                />

                                                {/* Lock Overlay */}
                                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                                                    <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                        <Lock className="w-3 h-3 text-amber-400" /> Locked
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col gap-2">
                                                <NavLink
                                                    to="/premium" // Replace with your registered path constant (e.g., premiumPath)
                                                    onClick={() => document.getElementById('my_modal_3').close()}
                                                    className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-md shadow-violet-500/20 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2"
                                                >
                                                    <Sparkles className="w-4 h-4 fill-white" />
                                                    Unlock Premium Packages
                                                </NavLink>

                                                <form method="dialog">
                                                    <button className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                                                        Maybe Later
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Backdrop click to close */}
                                        <form method="dialog" className="modal-backdrop">
                                            <button>close</button>
                                        </form>
                                    </dialog>
                                </article>



                                {/* <article className="drawer">
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
                            </article> */}
                            </div>
                        }

                        {pathMatched(nearbyPath, currentPathName) &&
                            <div className='flex gap-4'>
                                {/* <article className='cursor-pointer'>
                                    <SlidersHorizontal />
                                </article>
                                <article className='cursor-pointer'>
                                    <MoreHorizontal />
                                </article> */}
                            </div>
                        }

                        {pathMatched(premiumPath, currentPathName) &&
                            <article className='cursor-pointer hover:bg-emerald-50 rounded-full' onClick={() => navigate(-1)}>
                                <ArrowLeft />
                            </article>
                        }
                        <article className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="cursor-pointer"><MoreHorizontal /></div>
                            <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                                <li><NavLink to={premiumPath}>Upgrade</NavLink></li>
                                <li><a>Logout</a></li>
                            </ul>
                        </article>
                    </div>
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
                <section id='adsense' className="w-full flex justify-center items-center bg-white border-t border-x border-[#e2e8f0] overflow-hidden z-10">
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