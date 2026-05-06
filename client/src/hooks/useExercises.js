import { useState, useEffect, useCallback } from 'react';
import { getExercises, getBodyParts, getDifficulties } from '../api/exercises.js';

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

const DIFFICULTY_ORDER = ['Easy', 'Medium', 'Hard', 'Unknown'];

export function useDifficulties() {
  const [difficulties, setDifficulties] = useState([]);
  useEffect(() => {
    getDifficulties()
      .then(list => setDifficulties(
        [...list].sort((a, b) => {
          const ai = DIFFICULTY_ORDER.indexOf(a);
          const bi = DIFFICULTY_ORDER.indexOf(b);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
      ))
      .catch(() => {});
  }, []);
  return difficulties;
}
