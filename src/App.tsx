import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import CalendarGenerator from './pages/CalendarGenerator';
import Collaborators from './pages/Collaborators';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ToastContainer from './components/ToastContainer';
import { useToastContext } from './contexts/ToastContext';

// A wrapper for all private routes
const AppLayout = () => (
  <PrivateRoute>
    <Layout>
      <Outlet /> 
    </Layout>
  </PrivateRoute>
);

function App() {
  const { toasts, removeToast } = useToastContext();

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar-generator" element={<CalendarGenerator />} />
            <Route path="/collaborators" element={<Collaborators />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

        </Routes>
      </Router>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;