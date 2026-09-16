import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, GraduationCap, Heart, Sparkles, Cigarette, Wine, Ruler, CircleX, CircleCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import SetupLayout from '../components/Layouts/SetupLayout';
import HelmetHeader from '../components/HelmetHeader';
import { encountersPath } from '../utils/constants';
import { completeProfileSetupHandler } from '../tanstack/user';

const REASON_OPTIONS = [
    'Long-term relationship',
    'Casual dating',
    'Hook Up',
    'New friends',
    'Marriage',
    'Not sure yet'
];

const EDUCATION_OPTIONS = [
    'High School',
    'Undergraduate Degree',
    'Postgraduate Degree',
    'Doctorate / PhD',
    'Trade / Vocational School',
    'Prefer not to say'
];

const RELATIONSHIP_OPTIONS = ['Single', 'Divorced', 'Widowed', 'Separated'];
const LIFESTYLE_OPTIONS = ['Never', 'Occasionally', 'Socially', 'Regularly'];

export default function ProfilePageSetup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        bio: '',
        reason_on_app: '',
        education: '',
        relationship_status: 'Single',
        height_cm: '',
        smoking: 'Never',
        drinking: 'Socially'
    });

    const handleChange = (field, value) => {
        setGeneralError('');
        setMessage('');
        setFieldErrors(prev => ({ ...prev, [field]: null }));

        if (field === 'bio') {
            const truncatedValue = value.slice(0, 300);
            setFormData(prev => ({ ...prev, [field]: truncatedValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        setMessage('');
        setFieldErrors({});

        try {
            setLoading(true);
            const response = await completeProfileSetupHandler(formData);

            if (response.errors) {
                setFieldErrors(response.errors);
                const firstKey = Object.keys(response.errors)[0];
                const topErr = response.errors[firstKey]?.[0] || 'Please fix the errors below.';
                toast.error(topErr, { autoClose: 5000, theme: 'colored' });
                return;
            }

            if (response.success) {
                const successMsg = response.message || 'Profile setup completed successfully!';
                setMessage(successMsg);
                toast.success(successMsg, { autoClose: 5000, theme: 'colored' });
                setTimeout(() => {
                    navigate(encountersPath, { replace: true });
                }, 1500);
            } else {
                const errMsg = response.message || 'Failed to update profile setup.';
                setGeneralError(errMsg);
                toast.error(errMsg, { autoClose: 5000, theme: 'colored' });
            }
        } catch (err) {
            console.error('Failed to submit setup:', err);
            const errMsg = err?.response?.data?.message || 'An unexpected error occurred.';
            setGeneralError(errMsg);
            toast.error(errMsg, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SetupLayout heading="Complete Your Profile">
            <HelmetHeader pageTitle={'Profile Page'} />

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Feedback Alerts */}
                {generalError && (
                    <div role="alert" className="alert alert-error fade-in flex items-center gap-2 text-red-600">
                        <CircleX />
                        <span>{generalError}</span>
                    </div>
                )}
                {message && (
                    <div role="alert" className="alert alert-success fade-in flex items-center gap-2 text-green-600">
                        <CircleCheck />
                        <span>{message}</span>
                    </div>
                )}

                {/* 1. About Me (Bio) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-violet-600" /> About Me *
                    </label>
                    <textarea
                        rows={3}
                        maxLength={300}
                        placeholder="Write a few words about your interests, passions, or personality..."
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:outline-none text-sm bg-white resize-none ${fieldErrors.bio ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-violet-500'
                            }`}
                        required
                    />
                    {fieldErrors.bio?.[0] && (
                        <p className="text-xs text-red-600 font-medium">{fieldErrors.bio[0]}</p>
                    )}
                    <span className="text-[10px] text-slate-400 block text-right">
                        {formData.bio.length}/300 characters
                    </span>
                </div>

                {/* 2. Reason on the App */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-pink-600" /> Looking For *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {REASON_OPTIONS.map((option) => (
                            <button
                                type="button"
                                key={option}
                                onClick={() => handleChange('reason_on_app', option)}
                                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${formData.reason_on_app === option
                                    ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                                    : fieldErrors.reason_on_app
                                        ? 'bg-white border-red-300 text-slate-600 hover:border-red-500'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {fieldErrors.reason_on_app?.[0] && (
                        <p className="text-xs text-red-600 font-medium">{fieldErrors.reason_on_app[0]}</p>
                    )}
                </div>

                {/* 3. Education Level */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-500" /> Education Level *
                    </label>
                    <select
                        value={formData.education}
                        onChange={(e) => handleChange('education', e.target.value)}
                        className={`w-full p-3 rounded-xl border bg-white text-sm font-medium text-slate-700 focus:ring-2 focus:outline-none ${fieldErrors.education ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-violet-500'
                            }`}
                        required
                    >
                        <option value="" disabled>Select highest education</option>
                        {EDUCATION_OPTIONS.map((edu) => (
                            <option key={edu} value={edu}>{edu}</option>
                        ))}
                    </select>
                    {fieldErrors.education?.[0] && (
                        <p className="text-xs text-red-600 font-medium">{fieldErrors.education[0]}</p>
                    )}
                </div>

                {/* 4. Extra Lifestyle Attributes */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifestyle & Traits</h4>

                    {/* Height */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-emerald-500" /> Height (cm)
                            </span>
                            <input
                                type="number"
                                placeholder="175"
                                value={formData.height_cm}
                                onChange={(e) => handleChange('height_cm', e.target.value)}
                                className={`w-20 p-1.5 border rounded-lg text-xs text-center focus:outline-none focus:ring-1 ${fieldErrors.height_cm ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-violet-500'
                                    }`}
                            />
                        </div>
                        {fieldErrors.height_cm?.[0] && (
                            <p className="text-xs text-red-600 font-medium">{fieldErrors.height_cm[0]}</p>
                        )}
                    </div>

                    {/* Relationship Status */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-rose-500" /> Relationship Status
                        </span>
                        <div className="flex gap-2 overflow-x-auto py-1">
                            {RELATIONSHIP_OPTIONS.map((status) => (
                                <button
                                    type="button"
                                    key={status}
                                    onClick={() => handleChange('relationship_status', status)}
                                    className={`py-1.5 px-3 rounded-full text-xs font-medium border whitespace-nowrap ${formData.relationship_status === status
                                        ? 'bg-slate-800 border-slate-800 text-white'
                                        : 'bg-white border-slate-200 text-slate-600'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        {fieldErrors.relationship_status?.[0] && (
                            <p className="text-xs text-red-600 font-medium">{fieldErrors.relationship_status[0]}</p>
                        )}
                    </div>

                    {/* Smoking / Drinking Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                                <Cigarette className="w-4 h-4 text-slate-500" /> Smoking
                            </span>
                            <select
                                value={formData.smoking}
                                onChange={(e) => handleChange('smoking', e.target.value)}
                                className={`w-full p-2 rounded-xl border bg-white text-xs font-medium ${fieldErrors.smoking ? 'border-red-500' : 'border-slate-200'
                                    }`}
                            >
                                {LIFESTYLE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {fieldErrors.smoking?.[0] && (
                                <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.smoking[0]}</p>
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                                <Wine className="w-4 h-4 text-purple-500" /> Drinking
                            </span>
                            <select
                                value={formData.drinking}
                                onChange={(e) => handleChange('drinking', e.target.value)}
                                className={`w-full p-2 rounded-xl border bg-white text-xs font-medium ${fieldErrors.drinking ? 'border-red-500' : 'border-slate-200'
                                    }`}
                            >
                                {LIFESTYLE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {fieldErrors.drinking?.[0] && (
                                <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.drinking[0]}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Saving Profile...' : 'Complete Profile'}
                </button>
            </form>
        </SetupLayout>
    );
}