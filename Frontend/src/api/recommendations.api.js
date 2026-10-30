import apiClient from './client';

export const fetchRecommendations = async ({ candidateProfile, limit = 10, category = null }) => {
  const payload = {
    candidateProfile,
    limit,
  };
  if (category) {
    payload.category = category;
  }
  return apiClient.post('/recommendations', payload);
};
