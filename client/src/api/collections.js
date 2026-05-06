import { get, post, put, del } from './client.js';

export function getCollections() {
  return get('/api/collections');
}

export function getCollection(id) {
  return get(`/api/collections/${id}`);
}

export function createCollection(name, exerciseIds = []) {
  return post('/api/collections', { name, exercise_ids: exerciseIds });
}

export function renameCollection(id, name) {
  return put(`/api/collections/${id}`, { name });
}

export function deleteCollection(id) {
  return del(`/api/collections/${id}`);
}

export function addExercisesToCollection(id, exerciseIds) {
  return post(`/api/collections/${id}/exercises`, { exercise_ids: exerciseIds });
}

export function removeExerciseFromCollection(collectionId, exerciseId) {
  return del(`/api/collections/${collectionId}/exercises/${exerciseId}`);
}
