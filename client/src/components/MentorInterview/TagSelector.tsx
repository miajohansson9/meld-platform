import React, { useState, useCallback } from 'react';

interface TagSelectorProps {
  options: string[];
  onSubmit: (tags: string[]) => Promise<void>;
  disabled?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({ options, onSubmit, disabled = false }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagClick = useCallback(
    (tag: string) => {
      if (disabled || isSubmitting) return;

      setSelectedTags((prev) => {
        if (prev.includes(tag)) {
          // Remove tag if already selected
          return prev.filter((t) => t !== tag);
        } else if (prev.length < 3) {
          // Add tag if less than 3 selected
          return [...prev, tag];
        }
        // Don't add if already have 3
        return prev;
      });
    },
    [disabled, isSubmitting],
  );

  const handleSubmit = useCallback(async () => {
    if (selectedTags.length !== 3 || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedTags);
    } catch (error) {
      console.error('Error submitting tags:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTags, onSubmit, disabled, isSubmitting]);

  const isTagSelected = useCallback((tag: string) => selectedTags.includes(tag), [selectedTags]);

  return (
    <div className="mt-6 rounded-lg border border-[#C9C9B6] bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold text-gray-800">
        Select 3 keywords that best describe your answer:
      </h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {options.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            disabled={disabled || isSubmitting}
            className={`rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
              isTagSelected(tag)
                ? 'border-[#B04A2F] bg-[#B04A2F] text-white'
                : 'border-[#C9C9B6] bg-white text-gray-700 hover:border-[#B04A2F] hover:text-[#B04A2F]'
            } border disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{selectedTags.length}/3 keywords selected</p>

        <button
          onClick={handleSubmit}
          disabled={selectedTags.length !== 3 || disabled || isSubmitting}
          className={`rounded-lg px-6 py-2 font-medium transition-all duration-200 ${
            selectedTags.length === 3 && !disabled && !isSubmitting
              ? 'bg-[#B04A2F] text-white hover:bg-[#8F3A25]'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          } `}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default TagSelector;
