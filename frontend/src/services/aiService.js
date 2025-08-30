import apiClient, { API_ENDPOINTS } from './api.js';

export const aiService = {
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.tasks.aiAssist, { message });
      return { success: true, reply: response.data.reply };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'AI service unavailable' },
      };
    }
  },
};

export default aiService;

