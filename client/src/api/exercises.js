import { get } from './client.js';

export function getExercises(filters = {}) {
  const params = new URLSearchParams();
  if (filters.body_part) params.set('body_part', filters.body_part);
  if (filters.min_duration) params.set('min_duration', filters.min_duration);
  if (filters.max_duration) params.set('max_duration', filters.max_duration);
  if (filters.ease) params.set('ease', filters.ease);
  const qs = params.toString();
  return get(`/api/exercises${qs ? '?' + qs : ''}`);
}

export function getExercise(id) {
  return get(`/api/exercises/${id}`);
}

export function getBodyParts() {
  return get('/api/exercises/body-parts');
}
