import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestExercises } from '../api/exercises.js';
import { createSession } from '../api/sessions.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];
const BODY_PART_SUGGESTIONS = [
  'Core', 'Arms', 'Glutes', 'Back', 'Legs', 'Hips',
  'Full Body', 'Side Body', 'Quads',
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Active workout step-through ────────────────────────────────────────────

function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return (
    <div className="rounded-2xl bg-bg-surface-2 aspect-video flex items-center justify-center mb-4">
      <span className="text-6xl">🧘</span>
    </div>
  );
  return (
    <div className="mb-4 relative">
      <div className="rounded-2xl overflow-hidden aspect-video bg-bg-surface-2">
        <img src={`/images/${photos[idx]}`} alt="" className="w-full h-full object-cover" />
      </div>
      {photos.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">‹</button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">›</button>
          <div className="flex justify-center gap-1.5 mt-2">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-accent' : 'bg-text-muted/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function parseSteps(text) {
  if (!text) return [];
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return text.split(/(?=\d+\s)/).map(s => s.trim()).filter(Boolean);
}

function ActiveWorkout({ exercises, difficulty, onFinish, onExit }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState([]); // ids of completed exercises
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);
  const [finished, setFinished] = useState(false);

  const ex = exercises[idx];
  let photos = [];
  try { photos = JSON.parse(ex.photo_filenames || '[]'); } catch {}
  const steps = parseSteps(ex.instructions);
  const isLast = idx === exercises.length - 1;

  const complete = () => {
    const newDone = [...done, ex.id];
    setDone(newDone);
    if (isLast) {
      finishWorkout(newDone);
    } else {
      setIdx(i => i + 1);
    }
  };

  const skip = () => {
    if (isLast) {
      finishWorkout(done);
    } else {
      setIdx(i => i + 1);
    }
  };

  const finishWorkout = async (completedIds) => {
    if (!completedIds.length) { onFinish(); return; }
    setLogging(true);
    setLogError(null);
    try {
      await createSession({
        date: getToday(),
        notes: `Generated workout — ${difficulty || 'Any'} difficulty · ${completedIds.length}/${exercises.length} exercises`,
        exercise_ids: completedIds,
      });
      setFinished(true);
    } catch (e) {
      setLogError(e.message);
      setLogging(false);
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Workout complete!</h2>
        <p className="text-text-muted mb-1">{done.length} exercise{done.length !== 1 ? 's' : ''} logged</p>
        {done.length < exercises.length && (
          <p className="text-text-muted text-sm mb-6">{exercises.length - done.length} skipped</p>
        )}
        <button onClick={() => navigate('/history')} className="btn-primary w-full max-w-xs">
          View in history
        </button>
        <button onClick={onFinish} className="btn-ghost w-full max-w-xs mt-3">
          Back to generator
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-text-muted text-sm hover:text-text-primary">✕ Exit</button>
        <span className="text-sm font-semibold text-accent-light">{idx + 1} / {exercises.length}</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-5">
        {exercises.map((e, i) => (
          <div key={e.id} className={`flex-1 h-1 rounded-full transition-colors ${
            done.includes(e.id) ? 'bg-accent' : i === idx ? 'bg-accent-light' : 'bg-bg-surface'
          }`} />
        ))}
      </div>

      <PhotoCarousel photos={photos} />

      <h2 className="text-xl font-bold text-text-primary mb-2">{ex.name}</h2>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ex.difficulty && (
          <span className="bg-accent text-white text-xs px-3 py-1 rounded-full">{ex.difficulty}</span>
        )}
        {ex.sets && ex.reps && (
          <span className="bg-bg-surface text-text-muted text-xs px-3 py-1 rounded-full">
            {ex.sets} sets × {ex.reps} reps
          </span>
        )}
        {ex.duration_minutes && (
          <span className="bg-bg-surface text-text-muted text-xs px-3 py-1 rounded-full">⏱ {ex.duration_minutes} min</span>
        )}
      </div>

      {/* Instructions */}
      {steps.length > 0 && (
        <div className="card mb-5">
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

      {logError && <p className="text-red-400 text-sm mb-3">{logError}</p>}

      <div className="flex gap-3 pb-6">
        <button onClick={skip} className="btn-ghost flex-none px-5">
          {isLast ? 'Skip & finish' : 'Skip'}
        </button>
        <button onClick={complete} disabled={logging} className="btn-primary flex-1 py-3">
          {logging ? 'Saving…' : isLast ? '✓ Complete workout' : '✓ Done, next →'}
        </button>
      </div>
    </div>
  );
}

// ─── Main generator ──────────────────────────────────────────────────────────

export default function WorkoutGenerator() {
  const [duration, setDuration] = useState(20);
  const [difficulty, setDifficulty] = useState('');
  const [bodyParts, setBodyParts] = useState([]);
  const [customPart, setCustomPart] = useState('');

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 'setup' | 'results' | 'active'
  const [mode, setMode] = useState('setup');

  const toggleBodyPart = (part) =>
    setBodyParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]);

  const addCustomPart = () => {
    const p = customPart.trim();
    if (p && !bodyParts.includes(p)) setBodyParts(prev => [...prev, p]);
    setCustomPart('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setMode('results');
    try {
      const data = await suggestExercises({ duration, difficulty: difficulty || null, bodyParts });
      setResult(data);
    } catch (e) {
      setError(e.message);
      setMode('setup');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'active' && result) {
    return (
      <ActiveWorkout
        exercises={result.exercises}
        difficulty={difficulty}
        onFinish={() => setMode('results')}
        onExit={() => setMode('results')}
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Generate Workout</h1>

      {/* Duration */}
      <section className="card mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Duration</h2>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button key={d} onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                duration === d ? 'bg-accent text-white' : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}>
              {d} min
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="card mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Difficulty</h2>
        <div className="flex gap-2">
          <button onClick={() => setDifficulty('')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              difficulty === '' ? 'bg-accent text-white' : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
            }`}>Any</button>
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDifficulty(d === difficulty ? '' : d)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                difficulty === d ? 'bg-accent text-white' : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}>{d}</button>
          ))}
        </div>
      </section>

      {/* Body parts */}
      <section className="card mb-5">
        <h2 className="font-semibold text-text-primary mb-3">
          Body Parts <span className="text-text-muted font-normal text-xs">(optional)</span>
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {BODY_PART_SUGGESTIONS.map((part) => (
            <button key={part} onClick={() => toggleBodyPart(part)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                bodyParts.includes(part) ? 'bg-accent text-white' : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}>{part}</button>
          ))}
          {bodyParts.filter(p => !BODY_PART_SUGGESTIONS.includes(p)).map((part) => (
            <button key={part} onClick={() => toggleBodyPart(part)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-white">
              {part} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input text-sm py-1.5 flex-1" placeholder="Add custom body part…"
            value={customPart} onChange={(e) => setCustomPart(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomPart()} />
          <button onClick={addCustomPart} className="btn-ghost text-sm px-3 py-1.5">Add</button>
        </div>
      </section>

      <button onClick={handleGenerate} disabled={loading}
        className="btn-primary w-full mb-6 text-base py-3">
        {loading ? 'Generating…' : 'Generate Workout'}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <LoadingSpinner text="Finding the best exercises…" />}

      {/* Results */}
      {result && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                Your Workout
                <span className="ml-2 text-accent-light font-normal text-sm">~{result.estimated_minutes} min</span>
              </h2>
              <p className="text-text-muted text-xs mt-0.5">
                {result.exercises.length} exercise{result.exercises.length !== 1 ? 's' : ''}
                {result.estimated_minutes > result.target_minutes + 2
                  ? ` · ${result.estimated_minutes - result.target_minutes} min over target`
                  : ''}
              </p>
            </div>
            <button onClick={handleGenerate}
              className="text-accent-light text-sm border border-accent-glow px-3 py-1.5 rounded-lg hover:bg-accent-glow transition-colors">
              Shuffle
            </button>
          </div>

          {result.exercises.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-text-muted">No exercises found for those filters.</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting the difficulty or body parts.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {result.exercises.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
              </div>

              <button onClick={() => setMode('active')} className="btn-primary w-full py-3 text-base mb-3">
                ▶ Start Workout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
