import { useState } from 'react';
import { useTags } from '../../hooks/useEntities';
import { createTag } from '../../lib/tags';

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selectedTags, onChange }: TagPickerProps) {
  const { tags } = useTags();
  const [newTagName, setNewTagName] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    const tag = createTag({
      name: newTagName.trim(),
      parentId: null,
      color: '#3B82F6', // Default blue
      sortOrder: Date.now()
    });

    onChange([...selectedTags, tag.id]);
    setNewTagName('');
    setShowNewTag(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tags</span>
        <button
          onClick={() => setShowNewTag(!showNewTag)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showNewTag ? 'Cancel' : '+ New Tag'}
        </button>
      </div>

      {/* New tag input */}
      {showNewTag && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            placeholder="Tag name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
          <button
            onClick={handleCreateTag}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      )}

      {/* Tag list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">No tags yet</p>
        ) : (
          tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleToggleTag(tag.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
              </span>
              {selectedTags.includes(tag.id) && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
