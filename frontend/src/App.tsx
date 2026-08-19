import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoutes() {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin
    ? <LoginPage onToggle={() => setIsLogin(false)} />
    : <RegisterPage onToggle={() => setIsLogin(true)} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/courses" replace /> : <AuthRoutes />} />
        <Route path="/register" element={user ? <Navigate to="/courses" replace /> : <AuthRoutes />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
