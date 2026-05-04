import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { usePushSubscription } from '../hooks/usePushSubscription.js';
import SchedulePicker from '../components/SchedulePicker.jsx';

export default function Settings() {
  const { logout } = useAuth();
  const {
    permission, isSubscribed, loading, error,
    enable, disable, saveSchedule, sendTest, supported,
  } = usePushSubscription();

  const [days, setDays] = useState(['Mon', 'Wed', 'Fri']);
  const [time, setTime] = useState('08:00');
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleEnable = async () => {
    setSaved(false);
    await enable(days, time);
  };

  const handleSave = async () => {
    await saveSchedule(days, time);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    await sendTest();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Push notifications */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-text-primary">Workout Reminders</h2>

        {!supported && (
          <p className="text-text-muted text-sm">
            Push notifications aren't supported in this browser.
            On iOS, add to Home Screen first.
          </p>
        )}

        {supported && !isSubscribed && (
          <div className="space-y-3">
            <p className="text-text-muted text-sm">
              Get reminded to do your Pilates session on a schedule you choose.
            </p>
            <SchedulePicker
              days={days}
              time={time}
              onDaysChange={setDays}
              onTimeChange={setTime}
            />
            <button
              className="btn-primary w-full"
              onClick={handleEnable}
              disabled={loading || !days.length}
            >
              {loading ? 'Enabling…' : 'Enable reminders'}
            </button>
            {permission === 'denied' && (
              <p className="text-red-400 text-xs">
                Notification permission was denied. Please enable it in your browser settings.
              </p>
            )}
          </div>
        )}

        {supported && isSubscribed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-400 font-medium">Reminders active</span>
            </div>

            <SchedulePicker
              days={days}
              time={time}
              onDaysChange={setDays}
              onTimeChange={setTime}
            />

            <div className="flex gap-2">
              <button
                className="btn-primary flex-1 text-sm"
                onClick={handleSave}
                disabled={loading}
              >
                {saved ? '✓ Saved' : 'Save schedule'}
              </button>
              <button
                className="btn-ghost flex-1 text-sm"
                onClick={handleTest}
                disabled={loading}
              >
                {testSent ? '✓ Sent!' : 'Send test'}
              </button>
            </div>

            <button
              className="text-red-400 text-sm hover:text-red-300 transition-colors"
              onClick={disable}
              disabled={loading}
            >
              Disable reminders
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Account */}
      <div className="card">
        <h2 className="font-semibold text-text-primary mb-3">Account</h2>
        <button
          onClick={logout}
          className="btn-ghost w-full text-sm"
        >
          Sign out
        </button>
      </div>

      {/* About */}
      <div className="card text-center">
        <p className="text-text-primary font-bold">Torque &amp; Tension</p>
        <p className="text-text-muted text-xs mt-0.5">Pilates tracker · pilates.coupleswhobuildtogether.com</p>
      </div>
    </div>
  );
}
