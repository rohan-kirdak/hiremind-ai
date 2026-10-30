import apiClient from './client';

export const fetchJobs = async ({ search = '', location = '', category = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (location) params.append('location', location);
  if (category) params.append('category', category);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  return apiClient.get(`/jobs?${params.toString()}`);
};

export const fetchJobById = async (jobId) => {
  return apiClient.get(`/jobs/${encodeURIComponent(jobId)}`);
};
