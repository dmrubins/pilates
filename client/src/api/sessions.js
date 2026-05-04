import { get, post, del } from './client.js';

export function getSessions(date) {
  return get(`/api/sessions${date ? '?date=' + date : ''}`);
}

export function createSession(data) {
  return post('/api/sessions', data);
}

export function deleteSession(id) {
  return del(`/api/sessions/${id}`);
}
