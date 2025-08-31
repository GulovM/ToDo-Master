import apiClient, { API_ENDPOINTS } from './api.js';

export const aiService = {
  sendMessage: async (message, { chatId, confirm = false, actions } = {}) => {
    try {
      const payload = { message };
      if (chatId) payload.chat_id = chatId;
      if (confirm) payload.confirm = true;
      if (actions) payload.actions = actions;
      const response = await apiClient.post(API_ENDPOINTS.tasks.aiAssist, payload);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'AI service unavailable' },
      };
    }
  },

  listChats: async () => {
    try {
      const response = await apiClient.get('/tasks/ai/chats/');
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },

  getChatMessages: async (chatId) => {
    try {
      const response = await apiClient.get(`/tasks/ai/chats/${chatId}/`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data };
    }
  },
};

export default aiService;
