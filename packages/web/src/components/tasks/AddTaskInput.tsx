import { useState } from 'react';
import { createTask } from '../../lib/tasks';
import type { WhenValue } from '@tasky/shared';

interface AddTaskInputProps {
  when?: WhenValue;
  projectId?: string;
  areaId?: string;
  placeholder?: string;
}

export function AddTaskInput({
  when = 'anytime',  // Default to anytime (inbox is a dynamic filter, not a when value)
  projectId,
  areaId,
  placeholder = 'Add a task...'
}: AddTaskInputProps) {
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      notes: '',
      when,
      scheduledDate: null,
      deadline: null,
      tags: [],
      checklistItems: [],
      projectId: projectId || null,
      areaId: areaId || null,
      headingId: null,
      completed: false,
      canceled: false,
      sortOrder: Date.now()
    });

    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div
        className={`flex items-center gap-3 p-3 bg-white rounded-lg border-2 transition-colors ${
          isFocused ? 'border-blue-500' : 'border-gray-200'
        }`}
      >
        <span className="text-blue-500 text-xl">+</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm"
        />
        {title && (
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        )}
      </div>
    </form>
  );
}
