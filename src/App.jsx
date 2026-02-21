import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VideoDetail from './pages/VideoDetail';
import { Toaster } from 'react-hot-toast';

// PrivateRoute wrapper to check auth status
// Simple wrapper since Layout handles redirection now, 
// but we might want explicit protection for specific routes if needed.
// For now, Layout covers it.

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/video/:id" element={<VideoDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(1, 1, 43, 0.9)',
              color: '#fff',
              border: '1px solid #05d9e8',
              backdropFilter: 'blur(10px)',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#05d9e8',
                secondary: '#01012b',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff2a6d',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #ff2a6d',
              }
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
