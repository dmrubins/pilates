import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useExercises, useBodyParts } from '../hooks/useExercises.js';
import { createSession } from '../api/sessions.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkoutLogger() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('exercise') ? parseInt(searchParams.get('exercise')) : null;

  const [step, setStep] = useState(1); // 1: pick exercises, 2: add notes
  const [selected, setSelected] = useState(preselectedId ? [preselectedId] : []);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getToday());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({});
  const bodyParts = useBodyParts();
  const { exercises, loading } = useExercises(filters);

  const toggleSelect = (exercise) => {
    if (selected.includes(exercise.id)) {
      setSelected((s) => s.filter((id) => id !== exercise.id));
      setSelectedExercises((s) => s.filter((e) => e.id !== exercise.id));
    } else {
      setSelected((s) => [...s, exercise.id]);
      setSelectedExercises((s) => [...s, exercise]);
    }
  };

  const handleSubmit = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSession({ date, notes: notes.trim() || null, exercise_ids: selected });
      navigate('/history');
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Log Workout</h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-5">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-accent' : 'bg-bg-surface'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <p className="text-text-muted text-sm mb-3">Select exercises you did</p>
          <FilterBar filters={filters} onChange={setFilters} bodyParts={bodyParts} />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selected={selected.includes(ex.id)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
          )}

          <button
            className="btn-primary w-full"
            disabled={!selected.length}
            onClick={() => setStep(2)}
          >
            Next — {selected.length} selected
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-2">Selected exercises</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedExercises.map((e) => (
                <span key={e.id} className="text-xs bg-accent text-white px-2.5 py-1 rounded-full">
                  {e.name}
                </span>
              ))}
              {preselectedId && !selectedExercises.length && (
                <span className="text-xs text-text-muted">Exercise #{preselectedId}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              max={getToday()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="How did it feel? Any modifications?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(1)}>Back</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
