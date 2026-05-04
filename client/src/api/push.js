import { post, put, del } from './client.js';

export function subscribe(subscription, schedule_days, schedule_time) {
  return post('/api/push/subscribe', { subscription, schedule_days, schedule_time });
}

export function updateSchedule(endpoint, schedule_days, schedule_time) {
  return put('/api/push/subscribe', { endpoint, schedule_days, schedule_time });
}

export function unsubscribe(endpoint) {
  return del('/api/push/subscribe', { endpoint });
}

export function testPush(endpoint) {
  return post('/api/push/test', { endpoint });
}
