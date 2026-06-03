import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';
import { PageLoader } from './components/ui';

// Auth Pages
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';

// Candidate Pages
import CandidateDashboard from './pages/candidate/Dashboard';
import BrowseJobs from './pages/candidate/BrowseJobs';
import CandidateApplications from './pages/candidate/Applications';
import CandidateProfile from './pages/candidate/Profile';
import SavedJobs from './pages/candidate/SavedJobs';

// Company Pages
import CompanyDashboard from './pages/company/Dashboard';
import CompanyJobs from './pages/company/Jobs';
import CompanyApplications from './pages/company/Applications';
import Pipeline from './pages/company/Pipeline';
import CompanyProfile from './pages/company/Profile';

// Shared
import Chat from './pages/shared/Chat';

// Admin Pages
import AdminDashboard, { AdminUsers, AdminCompanies, AdminJobs, AdminEmailLogs } from './pages/admin/AdminPages';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
    return <Navigate to={routes[user.role] || '/'} replace />;
  }
  return children;
};

const Layout = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Candidate */}
      <Route path="/candidate/dashboard" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><CandidateDashboard /></Layout></ProtectedRoute>} />
      <Route path="/candidate/jobs" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><BrowseJobs /></Layout></ProtectedRoute>} />
      <Route path="/candidate/applications" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><CandidateApplications /></Layout></ProtectedRoute>} />
      <Route path="/candidate/saved" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><SavedJobs /></Layout></ProtectedRoute>} />
      <Route path="/candidate/chat" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/candidate/profile" element={<ProtectedRoute roles={['CANDIDATE']}><Layout><CandidateProfile /></Layout></ProtectedRoute>} />

      {/* Company */}
      <Route path="/company/dashboard" element={<ProtectedRoute roles={['COMPANY']}><Layout><CompanyDashboard /></Layout></ProtectedRoute>} />
      <Route path="/company/jobs" element={<ProtectedRoute roles={['COMPANY']}><Layout><CompanyJobs /></Layout></ProtectedRoute>} />
      <Route path="/company/applications" element={<ProtectedRoute roles={['COMPANY']}><Layout><CompanyApplications /></Layout></ProtectedRoute>} />
      <Route path="/company/pipeline" element={<ProtectedRoute roles={['COMPANY']}><Layout><Pipeline /></Layout></ProtectedRoute>} />
      <Route path="/company/chat" element={<ProtectedRoute roles={['COMPANY']}><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/company/profile" element={<ProtectedRoute roles={['COMPANY']}><Layout><CompanyProfile /></Layout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminUsers /></Layout></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminCompanies /></Layout></ProtectedRoute>} />
      <Route path="/admin/jobs" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminJobs /></Layout></ProtectedRoute>} />
      <Route path="/admin/email-logs" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminEmailLogs /></Layout></ProtectedRoute>} />

      {/* Root redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'CANDIDATE' ? '/candidate/dashboard' : user.role === 'COMPANY' ? '/company/dashboard' : '/admin/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: '10px', background: 'var(--toast-bg)', color: 'var(--toast-color)', fontSize: '14px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
