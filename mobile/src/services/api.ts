// API client placeholder - axios will be installed when backend integration is needed
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

// Simple fetch-based API client
export const apiClient = {
  baseURL: API_BASE_URL,
  async get(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`);
    return response.json();
  },
  async post(url: string, data: unknown) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

export default apiClient;
