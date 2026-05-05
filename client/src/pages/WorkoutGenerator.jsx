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

export default function WorkoutGenerator() {
  const navigate = useNavigate();

  // Inputs
  const [duration, setDuration] = useState(20);
  const [difficulty, setDifficulty] = useState('');
  const [bodyParts, setBodyParts] = useState([]);
  const [customPart, setCustomPart] = useState('');

  // Results
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Logging
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);

  const toggleBodyPart = (part) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const addCustomPart = () => {
    const p = customPart.trim();
    if (p && !bodyParts.includes(p)) setBodyParts((prev) => [...prev, p]);
    setCustomPart('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await suggestExercises({ duration, difficulty: difficulty || null, bodyParts });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => handleGenerate();

  const handleLog = async () => {
    if (!result?.exercises?.length) return;
    setLogging(true);
    setLogError(null);
    try {
      await createSession({
        date: getToday(),
        notes: `Generated workout — ${result.estimated_minutes} min · ${difficulty || 'Any'} difficulty`,
        exercise_ids: result.exercises.map((e) => e.id),
      });
      navigate('/history');
    } catch (e) {
      setLogError(e.message);
      setLogging(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Generate Workout</h1>

      {/* Duration */}
      <section className="card mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Duration</h2>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                duration === d
                  ? 'bg-accent text-white'
                  : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="card mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Difficulty</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDifficulty('')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              difficulty === ''
                ? 'bg-accent text-white'
                : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
            }`}
          >
            Any
          </button>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d === difficulty ? '' : d)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                difficulty === d
                  ? 'bg-accent text-white'
                  : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Body parts */}
      <section className="card mb-5">
        <h2 className="font-semibold text-text-primary mb-3">Body Parts <span className="text-text-muted font-normal text-xs">(optional)</span></h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {BODY_PART_SUGGESTIONS.map((part) => (
            <button
              key={part}
              onClick={() => toggleBodyPart(part)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                bodyParts.includes(part)
                  ? 'bg-accent text-white'
                  : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              {part}
            </button>
          ))}
          {bodyParts.filter(p => !BODY_PART_SUGGESTIONS.includes(p)).map((part) => (
            <button
              key={part}
              onClick={() => toggleBodyPart(part)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-accent text-white"
            >
              {part} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input text-sm py-1.5 flex-1"
            placeholder="Add custom body part…"
            value={customPart}
            onChange={(e) => setCustomPart(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomPart()}
          />
          <button onClick={addCustomPart} className="btn-ghost text-sm px-3 py-1.5">Add</button>
        </div>
      </section>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full mb-6 text-base py-3"
      >
        {loading ? 'Generating…' : 'Generate Workout'}
      </button>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Results */}
      {loading && <LoadingSpinner text="Finding the best exercises…" />}

      {result && !loading && (
        <div>
          {/* Summary bar */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                Your Workout
                <span className="ml-2 text-accent-light font-normal text-sm">
                  ~{result.estimated_minutes} min
                </span>
              </h2>
              <p className="text-text-muted text-xs mt-0.5">
                {result.exercises.length} exercise{result.exercises.length !== 1 ? 's' : ''}
                {result.estimated_minutes > result.target_minutes + 2
                  ? ` · ${result.estimated_minutes - result.target_minutes} min over target (best available fit)`
                  : ''}
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              className="text-accent-light text-sm border border-accent-glow px-3 py-1.5 rounded-lg hover:bg-accent-glow transition-colors"
            >
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

              {logError && <p className="text-red-400 text-sm mb-3">{logError}</p>}

              <div className="flex gap-3 pb-4">
                <button
                  onClick={handleGenerate}
                  className="btn-ghost flex-1"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleLog}
                  disabled={logging}
                  className="btn-primary flex-1"
                >
                  {logging ? 'Logging…' : 'Log this workout'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
