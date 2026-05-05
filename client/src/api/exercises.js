import { get, del } from './client.js';

function getToken() {
  return localStorage.getItem('tt_token');
}

export function getExercises(filters = {}) {
  const params = new URLSearchParams();
  if (filters.body_part)   params.set('body_part', filters.body_part);
  if (filters.difficulty)  params.set('difficulty', filters.difficulty);
  if (filters.min_duration) params.set('min_duration', filters.min_duration);
  if (filters.max_duration) params.set('max_duration', filters.max_duration);
  if (filters.ease)        params.set('ease', filters.ease);
  const qs = params.toString();
  return get(`/api/exercises${qs ? '?' + qs : ''}`);
}

export function getExercise(id) {
  return get(`/api/exercises/${id}`);
}

export function getBodyParts() {
  return get('/api/exercises/body-parts');
}

export function deleteExercise(id) {
  return del(`/api/exercises/${id}`);
}

// Create or update — uses FormData to support photo uploads
async function submitExerciseForm(url, method, data, photoFiles = [], removePhotos = []) {
  const form = new FormData();
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) form.append(key, val);
  }
  if (removePhotos.length) form.append('remove_photos', JSON.stringify(removePhotos));
  for (const file of photoFiles) form.append('photos', file);

  const token = getToken();
  const res = await fetch(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (res.status === 401) {
    localStorage.removeItem('tt_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function createExercise(data, photoFiles) {
  return submitExerciseForm('/api/exercises', 'POST', data, photoFiles);
}

export function updateExercise(id, data, photoFiles, removePhotos) {
  return submitExerciseForm(`/api/exercises/${id}`, 'PUT', data, photoFiles, removePhotos);
}
