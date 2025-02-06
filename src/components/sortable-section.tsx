import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableSectionProps {
  id: string;
  title: string;
  isChecked: boolean;
  onToggle: () => void;
}

export function SortableSection({ id, title, isChecked, onToggle }: SortableSectionProps) {
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
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        className="cursor-grab hover:text-blue-600 focus:outline-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={onToggle}
        className="h-4 w-4 text-blue-600 rounded"
      />
      <label htmlFor={id} className="flex-1 text-gray-700">
        {title}
      </label>
    </div>
  );
}