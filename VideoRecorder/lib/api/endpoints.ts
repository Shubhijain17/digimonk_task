import { apiClient } from './client';

export const api = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  },

  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  getVideos: async () => {
    const response = await apiClient.get('/api/videos');
    return response.data;
  },

  getVideo: async (id: number) => {
    const response = await apiClient.get(`/api/videos/${id}`);
    return response.data;
  },

  uploadVideo: async (formData: FormData) => {
    const response = await apiClient.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteVideo: async (id: number) => {
    const response = await apiClient.delete(`/api/videos/${id}`);
    return response.data;
  },

  getVideoStreamUrl: (id: number) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return `${baseUrl}/api/videos/${id}/stream${token ? `?token=${token}` : ''}`;
  },
};

