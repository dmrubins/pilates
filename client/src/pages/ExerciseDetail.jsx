import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExercise, deleteExercise } from '../api/exercises.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const DIFFICULTY_COLORS = {
  Easy:   'text-green-400',
  Medium: 'text-yellow-400',
  Hard:   'text-orange-400',
};

function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) {
    return (
      <div className="rounded-2xl bg-bg-surface aspect-video flex items-center justify-center mb-5">
        <span className="text-6xl">🧘</span>
      </div>
    );
  }

  return (
    <div className="mb-5 relative">
      <div className="rounded-2xl overflow-hidden bg-bg-surface aspect-video">
        <img
          src={`/images/${photos[idx]}`}
          alt={`Step ${idx + 1}`}
          className="w-full h-full object-contain"
        />
      </div>
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >‹</button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
          >›</button>
          <div className="flex justify-center gap-1.5 mt-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-accent' : 'bg-text-muted/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function parseInstructions(text) {
  if (!text) return [];
  // Split on numbered steps like "1 " or "1. " at the start of a segment
  const steps = text.split(/\n/).map(s => s.trim()).filter(Boolean);
  if (steps.length > 1) return steps;
  // Try splitting on digit followed by space
  return text.split(/(?=\d+\s)/).map(s => s.trim()).filter(Boolean);
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getExercise(id)
      .then(setExercise)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${exercise.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteExercise(id);
      navigate('/exercises', { replace: true });
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <p className="text-red-400 p-4">{error}</p>;
  if (!exercise) return null;

  let photos = [];
  try { photos = JSON.parse(exercise.photo_filenames || '[]'); } catch {}

  const steps = parseInstructions(exercise.instructions);
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] || 'text-text-muted';

  return (
    <div>
      {/* Back + action buttons */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex gap-2">
          <Link
            to={`/exercises/${id}/edit`}
            className="text-xs text-accent-light border border-accent-glow px-3 py-1.5 rounded-lg hover:bg-accent-glow transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <PhotoCarousel photos={photos} />

      <h1 className="text-2xl font-bold text-text-primary mb-3">{exercise.name}</h1>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {exercise.body_part && (
          <span className="bg-accent text-white text-sm px-3 py-1 rounded-full">{exercise.body_part}</span>
        )}
        {exercise.difficulty && (
          <span className={`bg-bg-surface text-sm px-3 py-1 rounded-full ${diffColor}`}>{exercise.difficulty}</span>
        )}
        {exercise.duration_minutes && (
          <span className="bg-bg-surface text-text-muted text-sm px-3 py-1 rounded-full">⏱ {exercise.duration_minutes} min</span>
        )}
        {exercise.sets && (
          <span className="bg-bg-surface text-text-muted text-sm px-3 py-1 rounded-full">{exercise.sets} sets</span>
        )}
        {exercise.reps && (
          <span className="bg-bg-surface text-text-muted text-sm px-3 py-1 rounded-full">{exercise.reps} reps</span>
        )}
      </div>

      {/* Instructions */}
      {steps.length > 0 && (
        <div className="card mb-5">
          <h2 className="font-semibold text-text-primary mb-3">Instructions</h2>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-muted leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-glow text-accent-light text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step.replace(/^\d+\s*\.?\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {exercise.description && (
        <div className="card mb-5">
          <p className="text-text-muted text-sm leading-relaxed">{exercise.description}</p>
        </div>
      )}

      <Link
        to={`/log?exercise=${exercise.id}`}
        className="btn-primary w-full text-center block"
      >
        Log this exercise
      </Link>
    </div>
  );
}
