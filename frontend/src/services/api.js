import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 if it's NOT the login or register endpoint
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
};

export const candidateAPI = {
  getProfile: () => api.get('/candidates/profile'),
  updateProfile: (data) => api.put('/candidates/profile', data),
  uploadAvatar: (formData) => api.post('/candidates/avatar', formData),
  uploadResume: (formData) => api.post('/candidates/resume', formData),
  addExperience: (data) => api.post('/candidates/experiences', data),
  updateExperience: (id, data) => api.put(`/candidates/experiences/${id}`, data),
  deleteExperience: (id) => api.delete(`/candidates/experiences/${id}`),
  addEducation: (data) => api.post('/candidates/educations', data),
  updateEducation: (id, data) => api.put(`/candidates/educations/${id}`, data),
  deleteEducation: (id) => api.delete(`/candidates/educations/${id}`),
  getSavedJobs: () => api.get('/candidates/saved-jobs'),
  saveJob: (jobId) => api.post(`/candidates/saved-jobs/${jobId}`),
  unsaveJob: (jobId) => api.delete(`/candidates/saved-jobs/${jobId}`),
};

export const companyAPI = {
  getProfile: () => api.get('/companies/me/profile'),
  updateProfile: (data) => api.put('/companies/me/profile', data),
  uploadLogo: (formData) => api.post('/companies/me/logo', formData),
  getStats: () => api.get('/companies/me/stats'),
  getPublicProfile: (id) => api.get(`/companies/${id}`),
};

export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getCompanyJobs: (params) => api.get('/jobs/company/mine', { params }),
};

export const applicationAPI = {
  apply: (data) => api.post('/applications', data),
  getCandidateApplications: (params) => api.get('/applications/candidate', { params }),
  getCompanyApplications: (params) => api.get('/applications/company', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  scheduleInterview: (id, data) => api.post(`/applications/${id}/interviews`, data),
  uploadOfferLetter: (id, formData) => api.post(`/applications/${id}/offer`, formData),
};

export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId, formData) => api.post(`/chat/rooms/${roomId}/messages`, formData),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  blockUser: (id, block) => api.patch(`/admin/users/${id}/block`, { block }),
  getCompanies: (params) => api.get('/admin/companies', { params }),
  verifyCompany: (id, verified) => api.patch(`/admin/companies/${id}/verify`, { verified }),
  blockCompany: (id, block) => api.patch(`/admin/companies/${id}/block`, { block }),
  getAllJobs: (params) => api.get('/admin/jobs', { params }),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  getEmailLogs: (params) => api.get('/admin/email-logs', { params }),
};

export default api;
