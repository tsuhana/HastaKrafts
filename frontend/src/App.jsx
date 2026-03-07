import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import KhaltiCallback from './pages/KhaltiCallback';

// ==================== PUBLIC PAGES ====================
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

// BLOG STORIES
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import CreateBlog from "./pages/CreateBlog";
import EditBlog from "./pages/EditBlog";

// ==================== USER PAGES ====================
import UserProfile from "./pages/UserProfile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Chat from "./pages/Chat";
import Wishlist from "./pages/Wishlist";

// ==================== AUCTION PAGES ====================
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
import CreateAuction from "./pages/CreateAuction";

// ==================== SELLER PAGES ====================
import SellerDashboard from "./pages/SellerDashboard.jsx";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

// ==================== ADMIN PAGES ====================
import AdminDashboard from "./pages/AdminDashboard";

import "./styles/variables.css";
import "./App.css";

const NO_FOOTER_PATHS = ["/admin", "/seller/dashboard"];

const AppContent = () => {
  const location = useLocation();
  const showFooter = !NO_FOOTER_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <div className="app">
      <NavBar />

      <main className="main-content">
        <Routes>

          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />

          {/* Blog — public read, seller-only write/edit */}
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

          {/* ==================== USER PROFILE (ALL ROLES) ==================== */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* ==================== BUYER-ONLY ROUTES ==================== */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-confirmation/:id"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />

          {/* ==================== MESSAGES / CHAT ==================== */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* ==================== SELLER PROTECTED ROUTES ==================== */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/add-product"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <AddProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/edit-product/:id"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <EditProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/create-auction"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <CreateAuction />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/create-blog"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <CreateBlog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/edit-blog/:id"
            element={
              <ProtectedRoute allowedRoles={["seller"]}>
                <EditBlog />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN PROTECTED ROUTES ==================== */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================== FALLBACK ROUTES ==================== */}
          <Route
            path="/about"
            element={
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                About - Coming Soon
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                404 - Page Not Found
              </div>
            }
          />

        </Routes>
      </main>

      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;