import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PublicRoute from '@/routes/PublicRoute';
import { LoadingScreen } from '@/components/ui/Spinner';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'));
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome'));
const AiTutorPage = lazy(() => import('@/pages/ai-tutor/AiTutorPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));
const DocumentDetailPage = lazy(() => import('@/pages/documents/DocumentDetailPage'));
const QuizzesPage = lazy(() => import('@/pages/quizzes/QuizzesPage'));
const PlannerPage = lazy(() => import('@/pages/planner/PlannerPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

const App: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={<PublicRoute><LoginPage /></PublicRoute>}
              />
              <Route
                path="/register"
                element={<PublicRoute><RegisterPage /></PublicRoute>}
              />
              <Route
                path="/forgot-password"
                element={<PublicRoute><ForgotPasswordPage /></PublicRoute>}
              />
              <Route
                path="/reset-password"
                element={<PublicRoute><ResetPasswordPage /></PublicRoute>}
              />

              {/* Protected dashboard routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
              >
                <Route index element={<DashboardHome />} />
                <Route path="ai-tutor" element={<AiTutorPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/:id" element={<DocumentDetailPage />} />
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="planner" element={<PlannerPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
