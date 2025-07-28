import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import PrioritySettingsPage from './pages/PrioritySettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SignUpPage from './pages/SignUpPage';
import Unauthorized from './pages/Unauthorized';
import AuthGuard from './components/auth/AuthGuard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/properties/:id" element={<AuthGuard><PropertyDetailsPage /></AuthGuard>} />
        <Route path="/settings/priorities" element={<AuthGuard><PrioritySettingsPage /></AuthGuard>} />
        <Route path="/analytics" element={<AuthGuard><AnalyticsPage /></AuthGuard>} />
      </Routes>
      <Toaster position="top-right" richColors/>
    </div>
  );
}

export default App;