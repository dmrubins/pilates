import { useSearchParams, Link } from 'react-router-dom';
import { useExercises, useBodyParts } from '../hooks/useExercises.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function ExerciseBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const bodyParts = useBodyParts();

  const filters = {
    difficulty:   searchParams.get('difficulty') || undefined,
    body_part:    searchParams.get('body_part') || undefined,
    max_duration: searchParams.get('max_duration') ? parseInt(searchParams.get('max_duration')) : undefined,
  };

  const { exercises, loading, error } = useExercises(filters);

  const setFilters = (next) => {
    const params = {};
    if (next.difficulty)   params.difficulty = next.difficulty;
    if (next.body_part)    params.body_part = next.body_part;
    if (next.max_duration) params.max_duration = String(next.max_duration);
    setSearchParams(params, { replace: true });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Exercises</h1>
        <Link to="/exercises/new" className="btn-primary text-sm py-1.5 px-3">+ New</Link>
      </div>

      <FilterBar filters={filters} onChange={setFilters} bodyParts={bodyParts} />

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && exercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted mb-3">No exercises match your filters.</p>
          <Link to="/exercises/new" className="btn-primary inline-block">Add one</Link>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}
