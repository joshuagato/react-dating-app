import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import {
    MapPin, Briefcase, GraduationCap, Heart, Cigarette,
    Wine, ArrowLeft, User as UserIcon, Maximize2, ChevronLeft, ChevronRight, X
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { getPartnerProfileHandler } from '../tanstack/user';
import { baseURL } from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import PartnerProfileLayout from '../components/Layouts/PartnerProfileLayout';

const PartnerProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract user_id passed via navigation state
    const targetUserId = location.state?.user_id;

    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fullscreen lightbox state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        if (!targetUserId) {
            setError('No user ID provided.');
            setLoading(false);
            return;
        }

        const fetchPartnerProfile = async () => {
            try {
                setLoading(true);
                const response = await getPartnerProfileHandler(targetUserId);
                if (response?.success) {
                    setPartner(response.data);
                } else {
                    setError('Unable to load profile data.');
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to fetch partner profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchPartnerProfile();
    }, [targetUserId]);

    const handlePrevImage = () => {
        if (!partner?.pictures?.length) return;
        setActiveImageIndex((prev) => (prev === 0 ? partner.pictures.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        if (!partner?.pictures?.length) return;
        setActiveImageIndex((prev) => (prev === partner.pictures.length - 1 ? 0 : prev + 1));
    };

    if (loading) {
        return (
            <PartnerProfileLayout pageTitle="Partner Profile">
                <div className="flex justify-center items-center h-full text-slate-500">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            </PartnerProfileLayout>
        );
    }

    if (error || !partner) {
        return (
            <PartnerProfileLayout pageTitle="Partner Profile">
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <p className="text-red-500 font-semibold mb-4">{error || 'Profile not found'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-sm btn-outline gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                </div>
            </PartnerProfileLayout>
        );
    }

    return (
        <PartnerProfileLayout pageTitle={partner.name || "Partner Profile"}>
            <div className="p-4 space-y-6 max-w-lg mx-auto pb-10">

                {/* Pictures Carousel - Increased height to h-[28rem] */}
                {partner.pictures && partner.pictures.length > 0 ? (
                    <div className="relative w-full rounded-2xl shadow-md overflow-hidden bg-slate-900 h-[24rem] group">
                        <Swiper
                            modules={[Navigation, Pagination]}
                            navigation
                            pagination={{ clickable: true }}
                            loop={true}
                            onSlideChange={(swiper) => setActiveImageIndex(swiper.realIndex)}
                            className="w-full h-full"
                        >
                            {partner.pictures.map((pic, idx) => (
                                <SwiperSlide key={pic.id || idx} className="flex items-center justify-center bg-slate-950">
                                    <img
                                        src={buildPictureUrl(baseURL, pic.path)}
                                        alt={`${partner.name} ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Bottom Right Fullscreen Trigger Icon */}
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="absolute bottom-3 right-3 z-10 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border border-white/20 shadow-lg"
                            title="View fullscreen"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-[28rem] rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                        <UserIcon className="w-16 h-16" />
                    </div>
                )}

                {/* Core Info */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{partner.name}</h2>

                            {partner.gender && (
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold text-xs capitalize">
                                    {partner.gender}
                                </span>
                            )}
                        </div>

                        {partner.is_online && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                            </span>
                        )}
                    </div>

                    {(partner.city || partner.country) && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <MapPin className="w-4 h-4 text-violet-500" />
                            <span>{[partner.city, partner.country].filter(Boolean).join(', ')}</span>
                        </div>
                    )}

                    {partner.profile?.bio && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed italic border-l-2 border-violet-400 pl-3">
                            "{partner.profile.bio}"
                        </p>
                    )}
                </div>

                {/* Additional Profile Details */}
                {partner.profile && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b pb-2">About</h3>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            {partner.profile.relationship_status && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Heart className="w-4 h-4 text-pink-500" />
                                    <span>{partner.profile.relationship_status}</span>
                                </div>
                            )}

                            {partner.profile.education && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <GraduationCap className="w-4 h-4 text-blue-500" />
                                    <span>{partner.profile.education}</span>
                                </div>
                            )}

                            {partner.profile.height_cm && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="font-bold text-slate-400">HT</span>
                                    <span>{partner.profile.height_cm} cm</span>
                                </div>
                            )}

                            {partner.profile.reason_on_app && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Briefcase className="w-4 h-4 text-amber-500" />
                                    <span>{partner.profile.reason_on_app}</span>
                                </div>
                            )}

                            {partner.profile.smoking && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Cigarette className="w-4 h-4 text-slate-500" />
                                    <span>Smoking: {partner.profile.smoking}</span>
                                </div>
                            )}

                            {partner.profile.drinking && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Wine className="w-4 h-4 text-purple-500" />
                                    <span>Drinking: {partner.profile.drinking}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Fullscreen Picture Modal */}
                {isFullscreen && partner.pictures && partner.pictures.length > 0 && (
                    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm fade-in">
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="absolute top-4 left-4 text-xs font-semibold text-white/80 bg-white/10 px-3 py-1 rounded-full z-20">
                            {activeImageIndex + 1} / {partner.pictures.length}
                        </div>

                        <button
                            onClick={handlePrevImage}
                            className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <img
                                src={buildPictureUrl(baseURL, partner.pictures[activeImageIndex].path)}
                                alt={`${partner.name} full view`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        </div>

                        <button
                            onClick={handleNextImage}
                            className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </PartnerProfileLayout>
    );
};

export default PartnerProfile;