import { useState, useEffect, useCallback } from 'react';
import { subscribe, updateSchedule, unsubscribe, testPush } from '../api/push.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then(setSubscription);
    });
  }, []);

  const enable = useCallback(async (scheduleDays, scheduleTime) => {
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('Notification permission denied');

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setSubscription(sub);
      await subscribe(sub.toJSON(), scheduleDays, scheduleTime);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSchedule = useCallback(async (scheduleDays, scheduleTime) => {
    if (!subscription) return;
    setLoading(true);
    setError(null);
    try {
      await updateSchedule(subscription.endpoint, scheduleDays, scheduleTime);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  const sendTest = useCallback(async () => {
    if (!subscription) return;
    await testPush(subscription.endpoint);
  }, [subscription]);

  return {
    permission,
    subscription,
    isSubscribed: !!subscription,
    loading,
    error,
    enable,
    disable,
    saveSchedule,
    sendTest,
    supported: 'serviceWorker' in navigator && 'PushManager' in window,
  };
}
