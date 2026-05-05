import { Link } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions.js';

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
    if (date === d) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

export default function Dashboard() {
  const today = getToday();
  const { sessions } = useSessions();
  const { sessions: todaySessions } = useSessions(today);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const streak = getStreak(sessions);

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

      {/* Today's sessions */}
      <div>
        <h2 className="font-semibold text-text-primary mb-2">Today</h2>
        {todaySessions.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-text-muted text-sm">No workouts logged yet today</p>
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
    </div>
  );
}
