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
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              value === option.value && !scheduledDate
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">{option.icon}</span>
            <div className="flex-1 text-left">
              <div>{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
            {value === option.value && !scheduledDate && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Date picker */}
      {onScheduledDateChange && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block mb-2">
            <span className="text-sm font-medium text-gray-700 mb-1 block">📅 Specific Date</span>
            <input
              type="date"
              value={formatDate(scheduledDate ?? null)}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </label>

          {/* Quick date options */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {quickDateOptions.map(option => (
              <button
                key={option.label}
                onClick={() => onScheduledDateChange(option.getValue())}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>

          {scheduledDate && (
            <button
              onClick={() => onScheduledDateChange(null)}
              className="w-full mt-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
