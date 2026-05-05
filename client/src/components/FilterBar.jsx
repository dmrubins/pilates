export default function FilterBar({ filters, onChange, bodyParts }) {
  const update = (key, value) => onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        className="input text-sm py-1.5 w-auto flex-1 min-w-28"
        value={filters.difficulty || ''}
        onChange={(e) => update('difficulty', e.target.value)}
      >
        <option value="">Any difficulty</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      {bodyParts.length > 0 && (
        <select
          className="input text-sm py-1.5 w-auto flex-1 min-w-28"
          value={filters.body_part || ''}
          onChange={(e) => update('body_part', e.target.value)}
        >
          <option value="">All body parts</option>
          {bodyParts.map((bp) => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>
      )}

      <select
        className="input text-sm py-1.5 w-auto flex-1 min-w-32"
        value={filters.max_duration || ''}
        onChange={(e) => update('max_duration', e.target.value)}
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
