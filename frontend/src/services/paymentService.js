import api from './api';

export const paymentService = {
  createOrder: async () => {
    const response = await api.post('/payment/create-order');
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
  }
};
