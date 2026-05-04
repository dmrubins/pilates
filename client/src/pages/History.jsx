import { useState } from 'react';
import { useSessions } from '../hooks/useSessions.js';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) return 'Today';
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function History() {
  const { sessions, loading, error, removeSession } = useSessions();
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);

  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    setDeleting(id);
    await removeSession(id).catch(() => {});
    setDeleting(null);
  };

  // Group by date
  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort().reverse();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">History</h1>
        <Link to="/log" className="text-accent-light text-sm">+ Log workout</Link>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {dates.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted mb-3">No workouts logged yet.</p>
          <Link to="/log" className="btn-primary inline-block">Log your first workout</Link>
        </div>
      )}

      <div className="space-y-4">
        {dates.map((date) => (
          <div key={date}>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">
              {formatDate(date)}
            </p>
            <div className="space-y-2">
              {grouped[date].map((session) => (
                <div key={session.id} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => toggleExpand(session.id)}
                      className="text-left flex-1"
                    >
                      <p className="font-medium text-text-primary text-sm">
                        {session.exercises?.length ?? 0} exercise{session.exercises?.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.exercises?.slice(0, 3).map((e) => (
                          <span key={e.id} className="text-xs bg-accent-glow text-accent-light px-2 py-0.5 rounded-full">
                            {e.name}
                          </span>
                        ))}
                        {(session.exercises?.length ?? 0) > 3 && (
                          <span className="text-xs text-text-muted">+{session.exercises.length - 3} more</span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deleting === session.id}
                      className="text-text-muted hover:text-red-400 transition-colors p-1"
                      aria-label="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {expanded[session.id] && session.exercises?.length > 3 && (
                    <div className="mt-2 pt-2 border-t border-accent-glow/30">
                      <div className="flex flex-wrap gap-1">
                        {session.exercises.map((e) => (
                          <Link
                            key={e.id}
                            to={`/exercises/${e.id}`}
                            className="text-xs bg-accent-glow text-accent-light px-2 py-0.5 rounded-full hover:bg-accent transition-colors"
                          >
                            {e.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {session.notes && (
                    <p className="text-text-muted text-xs mt-2 italic border-t border-accent-glow/30 pt-2">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
