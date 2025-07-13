import axiosInstance from 'shared/api/axiosConfig';

/**
 * Handles user login.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} User data on successful login (e.g., { username, userId, token })
 */
export const loginUser = async (username, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('API Login Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Handles user registration.
 *
 * @param {Object} userData - Contains firstName, lastName, personalEmail
 * @returns {Promise<Object>} Response data on successful registration
 */
export const registerUser = async ({ username, password }) => {
  try {
    const response = await axiosInstance.post('/auth/register', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('API Register Error:', error.response?.data || error.message);
    throw error;
  }
};

// You can add other auth-related API functions here as needed (e.g., forgot password)