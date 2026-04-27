import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GoalDetail from './pages/GoalDetail';
import CreateGoal from './pages/CreateGoal';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/goals/new" element={<Protected><CreateGoal /></Protected>} />
        <Route path="/goals/:id" element={<Protected><GoalDetail /></Protected>} />
        <Route path="/archive" element={<Protected><Archive /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PrivacyProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
