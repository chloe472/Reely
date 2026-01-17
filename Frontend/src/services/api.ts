import { supabase } from '../lib/supabase';

// API configuration and helper functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to get authorization headers with Supabase token
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Upload API
export const uploadAPI = {
  // Upload screenshot
  uploadScreenshot: async (file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);

    const headers = await getAuthHeaders();
    // Note: Don't set Content-Type for FormData, browser does it automatically

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
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${API_BASE_URL}/history?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
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
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/upload/${id}`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch upload');
    }

    return data;
  },

  // Delete upload
  deleteUpload: async (id: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/upload/${id}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete upload');
    }

    return data;
  },

  // Save user's guessed coordinates
  saveGuess: async (id: string, latitude: number, longitude: number, distance?: number, points?: number) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/upload/${id}/guess`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude, distance, points }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save guess');
    }

    return data;
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch leaderboard');
    }

    return data;
  },
};

// Folder API
export const folderAPI = {
  // Get all folders
  getFolders: async () => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch folders');
    }

    return data;
  },

  // Create folder
  createFolder: async (name: string, description?: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create folder');
    }

    return data;
  },

  // Get folder by ID
  getFolder: async (folderId: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch folder');
    }

    return data;
  },

  // Update folder
  updateFolder: async (folderId: string, name?: string, description?: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update folder');
    }

    return data;
  },

  // Delete folder
  deleteFolder: async (folderId: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete folder');
    }

    return data;
  },

  // Add upload to folder
  addUploadToFolder: async (folderId: string, uploadId: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/folders/${folderId}/uploads/${uploadId}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add upload to folder');
    }

    return data;
  },

  // Remove upload from folder
  removeUploadFromFolder: async (folderId: string, uploadId: string) => {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/folders/${folderId}/uploads/${uploadId}`,
      {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove upload from folder');
    }

    return data;
  },
};

// Helper to get full image URL
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

// Deprecated auth exports (kept for compatibility if needed, but should be unused)
export const getAuthToken = () => null;
export const getUser = () => null;

export default {
  uploadAPI,
  getImageUrl,
};
