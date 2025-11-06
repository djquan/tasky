interface DatePickerProps {
  value: number | null;
  onChange: (date: number | null) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label = 'Date' }: DatePickerProps) {
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (!dateStr) {
      onChange(null);
      return;
    }
    const date = new Date(dateStr);
    onChange(date.getTime());
  };

  const handleClear = () => {
    onChange(null);
  };

  const quickOptions = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
      }
    },
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
      label: 'Next Week',
      getValue: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek.getTime();
      }
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>
        <input
          type="date"
          value={formatDate(value)}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* Quick options */}
      <div className="flex gap-2">
        {quickOptions.map(option => (
          <button
            key={option.label}
            onClick={() => onChange(option.getValue())}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>

      {value && (
        <button
          onClick={handleClear}
          className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear Date
        </button>
      )}
    </div>
  );
}
