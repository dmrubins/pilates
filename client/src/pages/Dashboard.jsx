import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises.js';
import { useSessions } from '../hooks/useSessions.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  let streak = 0;
  const today = getToday();
  let cursor = new Date(today);

  for (const date of dates) {
    const d = cursor.toISOString().slice(0, 10);
    if (date === d) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function Dashboard() {
  const today = getToday();
  const { exercises, loading: exLoading } = useExercises();
  const { sessions, loading: sessLoading } = useSessions();
  const { sessions: todaySessions } = useSessions(today);
  const [suggestion, setSuggestion] = useState(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const streak = getStreak(sessions);

  useEffect(() => {
    if (!exercises.length) return;
    const doneIds = new Set(
      todaySessions.flatMap((s) => s.exercises?.map((e) => e.id) ?? [])
    );
    const pool = exercises.filter((e) => !doneIds.has(e.id));
    if (pool.length) {
      setSuggestion(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [exercises, todaySessions]);

  const loading = exLoading || sessLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">{greeting}</p>
          <h1 className="text-xl font-bold text-text-primary">Torque &amp; Tension</h1>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center bg-accent-glow rounded-2xl px-3 py-2">
            <span className="text-lg">🔥</span>
            <span className="text-accent-light text-xs font-bold">{streak} day{streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Today's sessions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-text-primary">Today</h2>
          <Link to="/log" className="text-accent-light text-sm">+ Log workout</Link>
        </div>
        {todaySessions.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-text-muted text-sm">No workouts logged yet today</p>
            <Link to="/log" className="btn-primary inline-block mt-3 text-sm">Start a session</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <div key={s.id} className="card">
                <p className="text-sm text-text-muted">{s.exercises?.length ?? 0} exercise{s.exercises?.length !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.exercises?.map((e) => (
                    <span key={e.id} className="text-xs bg-accent-glow text-accent-light px-2 py-0.5 rounded-full">{e.name}</span>
                  ))}
                </div>
                {s.notes && <p className="text-text-muted text-xs mt-1.5 italic">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate workout CTA */}
      <Link
        to="/generate"
        className="block card bg-gradient-to-r from-accent-glow to-bg-surface border border-accent-glow hover:border-accent transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-text-primary">Generate a Workout</p>
            <p className="text-text-muted text-sm mt-0.5">Pick duration, difficulty &amp; body parts</p>
          </div>
          <span className="text-2xl">✨</span>
        </div>
      </Link>

      {/* Suggested exercise */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-text-primary">Suggested for you</h2>
          <Link to="/exercises" className="text-accent-light text-sm">Browse all</Link>
        </div>
        {loading ? (
          <LoadingSpinner text="Finding suggestions…" />
        ) : suggestion ? (
          <ExerciseCard exercise={suggestion} />
        ) : (
          <div className="card text-center py-6">
            <p className="text-text-muted text-sm">All exercises done today! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
