import type { RecurrenceRule, RecurrenceFrequency } from '@tasky/shared';

interface RecurrencePickerProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const frequencyOptions: Array<{ value: RecurrenceFrequency; label: string; icon: string }> = [
  { value: 'daily', label: 'Daily', icon: '🔄' },
  { value: 'weekdays', label: 'Weekdays', icon: '🏢' },
  { value: 'weekly', label: 'Weekly', icon: '📅' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'yearly', label: 'Yearly', icon: '🎂' }
];

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const handleFrequencyChange = (freq: RecurrenceFrequency) => {
    onChange({
      frequency: freq,
      interval: 1,
      endsAt: null
    });
  };

  const handleIntervalChange = (interval: number) => {
    if (!value) return;
    onChange({
      ...value,
      interval: Math.max(1, interval)
    });
  };

  const clearRecurrence = () => {
    onChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {/* No Recurrence Option */}
        <button
          type="button"
          onClick={clearRecurrence}
          className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors ${
            value === null
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-base">🚫</span>
          <div className="text-xs">Do not repeat</div>
          {value === null && (
            <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
          )}
        </button>

        {/* Frequency Options */}
        {frequencyOptions.map(option => (
          <button
            type="button"
            key={option.value}
            onClick={() => handleFrequencyChange(option.value)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              value?.frequency === option.value
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-base">{option.icon}</span>
            <div className="text-xs">{option.label}</div>
            {value?.frequency === option.value && (
              <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Interval (only show if recurrence is selected) */}
      {value && (
        <div className="pt-3 border-t border-light-border dark:border-dark-border px-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700 dark:text-gray-300">
              Repeat every
            </label>
            <input
              type="number"
              min="1"
              value={value.interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-xs border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-hover text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {value.frequency === 'daily' && (value.interval === 1 ? 'day' : 'days')}
              {value.frequency === 'weekdays' && (value.interval === 1 ? 'day' : 'days')}
              {value.frequency === 'weekly' && (value.interval === 1 ? 'week' : 'weeks')}
              {value.frequency === 'monthly' && (value.interval === 1 ? 'month' : 'months')}
              {value.frequency === 'yearly' && (value.interval === 1 ? 'year' : 'years')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
