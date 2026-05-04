const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SchedulePicker({ days, time, onDaysChange, onTimeChange }) {
  const toggleDay = (day) => {
    if (days.includes(day)) {
      onDaysChange(days.filter((d) => d !== day));
    } else {
      onDaysChange([...days, day]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              days.includes(day)
                ? 'bg-accent text-white'
                : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-muted whitespace-nowrap">Remind at</label>
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="input text-sm py-1.5 w-auto"
        />
      </div>
    </div>
  );
}
