import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import NewApplication from './pages/NewApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import ExceptionQueue from './pages/ExceptionQueue';
import RuleConfigurator from './pages/RuleConfigurator';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Guard using AuthContext
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentRole } = useAuth();
  
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected App Shell */}
          <Route element={<MainLayout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.RM, ROLES.L1, ROLES.L2, ROLES.ADMIN]}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/applications/new" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.RM, ROLES.L1, ROLES.L2, ROLES.ADMIN]}>
                  <NewApplication />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/applications/:id" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.RM, ROLES.L1, ROLES.L2, ROLES.ADMIN]}>
                  <ApplicationDetail />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/exceptions" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.L1, ROLES.L2, ROLES.ADMIN]}>
                  <ExceptionQueue />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/rules" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <RuleConfigurator />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
