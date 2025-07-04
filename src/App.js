import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './pages/Dashboard';
import BIDashboard from './pages/BIDashboard';
import ProductManagement from './pages/ProductManagement';
import SupplierManagement from './pages/SupplierManagement';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import CompanySettings from './pages/CompanySettings';
import Home from './pages/Home';
import ActivityLog from './pages/ActivityLog';

const AppRoutes = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>A carregar aplicação...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

            <Route path="/app/*" element={<ProtectedRoute requireCompany={true}><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<BIDashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="suppliers" element={<SupplierManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="profile" element={<Profile />} />
                <Route path="company-settings" element={<CompanySettings />} />
                <Route path="logs" element={<ActivityLog />} />
            </Route>
            
            <Route path="/" element={
                currentUser ? 
                    (currentUser.activeCompanyId ? <Navigate to="/app" /> : <Navigate to="/home" />) 
                    : <Navigate to="/login" />
            } />
        </Routes>
    );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
