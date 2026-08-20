import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ApplicationsList from './pages/ApplicationsList';
import NewApplication from './pages/NewApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import ExceptionQueue from './pages/ExceptionQueue';
import ExceptionIntelligenceStudio from './pages/ExceptionIntelligenceStudio';
import RuleConfigurator from './pages/RuleConfigurator';
import RuleVersionTimeline from './pages/RuleVersionTimeline';
import DecisionComparison from './pages/DecisionComparison';
import SyntheticSandbox from './pages/SyntheticSandbox';
import AuditLogsPage from './pages/AuditLogsPage';
import AiCopilotPage from './pages/AiCopilotPage';
import AiStressTestingPage from './pages/AiStressTestingPage';
import AiPricingOptimizerPage from './pages/AiPricingOptimizerPage';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Guard using AuthContext
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, currentRole } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    if (currentRole === ROLES.APPLICANT) {
      return <Navigate to="/applications" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Main Application Shell */}
          <Route element={<MainLayout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/applications" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]}>
                  <ApplicationsList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/applications/new" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]}>
                  <NewApplication />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/applications/:id" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]}>
                  <ApplicationDetail />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/exceptions" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <ExceptionQueue />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/exception-intelligence" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <ExceptionIntelligenceStudio />
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

            <Route 
              path="/admin/rules/timeline" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <RuleVersionTimeline />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/applications/:id/compare/:targetVersion" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <DecisionComparison />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/synthetic-sandbox" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <SyntheticSandbox />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/audit-logs" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <AuditLogsPage />
                </ProtectedRoute>
              } 
            />

            {/* AI Intelligence Suite */}
            <Route 
              path="/ai-copilot" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2, ROLES.APPLICANT]}>
                  <AiCopilotPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/ai-stress-testing" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <AiStressTestingPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/ai-pricing-optimizer" 
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.L1, ROLES.L2]}>
                  <AiPricingOptimizerPage />
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
