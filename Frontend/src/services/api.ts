// API configuration and helper functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Get user data from localStorage
export const getUser = (): any | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Set user data in localStorage
export const setUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove user data from localStorage
export const removeUser = (): void => {
  localStorage.removeItem('user');
};

// Create headers with auth token
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Auth API
export const authAPI = {
  // Register new user
  register: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Save token and user
    setAuthToken(data.token);
    setUser(data.user);

    return data;
  },

  // Login user
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save token and user
    setAuthToken(data.token);
    setUser(data.user);

    return data;
  },

  // Get current user
  me: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user');
    }

    return data;
  },

  // Logout
  logout: () => {
    removeAuthToken();
    removeUser();
  },
};

// Upload API
export const uploadAPI = {
  // Upload screenshot
  uploadScreenshot: async (file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  },

  // Get upload history
  getHistory: async (limit = 50, offset = 0) => {
    const response = await fetch(
      `${API_BASE_URL}/history?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: getHeaders(true),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch history');
    }

    return data;
  },

  // Get single upload
  getUpload: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/upload/${id}`, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch upload');
    }

    return data;
  },

  // Delete upload
  deleteUpload: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/upload/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete upload');
    }

    return data;
  },
};

// Helper to get full image URL
export const getImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

export default {
  authAPI,
  uploadAPI,
  getImageUrl,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUser,
  setUser,
  removeUser,
};
