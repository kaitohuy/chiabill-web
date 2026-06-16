import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import LayoutShell from './components/layout/LayoutShell';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';
import PublicRoute from './components/routing/PublicRoute';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/home/Dashboard';
import TripDetails from './pages/trip/TripDetails';
import Explore from './pages/tourism/Explore';
import GlobalStats from './pages/stats/GlobalStats';
import NotificationsList from './pages/notification/NotificationsList';
import ProfileSettings from './pages/profile/ProfileSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import PrivacyPolicy from './pages/static/PrivacyPolicy';
import DeleteAccountRequest from './pages/static/DeleteAccountRequest';
import Trash from './pages/home/Trash';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/auth/login" element={<Login />} />
            </Route>

            {/* Static pages - accessible to everyone */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/delete-account-request" element={<DeleteAccountRequest />} />

            {/* Private Application Routes (Wrapped in Shell Layout) */}
            <Route element={<PrivateRoute />}>
              <Route element={<LayoutShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trip/:tripId" element={<TripDetails />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/stats" element={<GlobalStats />} />
                <Route path="/notifications" element={<NotificationsList />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/trash" element={<Trash />} />
                
                {/* Admin Only Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
