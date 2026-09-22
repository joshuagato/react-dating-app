// PartnerProfile.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import {
    MapPin, Briefcase, GraduationCap, Heart, Cigarette,
    Wine, ArrowLeft, User as UserIcon, Maximize2,
    ChevronLeft, ChevronRight, X, Ruler, Users, Sparkles,
    CheckCircle2, Clock,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { getPartnerProfileHandler } from '../tanstack/user';
import { baseURL } from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
import PartnerProfileLayout from '../components/Layouts/PartnerProfileLayout';

/* ------------------------------------------------------------------ */
/* Small reusable pieces                                               */
/* ------------------------------------------------------------------ */
function InfoRow({ icon, label, value, iconBg = 'bg-violet-50', iconColor = 'text-violet-600' }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    {label}
                </p>
                <p className="text-sm font-medium text-slate-700 capitalize break-words">
                    {value}
                </p>
            </div>
        </div>
    );
}

function StatChip({ icon, label, value, tone = 'violet' }) {
    const tones = {
        violet: 'bg-violet-50 text-violet-700 border-violet-100',
        pink: 'bg-pink-50 text-pink-700 border-pink-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
    };
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${tones[tone]}`}>
            {icon}
            <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                    {label}
                </p>
                <p className="text-sm font-bold capitalize">{value}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const PartnerProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const targetUserId = location.state?.user_id;

    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                setError(
                    err.response?.data?.message ||
                    'Failed to fetch partner profile.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPartnerProfile();
    }, [targetUserId]);

    /* -------------------- Lightbox handlers -------------------- */
    const handlePrevImage = () => {
        if (!partner?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev === 0 ? partner.pictures.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        if (!partner?.pictures?.length) return;
        setActiveImageIndex((prev) =>
            prev === partner.pictures.length - 1 ? 0 : prev + 1
        );
    };

    // Keyboard nav for the lightbox
    useEffect(() => {
        if (!isFullscreen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setIsFullscreen(false);
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isFullscreen, partner]);

    /* -------------------- Loading -------------------- */
    if (loading) {
        return (
            <PartnerProfileLayout pageTitle="Partner Profile">
                <div className="flex justify-center items-center h-full text-slate-500">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            </PartnerProfileLayout>
        );
    }

    /* -------------------- Error -------------------- */
    if (error || !partner) {
        return (
            <PartnerProfileLayout pageTitle="Partner Profile">
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <UserIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-500 font-semibold mb-4">
                        {error || 'Profile not found'}
                    </p>
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

    const hasPictures =
        Array.isArray(partner.pictures) && partner.pictures.length > 0;
    const profile = partner.profile || {};

    return (
        <PartnerProfileLayout pageTitle={partner.name || 'Partner Profile'}>
            <div className="max-w-lg mx-auto pb-10 space-y-5">
                {/* ------------------------------------------------ */}
                {/* Hero image area                                  */}
                {/* ------------------------------------------------ */}
                <div className="relative w-full rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/5] group">
                    {hasPictures ? (
                        <>
                            <Swiper
                                modules={[Navigation, Pagination]}
                                navigation
                                pagination={{ clickable: true }}
                                loop={true}
                                onSlideChange={(swiper) =>
                                    setActiveImageIndex(swiper.realIndex)
                                }
                                className="w-full h-full partner-hero-swiper"
                            >
                                {partner.pictures.map((pic, idx) => (
                                    <SwiperSlide
                                        key={pic.id || idx}
                                        className="flex items-center justify-center bg-slate-950"
                                    >
                                        {/* The key change: object-contain
                                            (not object-cover) so the full
                                            image is visible without cropping
                                            while still filling the container
                                            as much as its aspect ratio
                                            allows. */}
                                        <img
                                            src={buildPictureUrl(
                                                baseURL,
                                                pic.path
                                            )}
                                            alt={`${partner.name} ${idx + 1}`}
                                            className="w-full h-full object-contain"
                                            draggable={false}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Fullscreen trigger */}
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="absolute bottom-3 right-3 z-10 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-2.5 rounded-full transition-all duration-200 border border-white/20 shadow-lg active:scale-95"
                                title="View fullscreen"
                                aria-label="View fullscreen"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>

                            {/* Gradient scrim so the name plate and the
                                fullscreen button both read clearly against
                                bright photos. */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                            {/* Name plate overlay on the hero */}
                            <div className="absolute bottom-4 left-4 right-16 z-10 text-white">
                                <h2 className="text-2xl font-bold drop-shadow-md leading-tight">
                                    {partner.name}
                                </h2>
                                {partner.city && (
                                    <p className="flex items-center gap-1 text-xs text-white/90 mt-0.5 drop-shadow">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {[partner.city, partner.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <UserIcon className="w-16 h-16" />
                        </div>
                    )}
                </div>

                {/* ------------------------------------------------ */}
                {/* Quick stats — online status, gender, age-ish    */}
                {/* ------------------------------------------------ */}
                <div className="flex flex-wrap gap-2">
                    {partner.is_online ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online now
                        </span>
                    ) : partner.last_seen ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Last seen {new Date(partner.last_seen).toLocaleDateString()}
                        </span>
                    ) : null}

                    {partner.gender && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full capitalize">
                            <Users className="w-3.5 h-3.5" />
                            {partner.gender}
                        </span>
                    )}

                    {profile.height_cm && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                            <Ruler className="w-3.5 h-3.5" />
                            {profile.height_cm} cm
                        </span>
                    )}
                </div>

                {/* ------------------------------------------------ */}
                {/* Bio card                                         */}
                {/* ------------------------------------------------ */}
                {profile.bio && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <h3 className="font-bold text-slate-800 text-sm">
                                About
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                            "{profile.bio}"
                        </p>
                    </div>
                )}

                {/* ------------------------------------------------ */}
                {/* Details grid                                     */}
                {/* ------------------------------------------------ */}
                {(profile.relationship_status ||
                    profile.education ||
                    profile.reason_on_app ||
                    profile.smoking ||
                    profile.drinking) && (
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <h3 className="font-bold text-slate-800 text-sm">
                                    Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoRow
                                    icon={<Heart className="w-4 h-4" />}
                                    label="Relationship"
                                    value={profile.relationship_status}
                                    iconBg="bg-pink-50"
                                    iconColor="text-pink-500"
                                />
                                <InfoRow
                                    icon={<GraduationCap className="w-4 h-4" />}
                                    label="Education"
                                    value={profile.education}
                                    iconBg="bg-blue-50"
                                    iconColor="text-blue-500"
                                />
                                <InfoRow
                                    icon={<Briefcase className="w-4 h-4" />}
                                    label="Looking for"
                                    value={profile.reason_on_app}
                                    iconBg="bg-amber-50"
                                    iconColor="text-amber-500"
                                />
                                <InfoRow
                                    icon={<Cigarette className="w-4 h-4" />}
                                    label="Smoking"
                                    value={profile.smoking}
                                    iconBg="bg-slate-100"
                                    iconColor="text-slate-500"
                                />
                                <InfoRow
                                    icon={<Wine className="w-4 h-4" />}
                                    label="Drinking"
                                    value={profile.drinking}
                                    iconBg="bg-purple-50"
                                    iconColor="text-purple-500"
                                />
                            </div>
                        </div>
                    )}

                {/* ------------------------------------------------ */}
                {/* Fullscreen lightbox                              */}
                {/* ------------------------------------------------ */}
                {isFullscreen && hasPictures && (
                    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm fade-in">
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="absolute top-4 left-4 text-xs font-semibold text-white/80 bg-white/10 px-3 py-1 rounded-full z-20">
                            {activeImageIndex + 1} / {partner.pictures.length}
                        </div>

                        {partner.pictures.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <img
                                src={buildPictureUrl(
                                    baseURL,
                                    partner.pictures[activeImageIndex].path
                                )}
                                alt={`${partner.name} full view`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                draggable={false}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Local styles to hide the swiper bullets and keep the
                hero clean; the pagination bullets on the hero are noise
                when you already have the fullscreen trigger and the name
                overlay. */}
            <style>{`
                .partner-hero-swiper .swiper-pagination {
                    display: none;
                }
                .partner-hero-swiper .swiper-button-next,
                .partner-hero-swiper .swiper-button-prev {
                    color: white;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(8px);
                    width: 36px;
                    height: 36px;
                    border-radius: 9999px;
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: background 0.2s;
                }
                .partner-hero-swiper .swiper-button-next:hover,
                .partner-hero-swiper .swiper-button-prev:hover {
                    background: rgba(0,0,0,0.7);
                }
                .partner-hero-swiper .swiper-button-next::after,
                .partner-hero-swiper .swiper-button-prev::after {
                    font-size: 14px;
                    font-weight: 700;
                }
            `}</style>
        </PartnerProfileLayout>
    );
};

export default PartnerProfile;