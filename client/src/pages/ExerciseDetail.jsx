import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExercise } from '../api/exercises.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const EASE_LABELS = ['', 'Beginner', 'Easy', 'Moderate', 'Hard', 'Advanced'];
const EASE_COLORS = ['', 'text-green-400', 'text-lime-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExercise(id)
      .then(setExercise)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-400 p-4">{error}</p>;
  if (!exercise) return null;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-text-muted text-sm mb-4 hover:text-text-primary"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {exercise.photo_filename ? (
        <div className="rounded-2xl overflow-hidden mb-5 bg-bg-surface aspect-video">
          <img
            src={`/images/${exercise.photo_filename}`}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-bg-surface aspect-video flex items-center justify-center mb-5">
          <span className="text-6xl">🧘</span>
        </div>
      )}

      <h1 className="text-2xl font-bold text-text-primary mb-3">{exercise.name}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-accent text-white text-sm px-3 py-1 rounded-full">
          {exercise.body_part}
        </span>
        <span className="bg-bg-surface text-text-muted text-sm px-3 py-1 rounded-full">
          ⏱ {exercise.duration_minutes} min
        </span>
        <span className={`bg-bg-surface text-sm px-3 py-1 rounded-full ${EASE_COLORS[exercise.ease_level]}`}>
          {EASE_LABELS[exercise.ease_level]}
        </span>
      </div>

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
