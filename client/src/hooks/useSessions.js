import { useState, useEffect, useCallback } from 'react';
import { getSessions, createSession, deleteSession } from '../api/sessions.js';

export function useSessions(date) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSessions(date)
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const addSession = useCallback(async (data) => {
    const session = await createSession(data);
    load();
    return session;
  }, [load]);

  const removeSession = useCallback(async (id) => {
    await deleteSession(id);
    load();
  }, [load]);

  return { sessions, loading, error, addSession, removeSession, reload: load };
}
