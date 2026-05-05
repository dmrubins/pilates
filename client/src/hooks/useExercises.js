import { useState, useEffect, useCallback } from 'react';
import { getExercises, getBodyParts } from '../api/exercises.js';

export function useExercises(filters = {}) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const key = JSON.stringify(filters);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getExercises(JSON.parse(key))
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => { load(); }, [load]);

  return { exercises, loading, error, reload: load };
}

export function useBodyParts() {
  const [bodyParts, setBodyParts] = useState([]);
  useEffect(() => { getBodyParts().then(setBodyParts).catch(() => {}); }, []);
  return bodyParts;
}
