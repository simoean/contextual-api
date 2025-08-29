import axiosInstance from 'shared/api/axiosConfig';

/**
 * Handles user login.
 *
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @param {string} clientId - The ID of the client application (optional).
 * @returns {Promise<Object>} User data on successful login (e.g., { username, userId, token })
 */
export const loginUser = async (username, password, clientId) => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
      clientId,
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
export const registerUser = async ({username, password}) => {
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

/**
 * Fetch user attributes.
 *
 * @param {Object} params - Contains provider, token, and providerToken.
 * @returns {Promise<Object>} The user attributes from the specified provider.
 */
export const fetchAttributes = async ({provider, token, providerToken}) => {
  try {
    const response = await axiosInstance.get(`/auth/attributes?provider=${provider}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Provider-Token': providerToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Attributes Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Saves a new connection to a user's profile.
 *
 * @param {object} args - The arguments for the function.
 * @param {string} args.accessToken - The user's JWT token.
 * @param {string} args.providerId - The provider ID (e.g., 'google').
 * @param {string} args.providerUserId - The provider User ID (e.g., 'user@gmail.com').
 * @param {string} args.contextId - The context ID for the connection.
 * @param {string} args.providerAccessToken - The access token from the provider.
 * @returns {Promise<any>}
 */
export const saveConnection = async ({accessToken, providerId, providerUserId, contextId, providerAccessToken}) => {
  try {
    const response = await axiosInstance.post(`/users/me/connections`, {
      providerId,
      providerUserId,
      contextId,
      providerAccessToken,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to save connection:', error);
    throw error;
  }
};

/**
 * Deletes an existing connection for the authenticated user.
 * @param {string} accessToken - The user's authentication token.
 * @param {string} providerId - The ID of the social provider to delete.
 */
export const deleteConnection = async (accessToken, providerId) => {
  try {
    const response = await axiosInstance.delete(`/users/me/connections/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting connection:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Saves a list of attributes for a user using a single, bulk operation.
 *
 * @param {string} accessToken - The JWT token for authentication.
 * @param {Object[]} attributes - The list of attributes to be saved.
 * @param {string} providerUserId - The user ID from the provider.
 * @returns {Promise<Object>} The list of saved attributes returned from the API.
 */
export const saveAttributesBulk = async (accessToken, attributes, providerUserId) => {
  try {
    const payload = {
      attributes,
      providerUserId,
    };
    const response = await axiosInstance.post('/users/me/attributes/bulk', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Save Attributes Bulk Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Records a new consent for the authenticated user.
 *
 * @param {string} accessToken - The JWT token for authentication.
 * @param {string} clientId - The ID of the client application.
 * @param {string} contextId - The context ID for the consent.
 * @param {string[]} sharedAttributes - A list of attribute IDs the user has consented to share.
 * @param {string} tokenValidity - The desired validity period for the token.
 * @returns {Promise<Object>} The updated user object with the new/updated consent.
 */
export const recordConsent = async (accessToken, clientId, contextId, sharedAttributes, tokenValidity) => {
  try {
    const response = await axiosInstance.post('/users/me/consents', {
      clientId,
      contextId,
      sharedAttributes,
      tokenValidity,
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Consent Recording Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches all consent records for the authenticated user.
 *
 * @param {string} accessToken - The JWT token for authentication.
 * @returns {Promise<Object[]>} A list of consent objects.
 */
export const fetchConsents = async (accessToken) => {
  try {
    const response = await axiosInstance.get(`/users/me/consents`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    return response.data;
  } catch (error) {
    console.error('API Fetch Consents Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Revokes an entire consent record.
 *
 * @param {string} accessToken - The JWT token for authentication.
 * @param {string} consentId - The ID of the consent to revoke.
 * @returns {Promise<void>}
 */
export const revokeConsent = async (accessToken, consentId) => {
  try {
    await axiosInstance.delete(`/users/me/consents/${consentId}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
  } catch (error) {
    console.error('API Revoke Consent Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Removes a single attribute from a consent record.
 *
 * @param {string} accessToken - The JWT token for authentication.
 * @param {string} consentId - The ID of the consent.
 * @param {string} attributeId - The ID of the attribute to remove.
 * @returns {Promise<void>}
 */
export const removeAttributeFromConsent = async (accessToken, consentId, attributeId) => {
  try {
    await axiosInstance.delete(`/users/me/consents/${consentId}/attributes/${attributeId}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
  } catch (error) {
    console.error('API Remove Attribute Error:', error.response?.data || error.message);
    throw error;
  }
};