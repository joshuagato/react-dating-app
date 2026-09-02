import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { CircleX, CircleCheck, MapPin, Camera, RefreshCw, ShieldCheck, UserCheck, X, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { CameraPreview } from '@capacitor-community/camera-preview';
import * as faceapi from '@vladmandic/face-api';

import Layout from '../components/Layouts/SetupLayout';
import { setupAdvancedProfileHandler } from '../tanstack/user';
import { UPLOAD_PICTURE_TEXT, finalProfilePath } from '../utils/constants';
import HelmetHeader from '../components/HelmetHeader';
import SubmitButton from '../components/SubmitButton';
import { unsetErrorSetMessage, unsetMessageSetError } from '../utils/functions';

export default function AdvancedProfile() {
    const navigate = useNavigate();

    // Form & UI States
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Verification Data States
    const [locationData, setLocationData] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);

    // 1. Preload Face API Models & Handle Unmount Cleanup
    useEffect(() => {
        let isMounted = true;

        const loadFaceModels = async () => {
            try {
                // Load TinyFaceDetector model from public/models folder
                // const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                if (isMounted) setModelsLoaded(true);
            } catch (err) {
                console.error('Error loading face detection models:', err);
            }
        };

        loadFaceModels();

        return () => {
            isMounted = false;
            CameraPreview.stop().catch(() => { });
        };
    }, []);

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
                timeout: 10000
            });

            const { latitude: lat, longitude: lon } = position.coords;

            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
                headers: { 'User-Agent': 'DatingApp/1.0 (contact@joshuagato.online)' }
            });

            if (!res.ok) throw new Error('Failed to resolve location address.');
            const data = await res.json();
            const address = data.address || {};

            const resolvedLocation = {
                latitude: lat,
                longitude: lon,
                city: address.city || address.town || address.village || address.suburb || 'Unknown City',
                country: address.country || 'Unknown Country'
            };

            setLocationData(resolvedLocation);
            toast.success('Location acquired successfully!');
        } catch (err) {
            const errorMsg = err.message || 'Error acquiring location';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setFetchingLocation(false);
        }
    };

    // 3. Camera Controls & Face API Validation (Strategy A)
    const handleStartCamera = async () => {
        setError('');
        try {
            const container = document.getElementById('camera-preview-container');
            const width = container ? container.clientWidth : 280;
            const height = container ? container.clientHeight : 280;

            const cameraPreviewOptions = {
                position: 'front',
                parent: 'camera-preview-container',
                width: width,
                height: height,
                toBack: false,
                className: 'camera-preview-element'
            };

            await CameraPreview.start(cameraPreviewOptions);
            setIsCameraActive(true);
        } catch (err) {
            console.error('Camera Preview Error:', err);
            setError('Unable to start camera. Please check camera permissions.');
            toast.error('Unable to start camera.');
        }
    };

    const handleStopCamera = async () => {
        try {
            await CameraPreview.stop();
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
            const result = await CameraPreview.capture({ quality: 85 });
            const base64Image = `data:image/jpeg;base64,${result.value}`;

            // Strategy A: Validate face presence and clarity immediately
            if (modelsLoaded) {
                const img = new Image();
                img.src = base64Image;
                await img.decode();

                const detection = await faceapi.detectSingleFace(
                    img,
                    new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    })
                );

                if (!detection) {
                    toast.error("No clear face detected. Ensure good lighting and look straight at the camera.");
                    setIsAnalyzing(false);
                    return; // Keeps camera open so user can retry immediately
                }

                if (detection.score < 0.70) {
                    toast.warn("Photo is too blurry or dark. Hold still in a well-lit area.");
                    setIsAnalyzing(false);
                    return; // Keeps camera open so user can retry immediately
                }
            }

            // Quality check passed!
            setCapturedImage(base64Image);
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

        if (!capturedImage) {
            const msg = 'Please take a live selfie before completing setup.';
            setError(msg);
            toast.warn(msg);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await setupAdvancedProfileHandler({
                verifiedSelfie: capturedImage,
                city: locationData.city,
                country: locationData.country,
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });

            if (response.success) {
                unsetErrorSetMessage(setError, setMessage, response.message);
                toast.success(response.message);
                navigate(finalProfilePath, { replace: true });
            } else {
                unsetMessageSetError(setMessage, setError, response.message);
                toast.error(response.message);
            }
        } catch (err) {
            const errMsg = err.message || 'An error occurred during profile setup.';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout heading={UPLOAD_PICTURE_TEXT}>
            <HelmetHeader pageTitle={'Final Setup Step'} />

            <div className="w-full max-w-md mx-auto space-y-6 px-4 py-2">
                {/* Location Section */}
                <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <MapPin className="text-primary w-5 h-5" /> Location Verification
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        We need your location coordinates to find matches nearby.
                    </p>

                    {locationData ? (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-sm flex justify-between items-center">
                            <div>
                                <p className="font-medium text-success-content">{locationData.city}, {locationData.country}</p>
                                <p className="text-xs text-base-content/60">
                                    {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
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
                            {fetchingLocation && <span className="loading loading-spinner loading-xs" />}
                            <MapPin className="w-4 h-4" />
                            {fetchingLocation ? 'Fetching Location...' : 'Capture Location'}
                        </button>
                    )}
                </div>

                {/* Facial Capture Section */}
                <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-primary w-5 h-5" /> Live Facial Capture
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        Take a clear, well-lit photo of your face to verify your profile.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        {/* Live Camera Container Mount Point */}
                        <div
                            id="camera-preview-container"
                            className={`relative w-full aspect-square max-w-[280px] bg-black rounded-xl overflow-hidden shadow-inner ${!isCameraActive ? 'hidden' : 'block'
                                }`}
                        >
                            {/* Analysis Overlay */}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center text-white gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-xs font-medium">Checking image clarity...</span>
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

                        {/* Captured Image Preview */}
                        {capturedImage && !isCameraActive && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-44 h-44 rounded-xl overflow-hidden border-2 border-primary shadow-sm">
                                    <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
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
                                    <UserCheck className="w-3.5 h-3.5" /> Verified Selfie Captured
                                </div>
                            </div>
                        )}

                        {/* Initial Trigger Button */}
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
                        <div role="alert" className="alert alert-error text-sm py-2">
                            <CircleX className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div role="alert" className="alert alert-success text-sm py-2">
                            <CircleCheck className="w-4 h-4 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    <SubmitButton loading={loading}>
                        Complete Setup
                    </SubmitButton>
                </form>
            </div>
        </Layout>
    );
}