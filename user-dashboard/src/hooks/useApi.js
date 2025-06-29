import { useState } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  /**
   * General purpose function to wrap asynchronous API calls.
   * Manages loading, error, and success messages.
   *
   * @param {Function} apiCallFn - A function that returns an axios promise (e.g., () => axiosInstance.get('/path'))
   * @param {string} [successMsg='Operation successful!'] - Message to display on success.
   * @param {string} [errorMsg='An error occurred.'] - Message to display on error.
   * @returns {Promise<any>} The data returned from the API call.
   */
  const callApi = async (apiCallFn, successMsg = 'Operation successful!', errorMsg = 'An error occurred.') => {

    // Reset state before making the API call
    setLoading(true);
    setError(null);
    setMessage(null);

    // Call the provided API function and return the data from the successful response
    try {
      const response = await apiCallFn();
      setMessage(successMsg);
      return response.data;
    } catch (err) {
      console.error('API call error:', err);
      const specificErrorMessage = err.response?.data?.message || err.message || errorMsg;
      setError(specificErrorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide setters for message/error if a component wants to manually set them
  return { loading, error, message, callApi, setMessage, setError };
};

export default useApi;