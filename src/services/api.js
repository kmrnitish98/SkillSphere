import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('skillsphere_user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ─── Auth ───
export const login = (data) => API.post('/auth/login', data);
export const adminLogin = (data) => API.post('/admin/login', data);
export const adminDashboardStats = () => API.get('/admin/dashboard');
export const adminCourseAnalytics = () => API.get('/admin/courses/analytics');
export const revenueAnalytics = (params = {}) => API.get('/admin/revenue/analytics', { params });
export const register = (data) => API.post('/auth/register', data);
export const getProfile = () => API.get('/auth/profile');

// ─── Users (Admin) ───
export const getUsers = () => API.get('/users');
export const getTopMentors = () => API.get('/users/top-mentors');
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const banUser = (id) => API.put(`/users/${id}/ban`);

// ─── User Profile ───
export const updateProfile = (data) => API.put('/users/profile', data);
export const uploadAvatar = (data) => API.post('/users/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword = (data) => API.put('/users/change-password', data);

// ─── Courses ───
export const getCourses = (keyword) => API.get(`/courses${keyword ? `?keyword=${keyword}` : ''}`);
export const getCourseById = (id) => API.get(`/courses/${id}`);
export const getCourseCurriculum = (id) => API.get(`/courses/${id}/curriculum`);
export const createCourse = (data) => API.post('/courses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);

// ─── Sections & Lessons ───
export const addSection = (courseId, data) => API.post(`/courses/${courseId}/sections`, data);
export const addLesson = (sectionId, data) => API.post(`/courses/sections/${sectionId}/lessons`, data);
export const addAssessment = (sectionId, data) => API.post(`/courses/sections/${sectionId}/assessments`, data);

// ─── Payments (Stripe) ───
export const createPaymentIntent = (data) => API.post('/payments/create-payment-intent', data);
export const confirmPayment = (data) => API.post('/payments/confirm', data);
export const getMyPayments = () => API.get('/payments/my');
export const getPlatformRevenue = () => API.get('/payments/revenue');
export const downloadInvoice = (paymentId) =>
  API.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' });

// Legacy alias kept for backward compat
export const purchaseCourse = (data) => API.post('/payments/confirm', data);

// ─── Student Actions ───
export const submitAssessment = (courseId, assessmentId, data) => API.post(`/courses/${courseId}/assessments/${assessmentId}/submit`, data);
export const completeCourse = (courseId) => API.post(`/courses/${courseId}/complete`);
export const addReview = (courseId, data) => API.post(`/courses/${courseId}/reviews`, data);
export const getCourseReviews = (courseId) => API.get(`/courses/${courseId}/reviews`);

// ─── Favorites ───
export const toggleFavoriteMentor = (mentorId) => API.post(`/users/favorites/${mentorId}`);

// ─── Mentor Dashboard ───
export const getMentorDashboard = () => API.get('/mentor/dashboard');
export const getMentorCourses = () => API.get('/mentor/courses');
export const getMentorStudents = () => API.get('/mentor/students');
export const getMentorEarnings = () => API.get('/mentor/earnings');
export const getMentorAnalytics = () => API.get('/mentor/analytics');

// ─── Chat / Messenger ───
export const getConversations = () => API.get('/chat/conversations');
export const getMessages = (conversationId) => API.get(`/chat/messages/${conversationId}`);
export const sendMessage = (data) => API.post('/chat/messages', data);
export const markMessagesSeen = (conversationId) => API.put(`/chat/messages/${conversationId}/seen`);

// ─── Progress Tracking ───
export const updateProgress = (data) => API.post('/progress', data);
export const getProgress = (courseId) => API.get(`/progress/${courseId}`);

// ── Verification ───
export const submitVerification = (data) => API.post('/verification/submit', data);
export const getVerificationStatus = () => API.get('/verification/status');
export const getVerificationRequests = () => API.get('/verification/requests');
export const handleVerificationDecision = (userId, data) => API.put(`/verification/${userId}/decision`, data);

// ── Notifications ───
export const getNotifications = () => API.get('/verification/notifications');
export const markNotificationsRead = () => API.put('/verification/notifications/read');

export default API;
