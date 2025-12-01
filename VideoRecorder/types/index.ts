// Shared types for the application

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  email: string;
}

export interface Video {
  id: number;
  title: string;
  filename: string;
  originalName?: string;
  size: number;
  mimetype?: string;
  duration?: string | number;
  createdBy?: string;
  uploadedBy?: number;
  uploadedByUsername?: string;
  createdAt: string;
  timestamp?: string;
  videoUrl?: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: 'success' | 'error';
  message: string;
  data: T;
}

