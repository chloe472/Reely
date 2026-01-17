const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  // Upload screenshot for analysis
  async uploadScreenshot(file: File) {
    const formData = new FormData();
    formData.append('screenshot', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload screenshot');
    }

    return response.json();
  },

  // Get upload history
  async getHistory(limit = 50, offset = 0) {
    const response = await fetch(`${API_URL}/history?limit=${limit}&offset=${offset}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    return response.json();
  },

  // Get single upload by ID
  async getUpload(id: string) {
    const response = await fetch(`${API_URL}/upload/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch upload');
    }

    return response.json();
  },

  // Delete upload
  async deleteUpload(id: string) {
    const response = await fetch(`${API_URL}/upload/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete upload');
    }

    return response.json();
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },
};

export { API_URL };
