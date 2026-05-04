export default function FilterBar({ filters, onChange, bodyParts }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        className="input text-sm py-1.5 w-auto flex-1 min-w-28"
        value={filters.body_part || ''}
        onChange={(e) => update('body_part', e.target.value || undefined)}
      >
        <option value="">All body parts</option>
        {bodyParts.map((bp) => (
          <option key={bp} value={bp}>{bp}</option>
        ))}
      </select>

      <select
        className="input text-sm py-1.5 w-auto flex-1 min-w-28"
        value={filters.ease || ''}
        onChange={(e) => update('ease', e.target.value ? parseInt(e.target.value) : undefined)}
      >
        <option value="">Any ease</option>
        <option value="1">Beginner</option>
        <option value="2">Easy</option>
        <option value="3">Moderate</option>
        <option value="4">Hard</option>
        <option value="5">Advanced</option>
      </select>

      <select
        className="input text-sm py-1.5 w-auto flex-1 min-w-32"
        value={`${filters.max_duration || ''}`}
        onChange={(e) => {
          const v = e.target.value;
          update('max_duration', v ? parseInt(v) : undefined);
        }}
      >
        <option value="">Any duration</option>
        <option value="5">Up to 5 min</option>
        <option value="10">Up to 10 min</option>
        <option value="15">Up to 15 min</option>
        <option value="30">Up to 30 min</option>
      </select>
    </div>
  );
}
