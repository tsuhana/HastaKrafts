import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const language = localStorage.getItem('language') || 'en';
    config.headers['Accept-Language'] = language;

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
  getProductById: (id, lang) => API.get(`/products/${id}`, { params: { lang } }),
  getCategories: () => API.get('/products/categories'),
  createProduct: (formData) => API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSellerProducts: () => API.get('/products/seller/my-products'),
  updateProduct: (id, formData) => API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => API.delete(`/products/${id}`),
  translateProduct: (id, data) => API.post(`/products/${id}/translate`, data),
  getSupportedLanguages: () => API.get('/products/languages/supported'),
  getFeaturedProducts: () => API.get('/products/featured'),
  getTrendingProducts: () => API.get('/products/trending'),
  getRandomProducts: () => API.get('/products/random'),
  getTopCategories: () => API.get('/products/categories/top'),
  getActiveBanners: () => API.get('/banners/active'),
};

// ADMIN
export const adminAPI = {
  getDashboardStats: () => API.get('/admin/stats'),
  getAnalytics: () => API.get('/admin/analytics'),
  getPendingSellers: () => API.get('/admin/sellers/pending'),
  getAllSellers: () => API.get('/admin/sellers'),
  approveSeller: (id) => API.post(`/admin/sellers/${id}/approve`),
  rejectSeller: (id, data) => API.post(`/admin/sellers/${id}/reject`, data),
  getPendingProducts: () => API.get('/admin/products/pending'),
  approveProduct: (id) => API.post(`/admin/products/${id}/approve`),
  rejectProduct: (id, data) => API.post(`/admin/products/${id}/reject`, data),
  getAllUsers: () => API.get('/admin/users'),
  toggleBlockUser: (id) => API.put(`/admin/users/${id}/toggle-block`),
  toggleFeatured: (product_id) => API.put(`/admin/products/${product_id}/featured`),
  getAllContactMessages: (params) => API.get('/contact', { params }),
  updateContactStatus: (id, data) => API.put(`/contact/${id}`, data),
  deleteContactMessage: (id) => API.delete(`/contact/${id}`),
  getAllBanners: () => API.get('/banners'),
  createBanner: (formData) => API.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBanner: (id, formData) => API.put(`/banners/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBanner: (id) => API.delete(`/banners/${id}`),
  toggleBannerStatus: (id) => API.put(`/banners/${id}/toggle`),
  getAllOrders: () => API.get('/admin/orders'),
  getAllReviews: () => API.get('/admin/reviews'),
  deleteReview: (id) => API.delete(`/admin/reviews/${id}`),
  // Auction management (admin can view all & delete/cancel)
  getAllAuctions: () => API.get('/auctions'),
  deleteAuction: (id) => API.delete(`/auctions/${id}`),
};

// USER
export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  changePassword: (data) => API.put('/users/change-password', data),
  uploadAvatar: (formData) => API.post('/users/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateLanguagePreference: (data) => API.put('/users/language-preference', data),
  getCart: () => API.get('/cart'),
};

// SELLER
export const sellerAPI = {
  getProfile: () => API.get('/sellers/profile'),
  updateProfile: (data) => API.put('/sellers/profile', data),
  uploadLogo: (formData) => API.post('/sellers/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCitizenship: (formData) => API.post('/sellers/upload-citizenship', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAnalytics: () => API.get('/sellers/analytics'),
  getMyReviews: () => API.get('/reviews/seller/my-reviews'),
  getMyAuctions: () => API.get('/auctions/seller/my-auctions'),
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
  createOrder: (data) => API.post("/orders/create", data),
  getMyOrders: () => API.get("/orders/my-orders"),
  getOrderById: (id) => API.get(`/orders/${id}`),
  verifyKhaltiPayment: ({ pidx, order_id }) =>
    API.get(`/orders/khalti/verify?pidx=${encodeURIComponent(pidx)}&order_id=${encodeURIComponent(order_id)}`),
  getSellerOrders: () => API.get("/orders/seller/orders"),
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

// MESSAGES
export const messageAPI = {
  sendMessage: (data) => API.post('/messages/send', data),
  sendMessageWithImage: (formData) =>
    API.post('/messages/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getConversations: () => API.get('/messages/conversations'),
  getMessages: (partnerId) => API.get(`/messages/${partnerId}`),
  getUnreadCount: () => API.get('/messages/unread-count'),
};

// WISHLIST
export const wishlistAPI = {
  getWishlist: () => API.get('/wishlist'),
  addToWishlist: (data) => API.post('/wishlist/add', data),
  removeFromWishlist: (product_id) => API.delete(`/wishlist/remove/${product_id}`),
  checkWishlist: (product_id) => API.get(`/wishlist/check/${product_id}`),
  clearWishlist: () => API.delete('/wishlist/clear'),
};

// REVIEWS
export const reviewAPI = {
  getProductReviews: (product_id) => API.get(`/reviews/product/${product_id}`),
  createReview: (formData) => API.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReviews: () => API.get('/reviews/my-reviews'),
  updateReview: (review_id, data) => API.put(`/reviews/${review_id}`, data),
  deleteReview: (review_id) => API.delete(`/reviews/${review_id}`),
  toggleHelpful: (review_id) => API.post(`/reviews/${review_id}/helpful`),
  createReply: (review_id, data) => API.post(`/reviews/${review_id}/reply`, data),
};

// CONTACT
export const contactAPI = {
  submitMessage: (data) => API.post('/contact/submit', data),
  getAllMessages: (params) => API.get('/contact', { params }),
  updateMessage: (id, data) => API.put(`/contact/${id}`, data),
  deleteMessage: (id) => API.delete(`/contact/${id}`),
};

// POINTS
export const pointsAPI = {
  getBalance: () => API.get('/points/balance'),
  getHistory: () => API.get('/points/history'),
};

// BLOG STORIES
export const storyAPI = {
  getAllStories: (params) => API.get('/stories', { params }),
  getStoryById: (id) => API.get(`/stories/${id}`),
  createStory: (formData) => API.post('/stories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyStories: () => API.get('/stories/seller/my-stories'),
  updateStory: (id, data) => API.put(`/stories/${id}`, data),
  deleteStory: (id) => API.delete(`/stories/${id}`),
};

export default API;