import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CourseList } from './pages/CourseList';
import { CourseDetail } from './pages/CourseDetail';
import { SessionDetail } from './pages/SessionDetail';
import './App.css';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <CourseList />
          </ProtectedRoute>
        } />
        <Route path="courses/:courseId" element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        } />
        <Route path="sessions/:sessionId" element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        } />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
