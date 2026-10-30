import apiClient from './client';

export const sendChatMessage = async ({ message, conversationId = null, candidateProfile = null }) => {
  return apiClient.post('/agent/chat', {
    message,
    conversationId,
    candidateProfile,
  });
};

export const fetchConversation = async (conversationId) => {
  return apiClient.get(`/agent/conversation/${encodeURIComponent(conversationId)}`);
};

export const clearConversation = async (conversationId) => {
  return apiClient.delete(`/agent/conversation/${encodeURIComponent(conversationId)}`);
};

