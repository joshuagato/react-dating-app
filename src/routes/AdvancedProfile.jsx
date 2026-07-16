import { useState, useCallback } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';

import Layout from '../components/Layout';
import { UPLOAD_PICTURE_TEXT } from '../functions/constants';
import HelmetHeader from '../components/HelmetHeader';
import { useEffect } from 'react';

let imagesArray = new Array(6);
const imagesObject = {};
function ImageUploadBox({ id, index }) {
    const [imagePreview, setImagePreview] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        
        if (file) {
            // Create a local URL for the preview image
            setImagePreview(URL.createObjectURL(file));

            // Here you would typically append the file to FormData
            // and upload it to your server using fetch or axios.
            console.log('File ready for upload:', file);
            imagesArray[index] = file;
            imagesObject[index] = file;
        }
    }, [index]);

    console.log({imagesArray, imagesObject})

    useEffect(() => {
       
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] }, // Restrict to image files only
        multiple: false, // Allow only one image at a time
    });

    const removeImageHander = event => {
        event.stopPropagation();
        setImagePreview(null);
    }

    // Inline styling for the "Box" container
    const boxStyle = {
        // width: '110px',
        // height: '144px',
        // padding: '2px',
        // position: 'relative',
        // overflow: 'hidden',
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
                            rounded-[100%] -bottom-1 -right-1' onClick={removeImageHander}>x</div>
                    </>
                ) : isDragActive ? (
                    <div>
                        <p className='text-[#0070f3] text-base'># {id}</p>
                        <p className='text-[#0070f3] text-[12px]'>Drop the image here...</p>
                    </div>
                ) : (
                    <div>
                        <p className='text-base'># {id}</p>
                        <p className='text-[12px]'>Drag & drop an image here, or click to select...index: {index}</p>
                    </div>
                )}
            </article>
        </div>
    );
}

// Individual Grid Item Component
function SortableBox({ id, index }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
        // className="flex items-center justify-center bg-violet-400 text-white font-bold h-36 w-full 
        //     rounded-lg shadow-md cursor-grab active:cursor-grabbing select-none"
    >
        {/* Box {id} */}
        <ImageUploadBox id={id} index={index} />
    </div>
  );
}

// Main Grid Container Component
export default function AdvancedProfile() {
    const [items, setItems] = useState([1, 2, 3, 4, 5, 6]);

    // 2. Configure sensors for both Desktop (Mouse) and Mobile (Touch)
    const sensors = useSensors(
        useSensor(MouseSensor, {
            // Requiring a 5px movement before triggering prevents accidental clicks from turning into drags
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            // CRUCIAL: Delay drag by 250ms with a 5px tolerance window 
            // This ensures normal page scrolling still works unless the user intentionally long-presses to sort
            // activationConstraint: { delay: 250, tolerance: 5 },
            activationConstraint: { distance: 5 },
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        console.log({active, over, event})
        
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                imagesArray = arrayMove(imagesArray, oldIndex, newIndex);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
  };

  return (
    <Layout heading={UPLOAD_PICTURE_TEXT}>

        <HelmetHeader pageTitle={'Pictures'} />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {/* rectSortingStrategy is required for multi-column grids */}
            <SortableContext items={items} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-2 mx-auto">
                    {items.map((id, index) => (
                        <SortableBox key={id} id={id} index={index} />
                    ))}

                    
                </div>
            </SortableContext>
        </DndContext>
    </Layout>
  );
}
