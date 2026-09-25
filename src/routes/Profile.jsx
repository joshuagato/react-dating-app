// pages/Profile.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import {
    MapPin,
    Lock,
    Save,
    Eye,
    EyeOff,
    Loader2,
    CircleCheck,
    AlertTriangle,
    RefreshCw,
    User,
    Sparkles,
    GraduationCap,
    Heart,
    Cigarette,
    Wine,
    Ruler,
    Crown,
    CalendarClock,
    History,
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import {
    PROFILE_TITLE, PROFILE_TEXT, GENDER, premiumPath,
} from '../utils/constants';
import { renderImageUrl } from '../utils/functions';
import { compressImage, compareFaces } from '../utils/imageProcessing';
import {
    getVerificationSelfieHandler,
    getProfileHandler,
    updateProfileHandler,
    deletePictureHandler,
} from '../tanstack/user';

const REASON_OPTIONS = [
    'Long-term relationship',
    'Casual dating',
    'Hook Up',
    'New friends',
    'Marriage',
    'Not sure yet',
];

const EDUCATION_OPTIONS = [
    'High School',
    'Undergraduate Degree',
    'Postgraduate Degree',
    'Doctorate / PhD',
    'Trade / Vocational School',
    'Prefer not to say',
];

const RELATIONSHIP_OPTIONS = ['Single', 'Divorced', 'Widowed', 'Separated'];
const LIFESTYLE_OPTIONS = ['Never', 'Occasionally', 'Socially', 'Regularly'];

/* -------------------------------------------------------------------------- */
/*                        Premium status banner                               */
/* -------------------------------------------------------------------------- */

function PremiumBanner({ premium }) {
    const navigate = useNavigate();

    if (!premium) return null;

    const { is_premium, expires_at, days_remaining, cycle, expired } = premium;

    // --- Free user who has never subscribed ---
    if (!is_premium && !expired) {
        return (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white shadow-lg border border-slate-700">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight">
                            You're on the Free plan
                        </h3>
                        <p className="text-[11px] text-white/70 mt-1 leading-snug">
                            Unlock unlimited likes, see who liked you, and
                            message anyone on Crushr.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate(premiumPath)}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Upgrade to Premium
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Active premium ---
    if (is_premium) {
        const formatted = expires_at
            ? new Date(expires_at).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            })
            : null;

        return (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 text-white shadow-lg">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                            Premium Member
                            <span className="text-[9px] uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                                {cycle || 'active'}
                            </span>
                        </h3>

                        <div className="mt-1.5 text-[11px] text-white/90 space-y-0.5">
                            {formatted && (
                                <p className="flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    Renews on {formatted}
                                </p>
                            )}
                            {typeof days_remaining === 'number' && (
                                <p className="font-semibold">
                                    Expires in {days_remaining} day
                                    {days_remaining === 1 ? '' : 's'}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate(premiumPath)}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-violet-700 bg-white hover:bg-white/90 transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Extend Subscription
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Expired previously ---
    if (expired) {
        const { expired_at, days_ago, billing_cycle } = expired;
        const formatted = expired_at
            ? new Date(expired_at).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            })
            : null;

        return (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 text-white shadow-lg">
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <History className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight">
                            Your Premium has expired
                        </h3>
                        <div className="mt-1.5 text-[11px] text-white/90 space-y-0.5">
                            {formatted && (
                                <p className="flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    Last subscription ({billing_cycle}) ended on{' '}
                                    {formatted}
                                </p>
                            )}
                            {typeof days_ago === 'number' && (
                                <p className="font-semibold">
                                    {days_ago} day{days_ago === 1 ? '' : 's'} ago
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(premiumPath)}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-rose-700 bg-white hover:bg-white/90 transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Resubscribe
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

/* -------------------------------------------------------------------------- */
/*                        Drag & Drop Sub-Components                          */
/* -------------------------------------------------------------------------- */

function ImageUploadBox({ id, position, imagePreview, onImageUpdate }) {
    const onDrop = useCallback(
        (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                onImageUpdate(id, file, position);
            }
        },
        [id, position, onImageUpdate]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
    });

    const removeImageHandler = (event) => {
        event.stopPropagation();
        onImageUpdate(id, null, position, true);
    };

    const boxStyle = {
        width: '100%',
        height: '100%',
        border: isDragActive ? '2px dashed #0070f3' : '2px dashed #cbd5e1',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f7ff' : '#f8fafc',
        textAlign: 'center',
    };

    return (
        <div className="relative w-full aspect-square">
            <div className="absolute top-1.5 left-1.5 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-black/80 text-white font-black text-xs shadow-md border border-white pointer-events-none">
                {position}
            </div>

            <article {...getRootProps()} style={boxStyle}>
                <input {...getInputProps()} />
                {imagePreview ? (
                    <>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md"
                        />
                        <div
                            className="flex justify-center items-center text-white font-extrabold absolute bg-red-600 hover:bg-red-700 w-5 h-5 rounded-full -top-1 -right-1 z-20 cursor-pointer shadow-md text-xs"
                            onClick={removeImageHandler}
                        >
                            ×
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <span
                            className={`text-2xl font-extrabold ${isDragActive ? 'text-[#0070f3]' : 'text-slate-400'
                                }`}
                        >
                            +
                        </span>
                        <p
                            className={`text-[10px] font-medium ${isDragActive ? 'text-[#0070f3]' : 'text-slate-500'
                                }`}
                        >
                            {isDragActive ? 'Drop here' : 'Add Photo'}
                        </p>
                    </div>
                )}
            </article>
        </div>
    );
}

function SortableBox({ id, position, imagePreview, onImageUpdate }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            title="Click to Upload or Drag and Drop"
        >
            <ImageUploadBox
                id={id}
                position={position}
                imagePreview={imagePreview}
                onImageUpdate={onImageUpdate}
            />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                           Main Profile Component                           */
/* -------------------------------------------------------------------------- */

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);
    const [locating, setLocating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [selfieUrl, setSelfieUrl] = useState(null);
    const selfieImgRef = useRef(null);

    const [modalInfo, setModalInfo] = useState({
        isOpen: false,
        success: false,
        title: '',
        message: '',
    });

    const [deleteConfirm, setDeleteConfirm] = useState({
        isOpen: false,
        itemId: null,
        dbId: null,
        isDeleting: false,
    });

    const [premium, setPremium] = useState(null);

    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        other_names: '',
        gender: GENDER.MAN,
        interested_in: GENDER.WOMEN,
        date_of_birth: '',
        country: '',
        city: '',
        country_code: '',
        longitude: '',
        latitude: '',
    });

    const [profileData, setProfileData] = useState({
        bio: '',
        reason_on_app: '',
        education: '',
        relationship_status: 'Single',
        height_cm: '',
        smoking: 'Never',
        drinking: 'Socially',
    });

    const [visibilityData, setVisibilityData] = useState({
        last_name_on: false,
        other_names_on: false,
        gender_on: true,
    });

    const [items, setItems] = useState([
        { id: '1', dbId: null, imagePreview: null, file: null },
        { id: '2', dbId: null, imagePreview: null, file: null },
        { id: '3', dbId: null, imagePreview: null, file: null },
        { id: '4', dbId: null, imagePreview: null, file: null },
        { id: '5', dbId: null, imagePreview: null, file: null },
        { id: '6', dbId: null, imagePreview: null, file: null },
    ]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
    );

    /* ---------------------------------------------------------------------- */
    /* Helpers                                                                */
    /* ---------------------------------------------------------------------- */

    const syncItemsWithPictures = useCallback((pictures) => {
        setItems((prev) =>
            prev.map((item, index) => {
                const slotPosition = index + 1;
                const existingPic = pictures.find(
                    (p) => Number(p.position) === slotPosition
                );

                if (existingPic) {
                    const imageUrl = existingPic.image_url || existingPic.path;
                    const fullImageUrl = renderImageUrl(imageUrl);

                    return {
                        ...item,
                        dbId: existingPic.id,
                        imagePreview: fullImageUrl,
                        file: null,
                    };
                }
                return { ...item, dbId: null, imagePreview: null, file: null };
            })
        );
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Initial Load                                                           */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        (async () => {
            try {
                try {
                    const selfieRes = await getVerificationSelfieHandler();
                    if (selfieRes?.success && selfieRes?.data?.base64) {
                        setSelfieUrl(selfieRes.data.base64);
                    }
                } catch (err) {
                    console.error('Verification selfie not found:', err);
                }

                const response = await getProfileHandler();

                if (response?.data) {
                    const {
                        user,
                        profile,
                        profileVisibility,
                        pictures,
                        premium: premiumData,
                    } = response.data;

                    if (user) {
                        setUserData({
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            other_names: user.other_names || '',
                            gender: user.gender || GENDER.MAN,
                            interested_in: user.interested_in || GENDER.WOMEN,
                            date_of_birth: user.date_of_birth || '',
                            country: user.country || 'Unknown',
                            city: user.city || 'Unknown',
                            country_code: user.country_code || '',
                            longitude: user.longitude || '',
                            latitude: user.latitude || '',
                        });
                    }

                    const activeProfile = profile || user?.profile;
                    if (activeProfile) {
                        setProfileData({
                            bio: activeProfile.bio || '',
                            reason_on_app: activeProfile.reason_on_app || '',
                            education: activeProfile.education || '',
                            relationship_status:
                                activeProfile.relationship_status || 'Single',
                            height_cm: activeProfile.height_cm || '',
                            smoking: activeProfile.smoking || 'Never',
                            drinking: activeProfile.drinking || 'Socially',
                        });
                    }

                    const activeVisibility =
                        profileVisibility || activeProfile;
                    if (activeVisibility) {
                        setVisibilityData({
                            last_name_on: Boolean(activeVisibility.last_name_on),
                            other_names_on: Boolean(
                                activeVisibility.other_names_on
                            ),
                            gender_on: Boolean(activeVisibility.gender_on),
                        });
                    }

                    if (premiumData) {
                        setPremium(premiumData);
                    }

                    if (Array.isArray(pictures) && pictures.length > 0) {
                        syncItemsWithPictures(pictures);
                    }
                }
            } catch (error) {
                console.error('Failed to load user profile:', error);
                toast.error('Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [syncItemsWithPictures]);

    /* ---------------------------------------------------------------------- */
    /* Drag & Drop                                                            */
    /* ---------------------------------------------------------------------- */

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            setItems((prev) => arrayMove(prev, oldIndex, newIndex));
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Image Upload / Removal                                                 */
    /* ---------------------------------------------------------------------- */

    const handleImageUpdate = async (id, file, position, isRemove = false) => {
        const targetItem = items.find((item) => item.id === id);

        if (isRemove || !file) {
            setDeleteConfirm({
                isOpen: true,
                itemId: id,
                dbId: targetItem?.dbId || null,
                isDeleting: false,
            });
            return;
        }

        setProcessingImage(true);

        try {
            const compressedFile = await compressImage(file);

            const tempUploadedImg = document.createElement('img');
            const previewUrl = URL.createObjectURL(compressedFile);
            tempUploadedImg.src = previewUrl;
            await new Promise((res) => (tempUploadedImg.onload = res));

            if (selfieImgRef.current) {
                const matchResult = await compareFaces(
                    selfieImgRef.current,
                    tempUploadedImg
                );

                if (!matchResult.isMatch) {
                    URL.revokeObjectURL(previewUrl);
                    setModalInfo({
                        isOpen: true,
                        success: false,
                        title: 'Verification Mismatch',
                        message:
                            matchResult.reason ||
                            'The face in this photo does not match your verification selfie.',
                    });
                    setProcessingImage(false);
                    return;
                }
            }

            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            dbId: null,
                            imagePreview: previewUrl,
                            file: compressedFile,
                        }
                        : item
                )
            );

            setModalInfo({
                isOpen: true,
                success: true,
                title: 'Image Verified',
                message: 'Face match confirmed! Photo compressed and ready.',
            });
        } catch (err) {
            console.error('Image Processing Error:', err);
            toast.error('An error occurred while validating the image.');
        } finally {
            setProcessingImage(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Picture Deletion (confirmed)                                           */
    /* ---------------------------------------------------------------------- */

    const closeDeleteConfirm = () => {
        if (deleteConfirm.isDeleting) return;
        setDeleteConfirm({
            isOpen: false,
            itemId: null,
            dbId: null,
            isDeleting: false,
        });
    };

    const confirmDeletePicture = async () => {
        const { itemId, dbId } = deleteConfirm;

        if (!dbId) {
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId
                        ? {
                            ...item,
                            dbId: null,
                            imagePreview: null,
                            file: null,
                        }
                        : item
                )
            );
            setDeleteConfirm({
                isOpen: false,
                itemId: null,
                dbId: null,
                isDeleting: false,
            });
            toast.success('Photo removed.');
            return;
        }

        setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
        try {
            await deletePictureHandler(dbId);

            const refreshRes = await getProfileHandler();
            if (refreshRes?.data?.pictures) {
                syncItemsWithPictures(refreshRes.data.pictures);
            }

            toast.success('Photo deleted.');
            setDeleteConfirm({
                isOpen: false,
                itemId: null,
                dbId: null,
                isDeleting: false,
            });
        } catch (err) {
            console.error('Delete picture failed:', err);
            toast.error('Could not delete photo. Please try again.');
            setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Location                                                               */
    /* ---------------------------------------------------------------------- */

    const handleRefreshLocation = async () => {
        setLocating(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const status = await Geolocation.checkPermissions();
                if (status.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (
                        requestStatus.location === 'denied' ||
                        requestStatus.location === 'prompt-with-rationale'
                    ) {
                        throw new Error(
                            'Location permission was denied by the user.'
                        );
                    }
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
            });

            const { latitude, longitude } = position.coords;

            let city = 'Unknown';
            let country = 'Unknown';
            let countryCode = '';

            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const geoData = await geoRes.json();
                if (geoData?.address) {
                    city =
                        geoData.address.city ||
                        geoData.address.town ||
                        geoData.address.village ||
                        geoData.address.county ||
                        'Unknown';
                    country = geoData.address.country || 'Unknown';
                    countryCode = (
                        geoData.address.country_code || ''
                    ).toLowerCase();
                }
            } catch (geoErr) {
                console.error('Reverse geocoding failed:', geoErr);
            }

            setUserData((prev) => ({
                ...prev,
                latitude: latitude.toFixed(6).toString(),
                longitude: longitude.toFixed(6).toString(),
                city,
                country,
                country_code: countryCode,
            }));

            toast.success('Location updated successfully!');
        } catch (error) {
            console.error('Capacitor Geolocation error:', error);
            toast.error(
                'Unable to retrieve location. Ensure GPS/Location permissions are enabled.'
            );
        } finally {
            setLocating(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Field handlers                                                         */
    /* ---------------------------------------------------------------------- */

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileChange = (field, value) => {
        setFieldErrors((prev) => ({ ...prev, [field]: null }));
        if (field === 'bio') {
            const truncatedValue = value.slice(0, 300);
            setProfileData((prev) => ({ ...prev, [field]: truncatedValue }));
        } else {
            setProfileData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleVisibilityToggle = (field) => {
        setVisibilityData((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    /* ---------------------------------------------------------------------- */
    /* Submit                                                                 */
    /* ---------------------------------------------------------------------- */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        const activePhotos = items.filter(
            (item) => item.imagePreview !== null
        );
        if (activePhotos.length < 2) {
            setModalInfo({
                isOpen: true,
                success: false,
                title: 'Minimum Photos Required',
                message: `You currently have ${activePhotos.length} photo${activePhotos.length === 1 ? '' : 's'
                    }. Please maintain at least 2 profile photos.`,
            });
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();

            formData.append('user', JSON.stringify(userData));
            formData.append('profile', JSON.stringify(profileData));
            formData.append('visibility', JSON.stringify(visibilityData));

            const pictureMeta = items.map((item, index) => ({
                dbId: item.dbId,
                position: index + 1,
            }));
            formData.append('pictureMeta', JSON.stringify(pictureMeta));

            items.forEach((item, index) => {
                if (item.file) {
                    const slotPosition = index + 1;
                    formData.append(
                        `picture_slot_${slotPosition}`,
                        item.file
                    );
                }
            });

            const response = await updateProfileHandler(formData);

            if (response?.errors) {
                setFieldErrors(response.errors);
                const firstKey = Object.keys(response.errors)[0];
                const topErr =
                    response.errors[firstKey]?.[0] ||
                    'Please fix the errors below.';
                toast.error(topErr, {
                    autoClose: 5000,
                    theme: 'colored',
                });
                return;
            }

            toast.success('Profile saved successfully!');

            const refreshRes = await getProfileHandler();
            if (refreshRes?.data?.pictures) {
                syncItemsWithPictures(refreshRes.data.pictures);
            }
            if (refreshRes?.data?.premium) {
                setPremium(refreshRes.data.premium);
            }
        } catch (error) {
            console.error('Failed to save profile changes:', error);
            toast.error('Failed to save profile changes.');
        } finally {
            setSaving(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    if (loading) {
        return (
            <MainLayout pageTitle={PROFILE_TITLE} pageDetails={PROFILE_TEXT}>
                <div className="w-full h-full flex justify-center items-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout pageTitle={PROFILE_TITLE} pageDetails={PROFILE_TEXT}>
            <HelmetHeader pageTitle={PROFILE_TITLE} />

            {selfieUrl && (
                <img
                    ref={selfieImgRef}
                    src={selfieUrl}
                    alt="Selfie Reference"
                    className="hidden"
                    crossOrigin="anonymous"
                />
            )}

            {processingImage && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <p className="font-semibold text-sm">
                        Compressing & Verifying Face Match...
                    </p>
                </div>
            )}

            {modalInfo.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
                        <div className="flex justify-center">
                            {modalInfo.success ? (
                                <CircleCheck className="w-12 h-12 text-emerald-500" />
                            ) : (
                                <AlertTriangle className="w-12 h-12 text-amber-500" />
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {modalInfo.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                            {modalInfo.message}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                setModalInfo((prev) => ({
                                    ...prev,
                                    isOpen: false,
                                }))
                            }
                            className="w-full py-2 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {deleteConfirm.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
                        <div className="flex justify-center">
                            <AlertTriangle className="w-12 h-12 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            Delete this photo?
                        </h3>
                        <p className="text-xs text-slate-600">
                            {deleteConfirm.dbId
                                ? 'This will permanently remove the photo from your profile.'
                                : 'This photo hasn\u2019t been saved yet. It will be removed from the upload slot.'}
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                disabled={deleteConfirm.isDeleting}
                                className="flex-1 py-2 bg-slate-100 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeletePicture}
                                disabled={deleteConfirm.isDeleting}
                                className="flex-1 py-2 bg-red-600 text-white font-medium text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                            >
                                {deleteConfirm.isDeleting ? (
                                    <>
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                        Deleting…
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full h-full p-4 sm:p-6 space-y-6 select-none scroll-bar">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* PREMIUM STATUS BANNER */}
                    <PremiumBanner premium={premium} />

                    {/* 1. PROFILE PHOTOS */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-semibold text-gray-700">
                                Profile Photos (Up to 6)
                            </h2>
                            <span className="text-[11px] text-slate-400">
                                Drag to reorder slots
                            </span>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={items.map((item) => item.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-3 gap-3">
                                    {items.map((item, index) => (
                                        <SortableBox
                                            key={item.id}
                                            id={item.id}
                                            position={index + 1}
                                            imagePreview={item.imagePreview}
                                            onImageUpdate={handleImageUpdate}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* 2. PERSONAL INFORMATION */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">
                            Personal Information
                        </h2>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">
                                    First Name
                                </label>
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                    <Eye size={12} /> Always Visible
                                </span>
                            </div>
                            <input
                                type="text"
                                name="first_name"
                                value={userData.first_name}
                                onChange={handleInputChange}
                                className="input input-bordered input-sm w-full bg-slate-50 text-slate-800"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">
                                    Last Name
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleVisibilityToggle('last_name_on')
                                    }
                                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    {visibilityData.last_name_on ? (
                                        <Eye
                                            size={12}
                                            className="text-emerald-600"
                                        />
                                    ) : (
                                        <EyeOff
                                            size={12}
                                            className="text-rose-500"
                                        />
                                    )}
                                    {visibilityData.last_name_on
                                        ? 'Visible'
                                        : 'Hidden'}
                                </button>
                            </div>
                            <input
                                type="text"
                                name="last_name"
                                value={userData.last_name}
                                onChange={handleInputChange}
                                className="input input-bordered input-sm w-full bg-slate-50 text-slate-800"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">
                                    Other Names
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleVisibilityToggle('other_names_on')
                                    }
                                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    {visibilityData.other_names_on ? (
                                        <Eye
                                            size={12}
                                            className="text-emerald-600"
                                        />
                                    ) : (
                                        <EyeOff
                                            size={12}
                                            className="text-rose-500"
                                        />
                                    )}
                                    {visibilityData.other_names_on
                                        ? 'Visible'
                                        : 'Hidden'}
                                </button>
                            </div>
                            <input
                                type="text"
                                name="other_names"
                                value={userData.other_names}
                                onChange={handleInputChange}
                                className="input input-bordered input-sm w-full bg-slate-50 text-slate-800"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-slate-600 font-medium">
                                        Gender
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleVisibilityToggle('gender_on')
                                        }
                                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        {visibilityData.gender_on ? (
                                            <Eye
                                                size={12}
                                                className="text-emerald-600"
                                            />
                                        ) : (
                                            <EyeOff
                                                size={12}
                                                className="text-rose-500"
                                            />
                                        )}
                                        {visibilityData.gender_on
                                            ? 'Visible'
                                            : 'Hidden'}
                                    </button>
                                </div>
                                <select
                                    name="gender"
                                    value={userData.gender}
                                    onChange={handleInputChange}
                                    className="select select-bordered select-sm w-full bg-slate-50 text-slate-800"
                                >
                                    <option value={GENDER.MAN}>Man</option>
                                    <option value={GENDER.WOMAN}>Woman</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-600 font-medium block mb-1">
                                    Interested In
                                </label>
                                <select
                                    name="interested_in"
                                    value={userData.interested_in}
                                    onChange={handleInputChange}
                                    className="select select-bordered select-sm w-full bg-slate-50 text-slate-800"
                                >
                                    <option value={GENDER.MEN}>Men</option>
                                    <option value={GENDER.WOMEN}>Women</option>
                                    <option value={GENDER.EVERYONE}>Everyone</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={userData.date_of_birth}
                                onChange={handleInputChange}
                                className="input input-bordered input-sm w-full bg-slate-50 text-slate-800"
                            />
                        </div>
                    </div>

                    {/* 3. PROFILE DETAILS & LIFESTYLE */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">
                            Profile & Lifestyle Attributes
                        </h2>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-violet-600" />{' '}
                                About Me
                            </label>
                            <textarea
                                rows={3}
                                maxLength={300}
                                placeholder="Write a few words about your interests, passions, or personality..."
                                value={profileData.bio}
                                onChange={(e) =>
                                    handleProfileChange('bio', e.target.value)
                                }
                                className={`w-full p-3 rounded-xl border text-sm bg-slate-50 text-slate-800 resize-none focus:outline-none focus:ring-1 ${fieldErrors.bio
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-slate-200 focus:ring-violet-500'
                                    }`}
                            />
                            {fieldErrors.bio?.[0] && (
                                <p className="text-xs text-red-600 font-medium">
                                    {fieldErrors.bio[0]}
                                </p>
                            )}
                            <span className="text-[10px] text-slate-400 block text-right">
                                {profileData.bio.length}/300 characters
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-pink-600" />{' '}
                                Looking For
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {REASON_OPTIONS.map((option) => (
                                    <button
                                        type="button"
                                        key={option}
                                        onClick={() =>
                                            handleProfileChange(
                                                'reason_on_app',
                                                option
                                            )
                                        }
                                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${profileData.reason_on_app === option
                                            ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                                            : fieldErrors.reason_on_app
                                                ? 'bg-white border-red-300 text-slate-600 hover:border-red-500'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {fieldErrors.reason_on_app?.[0] && (
                                <p className="text-xs text-red-600 font-medium">
                                    {fieldErrors.reason_on_app[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4 text-amber-500" />{' '}
                                Education Level
                            </label>
                            <select
                                value={profileData.education}
                                onChange={(e) =>
                                    handleProfileChange(
                                        'education',
                                        e.target.value
                                    )
                                }
                                className={`select select-bordered select-sm w-full bg-slate-50 text-slate-800 ${fieldErrors.education
                                    ? 'border-red-500'
                                    : ''
                                    }`}
                            >
                                <option value="" disabled>
                                    Select highest education
                                </option>
                                {EDUCATION_OPTIONS.map((edu) => (
                                    <option key={edu} value={edu}>
                                        {edu}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.education?.[0] && (
                                <p className="text-xs text-red-600 font-medium">
                                    {fieldErrors.education[0]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                    <Ruler className="w-4 h-4 text-emerald-500" />{' '}
                                    Height (cm)
                                </span>
                                <input
                                    type="number"
                                    placeholder="175"
                                    value={profileData.height_cm}
                                    onChange={(e) =>
                                        handleProfileChange(
                                            'height_cm',
                                            e.target.value
                                        )
                                    }
                                    className={`w-20 p-1.5 border rounded-lg text-xs text-center focus:outline-none focus:ring-1 ${fieldErrors.height_cm
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-200 focus:ring-violet-500'
                                        }`}
                                />
                            </div>
                            {fieldErrors.height_cm?.[0] && (
                                <p className="text-xs text-red-600 font-medium">
                                    {fieldErrors.height_cm[0]}
                                </p>
                            )}

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 text-rose-500" />{' '}
                                    Relationship Status
                                </span>
                                <div className="flex gap-2 overflow-x-auto py-1">
                                    {RELATIONSHIP_OPTIONS.map((status) => (
                                        <button
                                            type="button"
                                            key={status}
                                            onClick={() =>
                                                handleProfileChange(
                                                    'relationship_status',
                                                    status
                                                )
                                            }
                                            className={`py-1.5 px-3 rounded-full text-xs font-medium border whitespace-nowrap ${profileData.relationship_status ===
                                                status
                                                ? 'bg-slate-800 border-slate-800 text-white'
                                                : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                {fieldErrors.relationship_status?.[0] && (
                                    <p className="text-xs text-red-600 font-medium">
                                        {fieldErrors.relationship_status[0]}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                                        <Cigarette className="w-4 h-4 text-slate-500" />{' '}
                                        Smoking
                                    </span>
                                    <select
                                        value={profileData.smoking}
                                        onChange={(e) =>
                                            handleProfileChange(
                                                'smoking',
                                                e.target.value
                                            )
                                        }
                                        className="select select-bordered select-sm w-full bg-slate-50 text-slate-800"
                                    >
                                        {LIFESTYLE_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.smoking?.[0] && (
                                        <p className="text-xs text-red-600 font-medium mt-1">
                                            {fieldErrors.smoking[0]}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                                        <Wine className="w-4 h-4 text-purple-500" />{' '}
                                        Drinking
                                    </span>
                                    <select
                                        value={profileData.drinking}
                                        onChange={(e) =>
                                            handleProfileChange(
                                                'drinking',
                                                e.target.value
                                            )
                                        }
                                        className="select select-bordered select-sm w-full bg-slate-50 text-slate-800"
                                    >
                                        {LIFESTYLE_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.drinking?.[0] && (
                                        <p className="text-xs text-red-600 font-medium mt-1">
                                            {fieldErrors.drinking[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. AUTO GPS LOCATION */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <MapPin
                                    size={16}
                                    className="text-indigo-600"
                                />{' '}
                                Auto GPS Location
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleRefreshLocation}
                                    disabled={locating}
                                    className="btn btn-xs border border-slate-300 bg-slate-50 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
                                >
                                    <RefreshCw
                                        size={12}
                                        className={
                                            locating ? 'animate-spin' : ''
                                        }
                                    />
                                    {locating
                                        ? 'Locating...'
                                        : 'Update Location'}
                                </button>
                                <Lock size={14} className="text-slate-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-slate-400 block">
                                    City
                                </span>
                                <input
                                    type="text"
                                    value={userData.city}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-medium mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">
                                    Country
                                </span>
                                <input
                                    type="text"
                                    value={userData.country}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-medium mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">
                                    Latitude
                                </span>
                                <input
                                    type="text"
                                    value={userData.latitude || '0.0000'}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-mono text-[11px] mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">
                                    Longitude
                                </span>
                                <input
                                    type="text"
                                    value={userData.longitude || '0.0000'}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-mono text-[11px] mt-1 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                            GPS coordinates are retrieved directly via native
                            Capacitor location services.
                        </p>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2 pb-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary w-full text-white bg-gradient-to-r from-violet-600 to-pink-600 border-none flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <Save size={16} />
                            )}
                            {saving
                                ? 'Saving Profile...'
                                : 'Save Profile Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}