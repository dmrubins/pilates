import { post } from './client.js';

export async function login(password) {
  const data = await post('/api/auth/login', { password });
  localStorage.setItem('tt_token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('tt_token');
}
