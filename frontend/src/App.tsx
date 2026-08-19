import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { StudentsPage } from './pages/StudentsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
