import { useState } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../components/Layout';
import { UPLOAD_PICTURE_TEXT } from '../functions/constants';
import HelmetHeader from '../components/HelmetHeader';

// Individual Grid Item Component
function SortableBox({ id }) {
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
        className="flex items-center justify-center bg-violet-400 text-white font-bold h-36 w-full 
            rounded-lg shadow-md cursor-grab active:cursor-grabbing select-none"
    >
        Box {id}
    </div>
  );
}

// Main Grid Container Component
export default function ProfilePicture() {
    const [items, setItems] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);

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
        
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
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
                    {items.map((id) => (
                        <SortableBox key={id} id={id} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    </Layout>
  );
}
