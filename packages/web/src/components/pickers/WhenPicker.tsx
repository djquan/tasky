import type { WhenValue } from '@tasky/shared';

interface WhenPickerProps {
  value: WhenValue;
  scheduledDate?: number | null;
  onChange: (when: WhenValue) => void;
  onScheduledDateChange?: (date: number | null) => void;
}

const whenOptions: Array<{ value: WhenValue; label: string; icon: string; description: string }> = [
  { value: 'today', label: 'Today', icon: '⭐', description: 'Do this today' },
  { value: 'evening', label: 'This Evening', icon: '🌆', description: 'Do this evening' },
  { value: 'anytime', label: 'Anytime', icon: '📋', description: 'No specific time' },
  { value: 'someday', label: 'Someday', icon: '🌙', description: 'Maybe later' }
];
// Note: 'Inbox' is not a when value - it's a dynamic filter for unorganized tasks

export function WhenPicker({ value, scheduledDate, onChange, onScheduledDateChange }: WhenPickerProps) {
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onScheduledDateChange) return;

    const dateStr = e.target.value;
    if (!dateStr) {
      onScheduledDateChange(null);
      return;
    }
    const date = new Date(dateStr);
    onScheduledDateChange(date.getTime());
  };

  const quickDateOptions = [
    {
      label: 'Tomorrow',
      getValue: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
      }
    },
    {
      label: 'This Weekend',
      getValue: () => {
        const date = new Date();
        const day = date.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilSaturday);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
    },
    {
      label: 'Next Week',
      getValue: () => {
        const date = new Date();
        const day = date.getDay();
        const daysUntilMonday = (1 - day + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilMonday);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* When options */}
      <div className="space-y-1">
        {whenOptions.map(option => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              value === option.value && !scheduledDate
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-base">{option.icon}</span>
            <div className="flex-1 text-left">
              <div className="text-xs">{option.label}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{option.description}</div>
            </div>
            {value === option.value && !scheduledDate && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Date picker */}
      {onScheduledDateChange && (
        <div className="pt-3 border-t border-light-border dark:border-dark-border">
          <label className="block mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">📅 Specific Date</span>
            <input
              type="date"
              value={formatDate(scheduledDate ?? null)}
              onChange={handleDateChange}
              className="w-full px-3 py-1.5 border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-hover text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
            />
          </label>

          {/* Quick date options */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {quickDateOptions.map(option => (
              <button
                type="button"
                key={option.label}
                onClick={() => onScheduledDateChange(option.getValue())}
                className="px-2 py-1.5 text-xs border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>

          {scheduledDate && (
            <button
              type="button"
              onClick={() => onScheduledDateChange(null)}
              className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
