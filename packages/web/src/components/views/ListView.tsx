import { ReactNode, useState, useRef, useEffect } from 'react';

interface ListViewProps {
  title: string;
  icon?: string;
  children: ReactNode;
  onTitleChange?: (newTitle: string) => void;
}

export function ListView({ title, icon, children, onTitleChange }: ListViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== title && onTitleChange) {
      onTitleChange(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          {icon && <span className="text-4xl">{icon}</span>}
          {isEditing && onTitleChange ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-b-2 border-blue-500 dark:border-blue-400 focus:outline-none"
            />
          ) : (
            <span
              onClick={() => onTitleChange && setIsEditing(true)}
              className={onTitleChange ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}
            >
              {title}
            </span>
          )}
        </h1>
      </header>
      {children}
    </div>
  );
}
