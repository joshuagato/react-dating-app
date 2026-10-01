import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import {
    CircleX, CircleCheck, MapPin, Camera, RefreshCw, ShieldCheck,
    UserCheck, X, Loader2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { CameraPreview } from '@capacitor-community/camera-preview';
import * as faceapi from '@vladmandic/face-api';
import imageCompression from 'browser-image-compression';

import Layout from '../components/Layouts/SetupLayout';
import { setupAdvancedProfileHandler } from '../tanstack/user';
import { UPLOAD_PICTURE_TEXT, finalProfilePath } from '../utils/constants';
import HelmetHeader from '../components/HelmetHeader';
import SubmitButton from '../components/SubmitButton';
import { unsetErrorSetMessage, unsetMessageSetError } from '../utils/functions';

// Selfie compression target — keeps payload well under the 6 MB Netlify
// function limit even after multipart encoding overhead.
const SELFIE_MAX_SIZE_MB = 0.8;
const SELFIE_MAX_DIMENSION = 1080;

/**
 * Convert a base64 data URI into a Blob for FormData upload.
 */
function dataUriToBlob(dataUri) {
    const [meta, base64] = dataUri.split(',');
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}

export default function AdvancedProfile() {
    const navigate = useNavigate();
    const videoRef = useRef(null);

    // Form & UI States
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [webStream, setWebStream] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Verification Data States
    const [locationData, setLocationData] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedImageFile, setCapturedImageFile] = useState(null);

    // Non-dismissible location error modal
    const [showLocationErrorModal, setShowLocationErrorModal] = useState(false);

    // 1. Preload Face API Models & Handle Unmount Cleanup
    useEffect(() => {
        let isMounted = true;

        const loadFaceModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                if (isMounted) setModelsLoaded(true);
            } catch (err) {
                console.error('Error loading face detection models:', err);
            }
        };

        loadFaceModels();

        return () => {
            isMounted = false;
            if (Capacitor.isNativePlatform()) {
                CameraPreview.stop().catch(() => { });
            }
        };
    }, []);

    // Clean up web stream tracks when component unmounts
    useEffect(() => {
        return () => {
            if (webStream) {
                webStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [webStream]);

    // 2. Location Fetching & Reverse Geocoding
    const handleGetLocation = async () => {
        setFetchingLocation(true);
        setError('');
        try {
            if (Capacitor.isNativePlatform()) {
                const status = await Geolocation.checkPermissions();
                if (status.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (requestStatus.location === 'denied') {
                        throw new Error('Location permission was denied.');
                    }
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
            });

            const { latitude: lat, longitude: lon } = position.coords;

            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                {
                    headers: {
                        'User-Agent': 'DatingApp/1.0 (contact@joshuagato.online)',
                    },
                }
            );

            if (!res.ok) throw new Error('Failed to resolve location address.');
            const data = await res.json();
            const address = data.address || {};

            const resolvedLocation = {
                latitude: lat,
                longitude: lon,
                city:
                    address.city ||
                    address.town ||
                    address.village ||
                    address.suburb ||
                    'Unknown City',
                country: address.country || 'Unknown Country',
                country_code: (address.country_code || '').toLowerCase() || null,
            };

            setLocationData(resolvedLocation);
            toast.success('Location acquired successfully!');
        } catch (err) {
            // Show the blocking modal instead of falling back to manual entry.
            // The user must fix their device permissions and refresh.
            setShowLocationErrorModal(true);
        } finally {
            setFetchingLocation(false);
        }
    };

    // 3. Dual-Mode Camera Controls
    const handleStartCamera = async () => {
        setError('');
        try {
            if (Capacitor.isNativePlatform()) {
                const container = document.getElementById(
                    'camera-preview-container'
                );
                const width = container ? container.clientWidth : 280;
                const height = container ? container.clientHeight : 280;

                await CameraPreview.start({
                    position: 'front',
                    parent: 'camera-preview-container',
                    width,
                    height,
                    toBack: false,
                    className: 'camera-preview-element',
                });
            } else {
                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {
                    throw new Error(
                        'Camera access is not supported or allowed in this browser context.'
                    );
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 640 },
                    },
                    audio: false,
                });

                setWebStream(stream);
                setIsCameraActive(true);

                setTimeout(async () => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        try {
                            await videoRef.current.play();
                        } catch (e) {
                            console.error('Error playing web camera stream:', e);
                        }
                    }
                }, 100);
            }

            setIsCameraActive(true);
        } catch (err) {
            console.error('Camera Access Error:', err);
            const friendlyMessage =
                err.message ||
                'Unable to start camera. Please check camera permissions.';
            setError(friendlyMessage);
            toast.error('Unable to start camera.');
        }
    };

    const handleStopCamera = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                await CameraPreview.stop();
            } else if (webStream) {
                webStream.getTracks().forEach((track) => track.stop());
                setWebStream(null);
            }
        } catch (err) {
            console.error('Error stopping camera:', err);
        } finally {
            setIsCameraActive(false);
        }
    };

    const handleCaptureSnapshot = async () => {
        setIsAnalyzing(true);
        setError('');

        try {
            let rawBase64 = '';

            if (Capacitor.isNativePlatform()) {
                const result = await CameraPreview.capture({ quality: 85 });
                rawBase64 = `data:image/jpeg;base64,${result.value}`;
            } else {
                const video = videoRef.current;
                if (!video) throw new Error('Video stream not active');

                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 320;

                const ctx = canvas.getContext('2d');
                // Flip horizontally so the saved image matches the mirrored
                // preview the user just saw.
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                rawBase64 = canvas.toDataURL('image/jpeg', 0.85);
            }

            // Face presence check against the RAW capture (before compression)
            if (modelsLoaded) {
                const img = new Image();
                img.src = rawBase64;
                await img.decode();

                const detection = await faceapi.detectSingleFace(
                    img,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5,
                    })
                );

                if (!detection) {
                    toast.error(
                        'No clear face detected. Ensure good lighting and look straight at the camera.'
                    );
                    setIsAnalyzing(false);
                    return;
                }

                if (detection.score < 0.6) {
                    toast.warn(
                        'Photo is too blurry or dark. Hold still in a well-lit area.'
                    );
                    setIsAnalyzing(false);
                    return;
                }
            }

            // Compress aggressively for upload.
            const blob = dataUriToBlob(rawBase64);
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

            const compressedFile = await imageCompression(file, {
                maxSizeMB: SELFIE_MAX_SIZE_MB,
                maxWidthOrHeight: SELFIE_MAX_DIMENSION,
                useWebWorker: true,
                fileType: 'image/jpeg',
                initialQuality: 0.85,
            });

            const compressedDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(compressedFile);
            });

            setCapturedImage(compressedDataUri);
            setCapturedImageFile(compressedFile);
            await handleStopCamera();
            toast.success('Clear selfie verified & captured!');
        } catch (err) {
            console.error('Error during capture/validation:', err);
            toast.error('Failed to analyze image clarity. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 4. Final Profile Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!locationData) {
            const msg = 'Please capture your location before completing setup.';
            setError(msg);
            toast.warn(msg);
            return;
        }

        if (!capturedImageFile) {
            const msg = 'Please take a live selfie before completing setup.';
            setError(msg);
            toast.warn(msg);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('verifiedSelfie', capturedImageFile, 'selfie.jpg');
            formData.append('city', locationData.city);
            formData.append('country', locationData.country);
            formData.append('country_code', locationData.country_code || '');
            formData.append('latitude', String(locationData.latitude ?? 0));
            formData.append('longitude', String(locationData.longitude ?? 0));

            const response = await setupAdvancedProfileHandler(formData);

            if (response.success) {
                unsetErrorSetMessage(setError, setMessage, response.message);
                toast.success(response.message);
                navigate(finalProfilePath, { replace: true });
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message);
            }
        } catch (err) {
            const errMsg =
                err.message || 'An error occurred during profile setup.';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshPage = () => {
        window.location.reload();
    };

    return (
        <Layout heading={UPLOAD_PICTURE_TEXT}>
            <HelmetHeader pageTitle={'Advanced Setup Step'} />

            <div className="w-full max-w-md mx-auto space-y-6 px-4 py-2">
                {/* Location Section */}
                <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <MapPin className="text-primary w-5 h-5" /> Location
                        Verification
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        We need your location to find matches nearby.
                    </p>

                    {locationData ? (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-sm flex justify-between items-center">
                            <div>
                                <p className="font-medium text-success-content">
                                    {locationData.city}, {locationData.country}
                                </p>
                                <p className="text-xs text-base-content/60">
                                    {locationData.latitude.toFixed(4)},{' '}
                                    {locationData.longitude.toFixed(4)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="btn btn-ghost btn-xs text-primary"
                            >
                                Re-sync
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={fetchingLocation}
                            className="btn btn-outline btn-primary w-full gap-2"
                        >
                            {fetchingLocation && (
                                <span className="loading loading-spinner loading-xs" />
                            )}
                            <MapPin className="w-4 h-4" />
                            {fetchingLocation
                                ? 'Fetching Location...'
                                : 'Capture Location'}
                        </button>
                    )}
                </div>

                {/* Facial Capture Section */}
                <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-primary w-5 h-5" /> Live
                        Facial Capture
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        Take a clear, well-lit photo of your face to verify
                        your profile.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div
                            id="camera-preview-container"
                            className={`relative w-full aspect-square max-w-[280px] bg-black rounded-xl overflow-hidden shadow-inner ${!isCameraActive ? 'hidden' : 'block'
                                }`}
                        >
                            {!Capacitor.isNativePlatform() && (
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover -scale-x-100"
                                />
                            )}

                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center text-white gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-xs font-medium">
                                        Checking image clarity...
                                    </span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleStopCamera}
                                disabled={isAnalyzing}
                                className="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral z-20"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleCaptureSnapshot}
                                disabled={isAnalyzing}
                                className="absolute bottom-3 left-1/2 -translate-x-1/2 btn btn-primary btn-circle shadow-lg z-20"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>

                        {capturedImage && !isCameraActive && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-44 h-44 rounded-xl overflow-hidden border-2 border-primary shadow-sm">
                                    <img
                                        src={capturedImage}
                                        alt="Captured Selfie"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleStartCamera}
                                        className="absolute top-2 right-2 btn btn-circle btn-xs btn-neutral"
                                        title="Retake Photo"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="badge badge-success gap-1 text-xs py-2">
                                    <UserCheck className="w-3.5 h-3.5" />{' '}
                                    Verified Selfie Captured
                                </div>
                            </div>
                        )}

                        {!isCameraActive && !capturedImage && (
                            <button
                                type="button"
                                onClick={handleStartCamera}
                                className="btn btn-primary w-full gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Open Camera
                            </button>
                        )}
                    </div>
                </div>

                {/* Form Submission */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div
                            role="alert"
                            className="alert alert-error text-sm py-2"
                        >
                            <CircleX className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div
                            role="alert"
                            className="alert alert-success text-sm py-2"
                        >
                            <CircleCheck className="w-4 h-4 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    <SubmitButton loading={loading}>
                        Complete Setup
                    </SubmitButton>
                </form>
            </div>

            {/* ============================================================ */}
            {/* Location Error Modal — non-dismissible                        */}
            {/* ============================================================ */}
            {showLocationErrorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden text-white">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-amber-500 to-rose-500 px-6 pt-7 pb-5 text-center">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight">
                                Location is required
                            </h2>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4 text-sm text-slate-300 leading-relaxed">
                            <p>
                                We couldn't access your location. To continue
                                with your profile setup, please:
                            </p>

                            <ul className="space-y-2.5 text-slate-200">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <span>
                                        Turn on <strong>Location</strong> or
                                        GPS on your device
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <span>
                                        Allow this site to access your
                                        location when your browser asks
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <span>
                                        If you've previously blocked it, open
                                        your browser settings and set location
                                        access to <strong>Allow</strong> for
                                        this site
                                    </span>
                                </li>
                            </ul>

                            <p className="text-xs text-slate-400 pt-1">
                                Once you've made these changes, tap the button
                                below to reload the page.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 pt-1">
                            <button
                                type="button"
                                onClick={handleRefreshPage}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}