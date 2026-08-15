import { useState, useRef, useCallback, useEffect } from 'react';
import { Heart, Asterisk, Radar, Star } from 'lucide-react';

import { NEARBY_TITLE, NEARBY_TEXT } from '../utils/constants';
import { getPotentialMatchProfilesHandler } from '../tanstack/user';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';

export default function Nearby() {
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
        <MainLayout pageTitle={NEARBY_TITLE} pageDetails={NEARBY_TEXT}>
            <HelmetHeader pageTitle={NEARBY_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-hidden select-none fade-in px-4 sm:px-8 py-2 overflow-y-scroll">
                <div className='w-full h-full grid max-sm:grid-cols-2  max-lg:grid-cols-3 gap-3 lg:grid-cols-2'>
                    {profiles.length > 0 && profiles.map((profile, index) => {
                        return (
                            <article key={index} className='w-full h-[calc(200px + 50px)] sm:h-[calc(280px + 70px)]'>
                                <div className='w-full h-50 sm:h-70'>
                                    <img className='w-full h-full object-cover' src={profile.pictures[0]} alt="User Profile Picture" />
                                </div>
                                <div className='w-full h-12.5 sm:h-17.5 px-2 py-1 bg-gradient-to-t from-black/90 to-black/80'>
                                    <div className='w-full h-full flex flex-col justify-center items-center bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                                        <h1 className='text-[14px] sm:text-[18px]'>{profile.name}, {profile.age}</h1>
                                        <p className='text-[12px] sm:text-[14px]'>{profile.distanceFrom} KM Away</p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
}