import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { CircleX, CircleCheck } from 'lucide-react';

import Layout from '../components/Layouts/SetupLayout';
import { setupAdvancedProfileHandler } from '../tanstack/user';
import { UPLOAD_PICTURE_TEXT } from '../functions/constants';
import HelmetHeader from '../components/HelmetHeader';
import SubmitButton from '../components/SubmitButton';
import { unsetErrorSetMessage, unsetMessageSetError } from '../functions/utils';

// 🟢 REMOVED GLOBAL ARRAYS/OBJECTS ENTIRELY

function ImageUploadBox({ id, position, imagePreview, onImageUpdate }) {
    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            // 🟢 Send the file and preview back up to parent state immediately
            onImageUpdate(id, previewUrl, file);
        }
    }, [id, onImageUpdate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
    });

    const removeImageHander = event => {
        event.stopPropagation();
        onImageUpdate(id, null, null);
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
            <article {...getRootProps()} style={boxStyle}>
                <input {...getInputProps()} />
                {imagePreview ? (
                    <>
                        <img
                            src={imagePreview}
                            alt='Preview'
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className='flex justify-center items-center text-gray-100 font-extrabold absolute bg-gray-600 w-6 h-6 
                            rounded-[100%] -bottom-1 -right-1 z-20' onClick={removeImageHander}>x</div>
                    </>
                ) : (
                    <div className='w-full h-full flex flex-col items-center justify-center'>
                        {/* 🟢 position parameter always counts 1 to 6 reliably now */}
                        <p className={`flex justify-center items-center w-6 h-6 p-2 rounded-full font-bold bg-black text-white text-base ${isDragActive ? 'text-[#0070f3]' : ''}`}>{position}</p>
                        <p className={`text-[12px] ${isDragActive ? 'text-[#0070f3]' : ''}`}>
                            {isDragActive ? 'Drop the image here...' : (<span className='text-[32px] font-extrabold'>+</span>)}
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

export default function AdvancedProfile() {
    // 🟢 Keep the files, previews, and IDs bound together in one reactive array
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [items, setItems] = useState([
        { id: '1', imagePreview: null, file: null },
        { id: '2', imagePreview: null, file: null },
        { id: '3', imagePreview: null, file: null },
        { id: '4', imagePreview: null, file: null },
        { id: '5', imagePreview: null, file: null },
        { id: '6', imagePreview: null, file: null },
    ]);

    useEffect(() => {
        // console.log({ items });
    }, [items])

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
    );

    // 🟢 Handler to assign a file to a unique container slot ID
    const handleImageUpdate = (id, previewUrl, file) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, imagePreview: previewUrl, file } : item
            )
        );
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems(prevItems => {
                const oldIndex = prevItems.findIndex(item => item.id === active.id);
                const newIndex = prevItems.findIndex(item => item.id === over.id);
                // 🟢 arrayMove now automatically moves the ID, preview, AND raw file together perfectly
                return arrayMove(prevItems, oldIndex, newIndex);
            });
        }
    };

    // 💡 Pro tip: When you're ready to submit to your backend api:
    // const filesOnlyArray = items.map(item => item.file); // Holds files in the current visual order!

    async function handleUpload(event) {
        event.preventDefault();
        setLoading(true);

        try {
            let position = 1;
            const newItemsData = [];

            for (const value of items) {
                const file = value.file;
                if (file) {
                    newItemsData.push({ position, file });
                    position++;
                }
            }

            const formData = new FormData();

            Array.from(newItemsData).forEach(file => {
                formData.append('images', file.file);
                formData.append('imagesBody', JSON.stringify(file));
            });

            const response = await setupAdvancedProfileHandler(formData);
            const { success, message } = response;

            if (success) {
                unsetErrorSetMessage(setError, setMessage, message);
                toast.success(message, { autoClose: 5000, theme: 'colored' });
                // navigate(advancedProfilePath);
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

            <form className="w-full flex flex-col items-center space-y-6" onSubmit={handleUpload}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 gap-2 mx-auto">
                            {items.map((item, index) => (
                                <SortableBox
                                    key={item.id}
                                    id={item.id}
                                    position={index + 1} // Index calculates sequentially on every render
                                    imagePreview={item.imagePreview}
                                    onImageUpdate={handleImageUpdate}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {error && (
                    <div role="alert" className="alert alert-error fade-in">
                        <CircleX />
                        <span>{error}</span>
                    </div>
                )}
                {message && (
                    <div role="alert" className="alert alert-success fade-in">
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