import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly load Loading Spinner to show while chunks are fetched
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
  </div>
);

// Lazy loaded routes
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Instructions = React.lazy(() => import('./pages/Instructions'));
const TestScreen = React.lazy(() => import('./pages/TestScreen'));
const Result = React.lazy(() => import('./pages/Results'));
const Feedback = React.lazy(() => import('./pages/Feedback'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const LiveProctoring = React.lazy(() => import('./pages/admin/LiveProctoring'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const ServerDown = React.lazy(() => import('./pages/ServerDown'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));

// Protected Route wrappers
const StudentRoute = ({ children }) => {
  const token = localStorage.getItem('studentAuthToken');
  return token ? children : <Navigate to="/login" replace />;
};

const TestRoute = ({ children }) => {
  const token = localStorage.getItem('studentAuthToken');
  const testId = localStorage.getItem('selectedTestId');
  if (!token) return <Navigate to="/login" replace />;
  if (!testId) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/server-down" element={<ServerDown />} />
            <Route path="/maintenance" element={<Maintenance />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
            <Route path="/instructions" element={<TestRoute><Instructions /></TestRoute>} />
            <Route path="/test" element={<TestRoute><TestScreen /></TestRoute>} />
            <Route path="/result" element={<StudentRoute><Result /></StudentRoute>} />
            <Route path="/feedback" element={<StudentRoute><Feedback /></StudentRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/live-proctoring" element={<AdminRoute><LiveProctoring /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

            {/* Default */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;