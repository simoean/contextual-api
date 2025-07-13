import {create} from 'zustand';

import axiosInstance from 'shared/api/axiosConfig';

/**
 * Identity Store
 * This store manages the identity data for the user, including contexts and attributes.
 */
export const useIdentityStore = create((set, get) => ({

  // State for contexts and attributes
  contexts: [],
  attributes: [],

  // Message, loading and error states
  message: null,
  isLoading: false,
  error: null,

  // Actions

  /**
   * Fetch identity data for the current user.
   *
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<void>}
   */
  fetchIdentityData: async (userInfo) => {
    set({isLoading: true, error: null, message: null});
    if (!userInfo || !userInfo.token) {
      set({error: "Authentication token missing. Cannot fetch identity data.", isLoading: false});
      return;
    }
    try {
      const contextsResponse = await axiosInstance.get('/users/me/contexts');
      const attributesResponse = await axiosInstance.get('/users/me/attributes');
      set({
        contexts: contextsResponse.data,
        attributes: attributesResponse.data,
        isLoading: false,
        message: "Identity data loaded successfully!",
        error: null,
      });
    } catch (err) {
      console.error("Failed to fetch identity data:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load identity data.";
      set({error: errorMessage, isLoading: false});
    }
  },

  /**
   * Add a new context for the user.
   *
   * @param contextToSave - The context object to be added.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<any>}
   */
  addContext: async (contextToSave, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot add context.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      const response = await axiosInstance.post('/users/me/contexts', contextToSave);
      set((state) => ({
        contexts: [...state.contexts, response.data],
        message: `Context "${contextToSave.name}" added successfully!`,
        error: null,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to add context "${contextToSave.name}".`;
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Update an existing context for the user.
   *
   * @param contextId - The ID of the context to be updated.
   * @param updatedContextData - The partial context object with updated fields.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<any>}
   */
  updateContext: async (contextId, updatedContextData, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot update context.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      const response = await axiosInstance.put(`/users/me/contexts/${contextId}`, updatedContextData);
      set((state) => ({
        contexts: state.contexts.map((c) =>
          c.id === contextId ? response.data : c
        ),
        message: `Context "${updatedContextData.name || contextId}" updated successfully!`,
        error: null,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to update context "${contextId}".`;
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Delete a context for the user.
   *
   * @param contextId - The ID of the context to be deleted.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<void>}
   */
  deleteContext: async (contextId, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot delete context.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      await axiosInstance.delete(`/users/me/contexts/${contextId}`);
      set((state) => ({
        contexts: state.contexts.filter((c) => c.id !== contextId),
        message: "Context deleted successfully!",
        error: null,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete context.";
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Add a new attribute for the user.
   *
   * @param attributeToSave - The attribute object to be added.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<any>}
   */
  addAttribute: async (attributeToSave, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot add attribute.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      const response = await axiosInstance.post('/users/me/attributes', attributeToSave);
      set((state) => ({
        attributes: [...state.attributes, response.data],
        message: `Attribute "${attributeToSave.name}" added successfully!`,
        error: null,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to add attribute "${attributeToSave.name}".`;
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Update an existing attribute for the user.
   *
   * @param attributeId - The ID of the attribute to be updated.
   * @param updatedAttributeData - The partial attribute object with updated fields.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<any>}
   */
  updateAttribute: async (attributeId, updatedAttributeData, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot update attribute.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      const response = await axiosInstance.put(`/users/me/attributes/${attributeId}`, updatedAttributeData);
      set((state) => ({
        attributes: state.attributes.map((a) =>
          a.id === attributeId ? response.data : a
        ),
        message: `Attribute "${updatedAttributeData.name || attributeId}" updated successfully!`,
        error: null,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `Failed to update attribute "${attributeId}".`;
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Delete an attribute for the user.
   *
   * @param attributeId - The ID of the attribute to be deleted.
   * @param userInfo - The user information containing the authentication token.
   * @returns {Promise<void>}
   */
  deleteAttribute: async (attributeId, userInfo) => {
    set({error: null, message: null});
    if (!userInfo || !userInfo.token) {
      const errorMessage = "Authentication token missing. Cannot delete attribute.";
      set({error: errorMessage, isLoading: false});
      throw new Error(errorMessage);
    }
    try {
      await axiosInstance.delete(`/users/me/attributes/${attributeId}`);
      set((state) => ({
        attributes: state.attributes.filter((a) => a.id !== attributeId),
        message: "Attribute deleted successfully!",
        error: null,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete attribute.";
      set({error: errorMessage, isLoading: false});
      throw err;
    }
  },

  /**
   * Clear any messages in the store.
   */
  clearMessage: () => set({message: null}),

  /**
   * Clear any errors in the store.
   */
  clearError: () => set({error: null}),
}));