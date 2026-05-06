import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, addExercisesToSession } from '../api/sessions.js';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function PhotoCarousel({ photos }) {
  const [idx, setIdx] = useState(0);
  if (!photos.length) return (
    <div className="rounded-2xl bg-bg-surface-2 aspect-video flex items-center justify-center mb-4">
      <span className="text-6xl">🧘</span>
    </div>
  );
  return (
    <div className="mb-4 relative">
      <div className="rounded-2xl overflow-hidden aspect-video bg-bg-surface-2">
        <img src={`/images/${photos[idx]}`} alt="" className="w-full h-full object-contain" />
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

// sessionLabel appears in the session notes, e.g. "Medium difficulty" or "My Collection"
export function ActiveWorkout({ exercises, sessionLabel = 'Any', onFinish, onExit }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState(null);
  const [finished, setFinished] = useState(false);

  const ex = exercises[idx];
  let photos = [];
  try { photos = JSON.parse(ex.photo_filenames || '[]'); } catch {}
  const steps = parseSteps(ex.instructions);
  const isFirst = idx === 0;
  const isLast = idx === exercises.length - 1;
  const alreadyDone = done.includes(ex.id);

  const complete = async () => {
    if (alreadyDone) {
      if (isLast) setFinished(true);
      else setIdx(i => i + 1);
      return;
    }
    setLogging(true);
    setLogError(null);
    try {
      if (!sessionId) {
        const session = await createSession({
          date: getToday(),
          notes: `Workout — ${sessionLabel}`,
          exercise_ids: [ex.id],
        });
        setSessionId(session.id);
      } else {
        await addExercisesToSession(sessionId, [ex.id]);
      }
      setDone(prev => [...prev, ex.id]);
      if (isLast) setFinished(true);
      else setIdx(i => i + 1);
    } catch (e) {
      setLogError(e.message);
    } finally {
      setLogging(false);
    }
  };

  const skip = () => {
    if (isLast) setFinished(true);
    else setIdx(i => i + 1);
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
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header: exit left, counter center, prev right */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-text-muted text-sm hover:text-text-primary">✕ Exit</button>
        <span className="text-sm font-semibold text-accent-light">{idx + 1} / {exercises.length}</span>
        <button
          onClick={() => setIdx(i => i - 1)}
          disabled={isFirst}
          className="text-text-muted text-sm hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
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
          {logging ? 'Saving…' : alreadyDone
            ? (isLast ? 'Finish' : 'Next →')
            : isLast ? '✓ Complete workout' : '✓ Done, next →'}
        </button>
      </div>
    </div>
  );
}
