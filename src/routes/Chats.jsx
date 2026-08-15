import { useState, useEffect } from 'react';
import { Heart, Asterisk, Radar, Star } from 'lucide-react';
import { Link } from 'react-router';

import { CHATS_TITLE, CHATS_TEXT } from '../utils/constants';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Chats() {
    const [profiles, setProfiles] = useState([]);

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

    useEffect(() => {
        // console.log({ profiles });
    }, [profiles]);

    return (
        <MainLayout pageTitle={CHATS_TITLE} pageDetails={CHATS_TEXT}>
            <HelmetHeader pageTitle={CHATS_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 sm:px-8 py-2 overflow-y-scroll">
                <div className='w-full h-full grid grid-cols-1 gap-5'>
                    {profiles.length > 0 && profiles.map((profile, index) => {
                        return (
                            <Link to={'/chat'} key={index} className='w-full h-15 flex justify-between items-center gap-3 cursor-pointer active:bg-neutral-100'>
                                <section className='flex gap-3'>
                                    <div className='w-15 h-15'>
                                        <img className='w-full h-full object-cover rounded-full' src={profile.pictures[0]} alt="User Profile Picture" />
                                    </div>
                                    <div className='w-fit h-15'>
                                        <div className='w-full h-full flex flex-col justify-center items-start bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                                            <h1 className='text-[14px] sm:text-[18px] flex items-center gap-2'>{profile.name}
                                                <span className='block w-2 h-2 bg-green-700 rounded-full'></span>
                                            </h1>
                                            <p className='text-[12px] sm:text-[13px]'>{profile.distanceFrom} KM Away</p>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <div>

                                    </div>
                                    <div className='flex flex-col items-center gap-2'>
                                        <Star size={15} />
                                        <span className='text-[10px]'>{'Yesterday'}</span>
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