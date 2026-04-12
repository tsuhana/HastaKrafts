import './i18n';
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

import { ToastProvider } from "./context/ToastContext";

import usePushNotifications from "./hooks/usePushNotifications";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import KhaltiCallback from './pages/KhaltiCallback';

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSeller from "./pages/RegisterSeller";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOTP from "./pages/VerifyOTP";
import Contact from "./pages/Contact";

import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import CreateBlog from "./pages/CreateBlog";
import EditBlog from "./pages/EditBlog";

import UserProfile from "./pages/UserProfile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Chat from "./pages/Chat";
import Wishlist from "./pages/Wishlist";

import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import CreateAuction from "./pages/CreateAuction";
import AuctionCheckout from "./pages/AuctionCheckout"; 

import SellerDashboard from "./pages/SellerDashboard.jsx";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

import AdminDashboard from "./pages/AdminDashboard";

import "./styles/variables.css";
import "./context/Toast.css";
import "./App.css";

const NO_FOOTER_PATHS = ["/admin/dashboard", "/seller/dashboard"];

const AppContent = () => {
  const location = useLocation();
  const showFooter = !NO_FOOTER_PATHS.some((p) => location.pathname.startsWith(p));
  usePushNotifications();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !window.__socket) {
      window.__socket = io("http://localhost:5000");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.user_id) {
        window.__socket.emit("join_user", user.user_id);
      }
    }

    return () => {
      if (window.__socket) {
        window.__socket.disconnect();
        window.__socket = null;
      }
    };
  }, []);

  return (
    <div className="app">
      <NavBar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />

          {/* ✅ NEW: Auction Checkout for winners */}
          <Route
            path="/auction-checkout/:auction_id"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <AuctionCheckout />
              </ProtectedRoute>
            }
          />

          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-seller" element={<RegisterSeller />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/payment/khalti/callback" element={<KhaltiCallback />} />

          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          <Route path="/cart"     element={<ProtectedRoute allowedRoles={["buyer"]}><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute allowedRoles={["buyer"]}><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={["buyer"]}><Checkout /></ProtectedRoute>} />
          <Route path="/order-confirmation/:id" element={<ProtectedRoute allowedRoles={["buyer"]}><OrderConfirmation /></ProtectedRoute>} />

          <Route path="/messages" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

          <Route path="/seller/dashboard"        element={<ProtectedRoute allowedRoles={["seller"]}><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/add-product"      element={<ProtectedRoute allowedRoles={["seller"]}><AddProduct /></ProtectedRoute>} />
          <Route path="/seller/edit-product/:id" element={<ProtectedRoute allowedRoles={["seller"]}><EditProduct /></ProtectedRoute>} />
          <Route path="/seller/create-auction"   element={<ProtectedRoute allowedRoles={["seller"]}><CreateAuction /></ProtectedRoute>} />
          <Route path="/seller/create-blog"      element={<ProtectedRoute allowedRoles={["seller"]}><CreateBlog /></ProtectedRoute>} />
          <Route path="/seller/edit-blog/:id"    element={<ProtectedRoute allowedRoles={["seller"]}><EditBlog /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

          <Route path="/about" element={<div style={{ padding: "4rem 2rem", textAlign: "center" }}>About - Coming Soon</div>} />
          <Route path="*"      element={<div style={{ padding: "4rem 2rem", textAlign: "center" }}>404 - Page Not Found</div>} />
        </Routes>
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

export default App;