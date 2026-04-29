import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import HomePage from './pages/HomePage';
import Results from './pages/Results';
import CardDetail from './pages/CardDetail';
import CardListing from './pages/CardListing';
import CompareCards from './pages/CompareCards';
import ThankYou from './pages/ThankYou';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCardManagement from './pages/admin/AdminCardManagement';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import SignUpStep1 from './pages/SignUpStep1';
import SignUpStep2 from './pages/SignUpStep2';
import Dashboard from './pages/Dashboard';
import SavedCalculations from './pages/SavedCalculations';
import Profile from './pages/Profile';
import LoginPage from './pages/LoginPage';
import ProtectedUserRoute from './components/ProtectedUserRoute';

function Layout() {
  const location = useLocation();
  const showGlobalNav =
    location.pathname !== '/' &&
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/signup') &&
    !location.pathname.startsWith('/dashboard') &&
    location.pathname !== '/login' &&
    location.pathname !== '/compare' &&
    location.pathname !== '/saved' &&
    location.pathname !== '/profile';

  return (
    <>
      {showGlobalNav && <NavBar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<Results />} />
        <Route path="/cards" element={<CardListing />} />
        <Route path="/cards/:id" element={<CardDetail />} />
        <Route path="/compare" element={<CompareCards />} />
        <Route path="/thank-you" element={<ThankYou />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Signup */}
        <Route path="/signup" element={<SignUpStep1 />} />
        <Route path="/signup/step2" element={<SignUpStep2 />} />

        {/* User — protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedUserRoute>
              <Dashboard />
            </ProtectedUserRoute>
          }
        />

        {/* User — saved calculations */}
        <Route
          path="/saved"
          element={
            <ProtectedUserRoute>
              <SavedCalculations />
            </ProtectedUserRoute>
          }
        />

        {/* User — profile */}
        <Route
          path="/profile"
          element={
            <ProtectedUserRoute>
              <Profile />
            </ProtectedUserRoute>
          }
        />

        {/* Admin — public */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin — protected */}
        <Route
          path="/admin/cards"
          element={
            <ProtectedAdminRoute>
              <AdminCardManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedAdminRoute>
              <AdminAuditLog />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
