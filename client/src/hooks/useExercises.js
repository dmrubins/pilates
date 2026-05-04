import { useState, useEffect } from 'react';
import { getExercises, getBodyParts } from '../api/exercises.js';

export function useExercises(filters = {}) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getExercises(filters)
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { exercises, loading, error };
}

export function useBodyParts() {
  const [bodyParts, setBodyParts] = useState([]);

  useEffect(() => {
    getBodyParts().then(setBodyParts).catch(() => {});
  }, []);

  return bodyParts;
}
