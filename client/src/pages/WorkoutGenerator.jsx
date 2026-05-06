import { useState } from 'react';
import { suggestExercises } from '../api/exercises.js';
import { createCollection } from '../api/collections.js';
import { useBodyParts, useDifficulties } from '../hooks/useExercises.js';
import { ActiveWorkout } from '../components/ActiveWorkout.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60];

// ─── Main generator ──────────────────────────────────────────────────────────

export default function WorkoutGenerator() {
  const availableBodyParts = useBodyParts();
  const availableDifficulties = useDifficulties();

  const [duration, setDuration] = useState(20);
  const [difficulty, setDifficulty] = useState('');
  const [bodyParts, setBodyParts] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save-as-collection state
  const [showSave, setShowSave] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | Error

  // 'setup' | 'results' | 'active'
  const [mode, setMode] = useState('setup');

  const toggleBodyPart = (part) =>
    setBodyParts(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSave(false);
    setSaveStatus(null);
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

  const handleSaveCollection = async () => {
    if (!collectionName.trim()) return;
    setSaveStatus('saving');
    try {
      await createCollection(collectionName.trim(), result.exercises.map(e => e.id));
      setSaveStatus('saved');
      setShowSave(false);
      setCollectionName('');
    } catch (e) {
      setSaveStatus(e);
    }
  };

  if (mode === 'active' && result) {
    return (
      <ActiveWorkout
        exercises={result.exercises}
        sessionLabel={difficulty || 'Any difficulty'}
        onFinish={() => setMode('results')}
        onExit={() => setMode('results')}
      />
    );
  }

  if (mode === 'results') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setMode('setup')}
            className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold">Generate Workout</h1>
        </div>

        {loading && <LoadingSpinner text="Finding the best exercises…" />}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

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

                {/* Save as collection */}
                {saveStatus === 'saved' ? (
                  <p className="text-center text-sm text-accent-light mb-3">Saved to collections!</p>
                ) : showSave ? (
                  <div className="card mb-3 flex flex-col gap-2">
                    <input
                      autoFocus
                      value={collectionName}
                      onChange={e => setCollectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveCollection()}
                      placeholder="Collection name…"
                      className="w-full bg-bg-surface-2 text-text-primary placeholder-text-muted rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {saveStatus instanceof Error && (
                      <p className="text-red-400 text-xs">{saveStatus.message}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => { setShowSave(false); setSaveStatus(null); }} className="btn-ghost flex-1 py-2 text-sm">
                        Cancel
                      </button>
                      <button onClick={handleSaveCollection} disabled={saveStatus === 'saving' || !collectionName.trim()} className="btn-primary flex-1 py-2 text-sm">
                        {saveStatus === 'saving' ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowSave(true)} className="btn-ghost w-full mb-3 text-sm">
                    Save as Collection
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // mode === 'setup'
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
          {availableDifficulties.map((d) => (
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
        <div className="flex flex-wrap gap-2">
          {availableBodyParts.map((part) => (
            <button key={part} onClick={() => toggleBodyPart(part)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                bodyParts.includes(part) ? 'bg-accent text-white' : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'
              }`}>{part}</button>
          ))}
        </div>
      </section>

      <button onClick={handleGenerate} disabled={loading}
        className="btn-primary w-full mb-6 text-base py-3">
        Generate Workout
      </button>
    </div>
  );
}
