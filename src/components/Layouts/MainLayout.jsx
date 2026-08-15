// import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router';
import {
    SlidersHorizontal, BluetoothConnected, LocateFixed, Copy, Heart, MessageCircleCode, User,
    MoreHorizontal, Menu
} from 'lucide-react';
import { chatsPath, encountersPath, likesPath, nearbyPath, profilePath } from '../../utils/constants';
import { chooseColour, chooseTextColour, pathMatched } from '../../utils/functions';


const MainLayout = ({ children, pageTitle, pageDetails }) => {
    const currentPathName = useLocation().pathname;

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 
            to-cyan-800 select-none fade-in">
            <div className='h-full w-full lg:max-w-xl'>

                <section className="w-full lg:max-w-xl h-[7vh] flex justify-between items-center bg-white py-2 px-4">
                    <div className='bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                        <h1 className="text-xl font-bold">
                            {pageTitle}
                        </h1>
                        <p className='text-sm'>{pageDetails}</p>
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
                                            {/* if there is a button in form, it will close the modal */}
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
                                <div className="drawer-side">
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

                <section className="absolute w-full lg:max-w-xl h-[76vh] top-[7vh] bottom-[17vh] bg-[#f8fafc] border border-[#e2e8f0]">
                    {children}
                </section>

                <section className="fixed bottom-[7vh] h-[10vh] w-full lg:max-w-xl flex justify-between items-center bg-white py-2 px-4">
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
                            <span className="indicator-item badge badge-primary rounded-full w-6 h-6 text-[10px] font-bold">3</span>
                            <Heart color={chooseColour(likesPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(likesPath, currentPathName)}`}>Likes</p>
                        </NavLink>
                        <NavLink to={chatsPath} className='indicator flex flex-col items-center cursor-pointer'>
                            <span className="indicator-item badge badge-accent rounded-full w-6 h-6 text-[10px] font-bold">7</span>
                            <MessageCircleCode color={chooseColour(chatsPath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(chatsPath, currentPathName)}`}>Chats</p>
                        </NavLink>
                        <NavLink to={profilePath} className='flex flex-col items-center cursor-pointer'>
                            <User color={chooseColour(profilePath, currentPathName)} />
                            <p className={`text-[10px] ${chooseTextColour(profilePath, currentPathName)}`}>Profile</p>
                        </NavLink>
                    </div>
                </section>
                <section className="fixed bottom-0 w-full lg:max-w-xl h-[7vh] flex justify-center items-center bg-white
                    border border-[#e2e8f0]">
                    <div className='bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                        <h1 className="text-xl font-bold">
                            {`Advertisement`}
                        </h1>
                    </div>
                </section>
            </div>
        </div>
    )
}

// Layout.propTypes = {
//     heading: PropTypes.string
// }

export default MainLayout;