import apiClient from './client';

export const parseResumeFile = async (file, conversationId = null) => {
  const formData = new FormData();
  formData.append('resume', file);
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }

  return apiClient.post('/resume/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // Parsing multi-page PDFs can take time
  });
};

