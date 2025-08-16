import axios from 'axios';

// A mutable reference to store the logout function
let onLogoutCallback = null;

// Function to set the global logout handler (called from App.js)
export const setGlobalLogoutHandler = (callback) => {
  onLogoutCallback = callback;
};

// Function to get the JWT token from sessionStorage
const getJwtToken = () => {
  return sessionStorage.getItem('dashboardJwtToken');
};

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
});

// Request Interceptor: Automatically add JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getJwtToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access (401). Triggering global logout.');
      if (onLogoutCallback) {
        onLogoutCallback();
      } else {
        console.warn('No global logout handler registered in axiosConfig.');
        sessionStorage.clear();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;