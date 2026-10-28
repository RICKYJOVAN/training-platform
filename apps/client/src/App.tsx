import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedLayout from './components/ProtectedLayout';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import CoursesPage from './features/courses/CoursesPage';
import EnrollmentsPage from './features/enrollments/EnrollmentsPage';
import CertificationsPage from './features/certifications/CertificationsPage';
import AssessmentsPage from './features/assessments/AssessmentsPage';
import ReportsPage from './features/reports/ReportsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/certifications" element={<CertificationsPage />} />
        <Route path="/enrollments" element={<EnrollmentsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/" element={<Navigate to="/certifications" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
