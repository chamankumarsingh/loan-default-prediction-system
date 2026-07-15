import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Lazy loading views for code splitting & performance optimization
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Predict = React.lazy(() => import('./pages/Predict').then(m => ({ default: m.Predict })));
const Customers = React.lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const CustomerProfile = React.lazy(() => import('./pages/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Analytics = React.lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));

const RouteSuspenseFallback: React.FC = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Route Guard to verify Authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route Guard to verify Administrator access
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-12 h-12 border-4 border-brand-650 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={
                    <Suspense fallback={<RouteSuspenseFallback />}><Dashboard /></Suspense>
                  } />
                  <Route path="predict" element={
                    <Suspense fallback={<RouteSuspenseFallback />}><Predict /></Suspense>
                  } />
                  <Route path="customers" element={
                    <Suspense fallback={<RouteSuspenseFallback />}><Customers /></Suspense>
                  } />
                  <Route path="customers/:id" element={
                    <Suspense fallback={<RouteSuspenseFallback />}><CustomerProfile /></Suspense>
                  } />
                  <Route path="analytics" element={
                    <Suspense fallback={<RouteSuspenseFallback />}><Analytics /></Suspense>
                  } />
                  <Route path="reports" element={
                    <Suspense fallback={<RouteSuspenseFallback />}><Reports /></Suspense>
                  } />
                  
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <Suspense fallback={<RouteSuspenseFallback />}><Admin /></Suspense>
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* Catch-all redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
};
