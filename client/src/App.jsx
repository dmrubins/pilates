import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ExerciseBrowser from './pages/ExerciseBrowser.jsx';
import ExerciseDetail from './pages/ExerciseDetail.jsx';
import ExerciseForm from './pages/ExerciseForm.jsx';
import WorkoutLogger from './pages/WorkoutLogger.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="exercises" element={<ExerciseBrowser />} />
        <Route path="exercises/new" element={<ExerciseForm />} />
        <Route path="exercises/:id" element={<ExerciseDetail />} />
        <Route path="exercises/:id/edit" element={<ExerciseForm />} />
        <Route path="log" element={<WorkoutLogger />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
