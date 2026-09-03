import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { CircleX, CircleCheck, AlertTriangle, Loader2, Info } from 'lucide-react';

import Layout from '../components/Layouts/SetupLayout';
import { setupFinalProfileHandler, getVerificationSelfieHandler } from '../tanstack/user';
import { encountersPath, UPLOAD_PICTURE_TEXT } from '../utils/constants';
import HelmetHeader from '../components/HelmetHeader';
import SubmitButton from '../components/SubmitButton';
import { unsetErrorSetMessage, unsetMessageSetError } from '../utils/functions';
import { compressImage, compareFaces } from '../utils/imageProcessing';

function ImageUploadBox({ id, position, imagePreview, onImageUpdate }) {
    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            onImageUpdate(id, file, position);
        }
    }, [id, position, onImageUpdate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
    });

    const removeImageHandler = event => {
        event.stopPropagation();
        onImageUpdate(id, null, position, true);
    };

    const boxStyle = {
        width: '100%',
        height: '100%',
        border: isDragActive ? '2px dashed #0070f3' : '2px dashed #cccccc',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f7ff' : '#fafafa',
        textAlign: 'center',
    };

    return (
        <div className='relative w-27.5 h-36'>
            {/* Visual Temporary Position Overlay Badge */}
            <div className='absolute top-2 left-2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 text-white font-black text-sm shadow-md border-2 border-white pointer-events-none'>
                {position}
            </div>

            <article {...getRootProps()} style={boxStyle}>
                <input {...getInputProps()} />
                {imagePreview ? (
                    <>
                        <img
                            src={imagePreview}
                            alt='Preview'
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        {/* Remove Image Button */}
                        <div
                            className='flex justify-center items-center text-gray-100 font-extrabold absolute bg-red-600 hover:bg-red-700 w-6 h-6 rounded-full -bottom-1 -right-1 z-20 cursor-pointer shadow-md'
                            onClick={removeImageHandler}
                        >
                            ×
                        </div>
                    </>
                ) : (
                    <div className='w-full h-full flex flex-col items-center justify-center'>
                        <span className={`text-[32px] font-extrabold ${isDragActive ? 'text-[#0070f3]' : 'text-gray-400'}`}>
                            +
                        </span>
                        <p className={`text-[11px] font-medium ${isDragActive ? 'text-[#0070f3]' : 'text-gray-500'}`}>
                            {isDragActive ? 'Drop here' : 'Add Photo'}
                        </p>
                    </div>
                )}
            </article>
        </div>
    );
}

function SortableBox({ id, position, imagePreview, onImageUpdate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} title='Click to Upload or Drag and Drop'>
            <ImageUploadBox
                id={id}
                position={position}
                imagePreview={imagePreview}
                onImageUpdate={onImageUpdate}
            />
        </div>
    );
}

export default function FinalProfile() {
    const [loading, setLoading] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [selfieUrl, setSelfieUrl] = useState(null);

    // Modal state for validation result feedback and warnings
    const [modalInfo, setModalInfo] = useState({ isOpen: false, success: false, title: '', message: '' });

    const selfieImgRef = useRef(null);
    const navigate = useNavigate();

    const [items, setItems] = useState([
        { id: '1', imagePreview: null, file: null },
        { id: '2', imagePreview: null, file: null },
        { id: '3', imagePreview: null, file: null },
        { id: '4', imagePreview: null, file: null },
        { id: '5', imagePreview: null, file: null },
        { id: '6', imagePreview: null, file: null },
    ]);

    // Fetch user's verification selfie on mount
    useEffect(() => {
        async function fetchSelfie() {
            try {
                const response = await getVerificationSelfieHandler();
                if (response.success && response.data.base64) {
                    setSelfieUrl(response.data.base64);
                } else {
                    setError('Verification selfie not found. Please upload a selfie first.');
                }
            } catch (err) {
                setError('Failed to retrieve verification selfie record.');
            }
        }
        fetchSelfie();
    }, []);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
    );

    // Handle drag and drop reordering without modifying image files
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            setItems(prev => arrayMove(prev, oldIndex, newIndex));
        }
    };

    /**
     * Handles Upload Pipeline:
     * 1. Lossless Compression
     * 2. Face Verification against loaded Selfie
     * 3. Set Preview and Store Unwatermarked File
     */
    const handleImageUpdate = async (id, file, position, isRemove = false) => {
        if (isRemove || !file) {
            setItems(prev => prev.map(item => item.id === id ? { ...item, imagePreview: null, file: null } : item));
            return;
        }

        setProcessingImage(true);

        try {
            // 1. Lossless Compress
            const compressedFile = await compressImage(file);

            // Create temporary HTML Image element for Face-API processing
            const tempUploadedImg = document.createElement('img');
            const previewUrl = URL.createObjectURL(compressedFile);
            tempUploadedImg.src = previewUrl;
            await new Promise((res) => (tempUploadedImg.onload = res));

            // 2. Face Match against Verification Selfie
            if (selfieImgRef.current) {
                const matchResult = await compareFaces(selfieImgRef.current, tempUploadedImg);

                if (!matchResult.isMatch) {
                    URL.revokeObjectURL(previewUrl);
                    setModalInfo({
                        isOpen: true,
                        success: false,
                        title: 'Verification Mismatch',
                        message: matchResult.reason || 'The face in this image does not match your stored verification selfie. The image has been discarded.'
                    });
                    setProcessingImage(false);
                    return;
                }
            }

            // 3. Update reactive state with clean compressed file and preview URL
            setItems(prev =>
                prev.map(item => item.id === id ? { ...item, imagePreview: previewUrl, file: compressedFile } : item)
            );

            // Modal feedback for successful image verification
            setModalInfo({
                isOpen: true,
                success: true,
                title: 'Image Verified',
                message: 'Face match confirmed! The image was compressed and added successfully.'
            });

        } catch (err) {
            console.error('Image Processing Error:', err);
            toast.error('An error occurred while validating the image.');
        } finally {
            setProcessingImage(false);
        }
    };

    async function handleUpload(event) {
        event.preventDefault();

        // Count uploaded pictures
        const count = items.filter(item => item.file !== null).length;

        // Enforce minimum 2 pictures requirement
        if (count < 2) {
            setModalInfo({
                isOpen: true,
                success: false,
                title: 'At Least 2 Photos Required',
                message: `You have uploaded ${count} photo${count === 1 ? '' : 's'}. Please upload at least 2 photos before proceeding.`
            });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            items.forEach((item, index) => {
                if (item.file) {
                    formData.append('images', item.file);
                    formData.append('imagesBody', JSON.stringify({ position: index + 1 }));
                }
            });

            const response = await setupFinalProfileHandler(formData);
            const { success, message } = response;

            if (success) {
                unsetErrorSetMessage(setError, setMessage, message);
                toast.success(message, { autoClose: 5000, theme: 'colored' });
                navigate(encountersPath, { replace: true });
            } else {
                unsetMessageSetError(setMessage, setError, message);
                toast.error(message, { autoClose: 5000, theme: 'colored' });
            }
        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout heading={UPLOAD_PICTURE_TEXT}>
            <HelmetHeader pageTitle={'Pictures'} />

            {/* Hidden image element to parse verification selfie for Face-API */}
            {selfieUrl && (
                <img
                    ref={selfieImgRef}
                    src={selfieUrl}
                    alt="Selfie Reference"
                    className="hidden"
                    crossOrigin="anonymous"
                />
            )}

            {/* Processing Overlay Loader */}
            {processingImage && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <p className="font-semibold text-lg">Compressing & Verifying Face Match...</p>
                </div>
            )}

            {/* Modal for Verification / Minimum Photos Validation */}
            {modalInfo.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 text-center shadow-xl space-y-4">
                        <div className="flex justify-center">
                            {modalInfo.success ? (
                                <CircleCheck className="w-12 h-12 text-green-500" />
                            ) : (
                                <AlertTriangle className="w-12 h-12 text-amber-500" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{modalInfo.title}</h3>
                        <p className="text-sm text-gray-600">{modalInfo.message}</p>
                        <button
                            type="button"
                            onClick={() => setModalInfo({ ...modalInfo, isOpen: false })}
                            className="w-full py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleUpload}>

                {/* Top Informational Banner */}
                <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3 text-blue-800">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">
                        Please upload at least <strong>2 photos</strong> to complete your profile setup. You can drag and drop to reorder your photos.
                    </p>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-2 mx-auto">
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

                {error && (
                    <div role="alert" className="alert alert-error fade-in flex items-center gap-2 text-red-600">
                        <CircleX />
                        <span>{error}</span>
                    </div>
                )}
                {message && (
                    <div role="alert" className="alert alert-success fade-in flex items-center gap-2 text-green-600">
                        <CircleCheck />
                        <span>{message}</span>
                    </div>
                )}

                <SubmitButton loading={loading}>
                    Save
                </SubmitButton>
            </form>
        </Layout>
    );
}