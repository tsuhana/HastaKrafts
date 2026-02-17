import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register/buyer', data),
  registerSeller: (data) => API.post('/auth/register/seller', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getCurrentUser: () => API.get('/auth/me'),
};

// PRODUCTS
export const productAPI = {
  getAllProducts: (params) => API.get('/products', { params }),
  getProductById: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories'),
  createProduct: (formData) => API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSellerProducts: () => API.get('/products/seller/my-products'),
  updateProduct: (id, formData) => API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => API.delete(`/products/${id}`),
};

// ADMIN
export const adminAPI = {
  getDashboardStats: () => API.get('/admin/stats'),
  getPendingSellers: () => API.get('/admin/sellers/pending'),
  getAllSellers: () => API.get('/admin/sellers'),
  approveSeller: (id) => API.post(`/admin/sellers/${id}/approve`),
  rejectSeller: (id, data) => API.post(`/admin/sellers/${id}/reject`, data),
  getPendingProducts: () => API.get('/admin/products/pending'),
  approveProduct: (id) => API.post(`/admin/products/${id}/approve`),
  rejectProduct: (id, data) => API.post(`/admin/products/${id}/reject`, data),
  getAllUsers: () => API.get('/admin/users'),
};

// USER
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  changePassword: (data) => API.put('/users/change-password', data),
  uploadAvatar: (formData) => API.post('/users/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCart: () => API.get('/cart'),
};

// CART
export const cartAPI = {
  getCart: () => API.get('/cart'),
  addToCart: (data) => API.post('/cart/add', data),
  updateCartItem: (cartItemId, data) => API.put(`/cart/items/${cartItemId}`, data),
  removeFromCart: (cartItemId) => API.delete(`/cart/items/${cartItemId}`),
  clearCart: () => API.delete('/cart/clear'),
};

// ORDERS
export const orderAPI = {
  createOrder: (data) => API.post('/orders/create', data),
  getMyOrders: () => API.get('/orders/my-orders'),
  getOrderById: (id) => API.get(`/orders/${id}`),
  verifyKhaltiPayment: (data) => API.post('/orders/khalti/verify', data),
  getSellerOrders: () => API.get('/orders/seller/orders'),
  updateOrderStatus: (orderId, data) => API.put(`/orders/seller/${orderId}/status`, data),
};

// AUCTIONS
export const auctionAPI = {
  getAllAuctions: (params) => API.get('/auctions', { params }),
  getAuctionById: (id) => API.get(`/auctions/${id}`),
  getAuctionBids: (auctionId) => API.get(`/auctions/${auctionId}/bids`),
  createAuction: (formData) => API.post('/auctions/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSellerAuctions: () => API.get('/auctions/seller/my-auctions'),
  placeBid: (auctionId, data) => API.post(`/auctions/${auctionId}/bid`, data),
};

// MESSAGES / CHAT
export const messageAPI = {
  sendMessage: (data) => API.post('/messages/send', data),
  getConversations: () => API.get('/messages/conversations'),
  getMessages: (partnerId) => API.get(`/messages/${partnerId}`),
  getUnreadCount: () => API.get('/messages/unread-count'),
};

export default API;