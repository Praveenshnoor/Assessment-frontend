import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Instructions from './pages/Instructions';
import TestScreen from './pages/TestScreen';
import Result from './pages/Results';
import Feedback from './pages/Feedback';

import AdminDashboard from './pages/admin/AdminDashboard';
import LiveProctoring from './pages/admin/LiveProctoring';

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
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/instructions" element={<TestRoute><Instructions /></TestRoute>} />
        <Route path="/test" element={<TestRoute><TestScreen /></TestRoute>} />
        <Route path="/result" element={<StudentRoute><Result /></StudentRoute>} />
        <Route path="/feedback" element={<StudentRoute><Feedback /></StudentRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/live-proctoring" element={<AdminRoute><LiveProctoring /></AdminRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;