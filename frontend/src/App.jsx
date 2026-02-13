import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSeller from './pages/RegisterSeller';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOTP from './pages/VerifyOTP';

// User Pages
import UserProfile from './pages/UserProfile';
import Cart from './pages/Cart'; // ✅ ADD

// Seller Pages
import SellerDashboard from './pages/SellerDashboard.jsx';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

import './styles/variables.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-seller" element={<RegisterSeller />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* User Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            
            {/* CART ROUTE */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />

            {/* Seller Protected Routes */}
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/add-product"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/edit-product/:id"
              element={
                <ProtectedRoute allowedRoles={['seller']}>
                  <EditProduct />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="/about" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>About - Coming Soon</div>} />
            <Route path="/contact" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>Contact - Coming Soon</div>} />
            <Route path="*" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>404 - Page Not Found</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;