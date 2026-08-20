import { useState, useEffect } from 'react';
import { Camera, MapPin, Lock, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import { PROFILE_TITLE, PROFILE_TEXT, GENDER, baseURL } from '../utils/constants';
import { buildPictureUrl } from '../utils/functions';
// import { getProfileHandler, updateProfileHandler, uploadPictureHandler, deletePictureHandler } from '../tanstack/user';

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User Core Details State
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        other_names: '',
        gender: GENDER.MAN,
        interested_in: GENDER.WOMEN,
        date_of_birth: '',
        country: '',
        city: '',
        longitude: '',
        latitude: ''
    });

    // Profile Visibility Options State
    const [visibilityData, setVisibilityData] = useState({
        first_name_on: true,
        last_name_on: false,
        other_names_on: false,
        gender_on: true
    });

    // Uploaded Pictures Array State (up to 6 photos)
    const [pictures, setPictures] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                // console.log('Welcome');
                // const response = await getProfileHandler();
                // if (response?.user) {
                //     setUserData({
                //         first_name: response.user.first_name || '',
                //         last_name: response.user.last_name || '',
                //         other_names: response.user.other_names || '',
                //         gender: response.user.gender || GENDER.MAN,
                //         interested_in: response.user.interested_in || GENDER.WOMEN,
                //         date_of_birth: response.user.date_of_birth || '',
                //         country: response.user.country || 'Unknown',
                //         city: response.user.city || 'Unknown',
                //         longitude: response.user.longitude || '',
                //         latitude: response.user.latitude || ''
                //     });
                // }
                // if (response?.profileVisibility) {
                //     setVisibilityData(response.profileVisibility);
                // }
                // if (response?.pictures) {
                //     setPictures(response.pictures);
                // }
            } catch (error) {
                console.error("Failed to load user profile:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleVisibilityToggle = (field) => {
        setVisibilityData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePhotoUpload = async (e, position) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('picture', file);
        formData.append('position', position);

        try {
            // const uploadedPic = await uploadPictureHandler(formData);
            // setPictures(prev => {
            //     const updated = prev.filter(p => p.position !== position);
            //     return [...updated, uploadedPic];
            // });
        } catch (error) {
            console.error("Failed to upload image:", error);
        }
    };

    const handlePhotoDelete = async (pictureId) => {
        try {
            // await deletePictureHandler(pictureId);
            setPictures(prev => prev.filter(p => p.id !== pictureId));
        } catch (error) {
            console.error("Failed to delete image:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // await updateProfileHandler({
            //     user: userData,
            //     visibility: visibilityData
            // });
        } catch (error) {
            console.error("Failed to save profile changes:", error);
        } finally {
            setSaving(false);
        }
    };

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

            <div className="w-full h-full p-4 sm:p-6 space-y-6 select-none scroll-bar">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Photo Management Grid (6 Slots) */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Profile Photos (Up to 6)</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((pos) => {
                                const pic = pictures.find(p => p.position === pos);
                                return (
                                    <div key={pos} className="relative aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col justify-center items-center overflow-hidden">
                                        {pic ? (
                                            <>
                                                <img
                                                    src={buildPictureUrl(baseURL, pic.path)}
                                                    alt={`Upload ${pos}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handlePhotoDelete(pic.id)}
                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                                                <Camera className="text-slate-400 mb-1" size={20} />
                                                <span className="text-[10px] text-slate-500 font-medium">+ Add</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handlePhotoUpload(e, pos)}
                                                />
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editable User Details */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">Personal Information</h2>

                        {/* First Name & Visibility */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">First Name</label>
                                <button
                                    type="button"
                                    onClick={() => handleVisibilityToggle('first_name_on')}
                                    className="flex items-center gap-1 text-[11px] text-slate-500"
                                >
                                    {visibilityData.first_name_on ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-rose-500" />}
                                    {visibilityData.first_name_on ? 'Visible' : 'Hidden'}
                                </button>
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

                        {/* Last Name & Visibility */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">Last Name</label>
                                <button
                                    type="button"
                                    onClick={() => handleVisibilityToggle('last_name_on')}
                                    className="flex items-center gap-1 text-[11px] text-slate-500"
                                >
                                    {visibilityData.last_name_on ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-rose-500" />}
                                    {visibilityData.last_name_on ? 'Visible' : 'Hidden'}
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

                        {/* Other Names & Visibility */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-600 font-medium">Other Names</label>
                                <button
                                    type="button"
                                    onClick={() => handleVisibilityToggle('other_names_on')}
                                    className="flex items-center gap-1 text-[11px] text-slate-500"
                                >
                                    {visibilityData.other_names_on ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-rose-500" />}
                                    {visibilityData.other_names_on ? 'Visible' : 'Hidden'}
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

                        {/* Gender & Interested In */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-xs text-slate-600 font-medium block mb-1">Gender</label>
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
                                <label className="text-xs text-slate-600 font-medium block mb-1">Interested In</label>
                                <select
                                    name="interested_in"
                                    value={userData.interested_in}
                                    onChange={handleInputChange}
                                    className="select select-bordered select-sm w-full bg-slate-50 text-slate-800"
                                >
                                    <option value={GENDER.MEN}>Men</option>
                                    <option value={GENDER.WOMEN}>Women</option>
                                    <option value={GENDER.EVERONE}>Everyone</option>
                                </select>
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">Date of Birth</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={userData.date_of_birth}
                                onChange={handleInputChange}
                                className="input input-bordered input-sm w-full bg-slate-50 text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Read-Only Automatic GPS Location Section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <MapPin size={16} className="text-indigo-600" /> Auto GPS Location
                            </h2>
                            <Lock size={14} className="text-slate-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-slate-400 block">City</span>
                                <input
                                    type="text"
                                    value={userData.city}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-medium mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">Country</span>
                                <input
                                    type="text"
                                    value={userData.country}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-medium mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">Latitude</span>
                                <input
                                    type="text"
                                    value={userData.latitude || '0.0000'}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-mono text-[11px] mt-1 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <span className="text-slate-400 block">Longitude</span>
                                <input
                                    type="text"
                                    value={userData.longitude || '0.0000'}
                                    readOnly
                                    disabled
                                    className="input input-sm input-disabled w-full bg-slate-100 text-slate-500 font-mono text-[11px] mt-1 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">GPS coordinates are updated automatically via browser location services.</p>
                    </div>

                    {/* Submit Action Button */}
                    <div className="pt-2 pb-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary w-full text-white bg-gradient-to-r from-violet-600 to-pink-600 border-none flex items-center justify-center gap-2"
                        >
                            {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </MainLayout>
    );
}