import { Link } from 'react-router-dom';

const DIFFICULTY_COLORS = {
  Easy:    'text-green-400',
  Medium:  'text-yellow-400',
  Hard:    'text-orange-400',
  Unknown: 'text-text-muted',
};

export function getFirstPhoto(exercise) {
  try {
    const arr = JSON.parse(exercise.photo_filenames || '[]');
    return arr[0] || null;
  } catch { return null; }
}

export default function ExerciseCard({ exercise, selected, onSelect }) {
  const photo = getFirstPhoto(exercise);
  const hasCheckbox = onSelect !== undefined;
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] || 'text-text-muted';

  const content = (
    <>
      {photo ? (
        <div className="aspect-video bg-bg-primary rounded-xl overflow-hidden mb-3">
          <img
            src={`/images/${photo}`}
            alt={exercise.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video bg-bg-primary rounded-xl mb-3 flex items-center justify-center">
          <span className="text-4xl">🧘</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-text-primary leading-tight text-sm">{exercise.name}</h3>
        {hasCheckbox && (
          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            selected ? 'bg-accent border-accent' : 'border-text-muted'
          }`}>
            {selected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {exercise.body_part && (
          <span className="text-xs bg-accent-glow text-accent-light px-2 py-0.5 rounded-full">
            {exercise.body_part}
          </span>
        )}
        {exercise.difficulty && (
          <span className={`text-xs ${diffColor}`}>{exercise.difficulty}</span>
        )}
        {exercise.duration_minutes && (
          <span className="text-xs text-text-muted">{exercise.duration_minutes} min</span>
        )}
      </div>
    </>
  );

  if (hasCheckbox) {
    return (
      <button
        onClick={() => onSelect(exercise)}
        className={`card text-left w-full cursor-pointer transition-all ${
          selected ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-accent-glow'
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={`/exercises/${exercise.id}`} className="card block hover:ring-1 hover:ring-accent-glow transition-all">
      {content}
    </Link>
  );
}
