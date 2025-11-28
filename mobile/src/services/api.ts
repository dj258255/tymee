import axios from 'axios';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://your-production-api.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Add auth token here if needed
    // const token = await getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  },
);

export default apiClient;
