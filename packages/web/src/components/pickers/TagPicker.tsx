import { useState } from 'react';
import { useTags } from '../../hooks/useEntities';
import { createTag } from '../../lib/tags';
import { DEFAULT_TAG_COLOR } from '../../constants';

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
      color: DEFAULT_TAG_COLOR,
      sortOrder: Date.now()
    });

    onChange([...selectedTags, tag.id]);
    setNewTagName('');
    setShowNewTag(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
        <button
          type="button"
          onClick={() => setShowNewTag(!showNewTag)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500"
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
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm"
          >
            Add
          </button>
        </div>
      )}

      {/* Tag list */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No tags yet</p>
        ) : (
          tags.map(tag => (
            <button
              type="button"
              key={tag.id}
              onClick={() => handleToggleTag(tag.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <span className="text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
