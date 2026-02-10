import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSeller from './pages/RegisterSeller';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/verifyOTP';
import ResetPassword from './pages/ResetPassword';
import './styles/variables.css';

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-seller" element={<RegisterSeller />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} /> 
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/products" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>Products - Coming Soon</div>} />
            <Route path="/about" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>About - Coming Soon</div>} />
            <Route path="/contact" element={<div style={{padding: '4rem 2rem', textAlign: 'center'}}>Contact - Coming Soon</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;