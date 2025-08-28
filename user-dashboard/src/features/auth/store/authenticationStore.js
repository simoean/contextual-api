import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginUser, registerUser } from 'shared/api/authService';
import { setGlobalLogoutHandler } from 'shared/api/axiosConfig';
import { useIdentityStore } from 'features/dashboard/store/identityStore';

let _set;

/**
 * Authentication Store
 * This store manages the authentication state, user information, and actions related to login, registration, and logout.
 */
export const useAuthenticationStore = create(
  persist(
    (set, get) => {
      _set = set;

      // This is a private helper function, now correctly defined within the store's scope.
      // It's accessible to other actions without using `this`.
      const setSessionStorage = (data) => {
        sessionStorage.setItem('dashboardUsername', data.username);
        sessionStorage.setItem('dashboardUserId', data.userId);
        sessionStorage.setItem('dashboardUserInfo', JSON.stringify({ userId: data.userId, username: data.username }));
        sessionStorage.setItem('dashboardJwtToken', data.token);
      }

      const clearSessionStorage = () => {
        sessionStorage.removeItem('dashboardUsername');
        sessionStorage.removeItem('dashboardUserId');
        sessionStorage.removeItem('dashboardUserInfo');
        sessionStorage.removeItem('dashboardJwtToken');
        sessionStorage.removeItem('auth-storage');
      }

      const initialState = {
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        isLoading: true,
        userInfo: null,
        redirectFromConnections: false,
        selectedContextId: null,
        selectedAttributeIds: [],
        connectedProviders: [],
        clientId: null,
      };

      return {
        ...initialState,

        // Actions

        /**
         * Initialize authentication state from localStorage.
         */
        initializeAuth: () => {
          const token = sessionStorage.getItem('dashboardJwtToken');
          const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
          if (token) {
            set({
              isAuthenticated: true,
              userInfo: userInfo || null,
              accessToken: token || null,
            });
          }
          set({ isLoading: false });
        },

        /**
         * Login action to authenticate the user.
         * This function calls the loginUser API and updates the store state upon success.
         *
         * @param username - The username of the user.
         * @param password - The password of the user.
         * @param clientId - The ID of the client application (optional).
         * @returns {Promise<Object>}
         */
        login: async (username, password, clientId) => {
          set({ isLoading: true });
          try {
            const data = await loginUser(username, password, clientId);
            set({
              isAuthenticated: true,
              userInfo: { userId: data.userId, username: data.username },
              accessToken: data.token,
            });

            // Call the private helper function directly
            setSessionStorage(data);

            return data;
          } catch (error) {
            set({
              isAuthenticated: false,
              userInfo: null,
              accessToken: null,
              refreshToken: null,
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Register action to create a new user.
         * This function calls the registerUser API and updates the store state upon success.
         *
         * @param userData - The user data object containing username, password, and other registration details.
         * @returns {Promise<Object>}
         */
        register: async (userData) => {
          set({ isLoading: true });
          try {
            const response = await registerUser(userData);
            set({
              isAuthenticated: true,
              userInfo: { userId: response.userId, username: response.username },
              accessToken: response.token,
            });

            const data = {
              username: response.username,
              userId: response.userId,
              token: response.token,
            }

            // Call the private helper function directly
            setSessionStorage(data);

            return response;
          } catch (error) {
            set({
              isAuthenticated: false,
              userInfo: null,
              accessToken: null,
              refreshToken: null,
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Logout action to clear the authentication state.
         * This function resets the store state to unauthenticated.
         */
        logout: () => {
          set({
            isAuthenticated: false,
            userInfo: null,
            accessToken: null,
            refreshToken: null,
            selectedContextId: null,
            selectedAttributeIds: [],
            connectedProviders: [],
            redirectFromConnections: false,
            isLoading: false
          });

          // Call the private helper to clear storage
          clearSessionStorage();

          // Reset the identity store
          useIdentityStore.getState().reset();
        },

        /**
         * Sets the authentication token, used after a successful social login.
         *
         * @param {string} token - The JWT access token.
         */
        setAuthToken: (token) => {
          // Update the store state
          set({
            isAuthenticated: true,
            accessToken: token,
          });

          // Store the data in sessionStorage for persistence
          sessionStorage.setItem('dashboardJwtToken', token);
        },

        /**
         * Adds a provider name to the list of connected providers.
         * @param {string} providerName - The name of the provider (e.g., 'google').
         */
        setProviderConnected: (providerName) => {
          set((state) => {
            if (!state.connectedProviders.includes(providerName)) {
              return { connectedProviders: [...state.connectedProviders, providerName] };
            }
            return state;
          });
        },

        /**
         * Set the authentication flow parameters.
         * This function updates the store with the provided client ID.
         *
         * @param clientId - The ID of the client application.
         */
        setAuthFlowParams: (clientId) => set({clientId}),

        /**
         * Set the selected context ID.
         * This function updates the store with the provided context ID,
         *
         * @param contextId - The ID of the context to be selected.
         */
        setSelectedContextId: (contextId) => set({ selectedContextId: contextId }),

        /**
         * Sets the redirect state for the connections flow.
         * This is used to remember where the user came from after a social login redirect.
         * @param {boolean} isRedirect - True if the redirect came from the connections page.
         */
        setRedirectFromConnections: (isRedirect) => {
          set({ redirectFromConnections: isRedirect });
        },

        /**
         * Toggle the selection of an attribute ID.
         * This function adds the attribute ID to the selected list if not already present,
         *
         * @param attributeId - The ID of the attribute to toggle.
         */
        toggleSelectedAttributeId: (attributeId) =>
          set((state) => ({
            selectedAttributeIds: state.selectedAttributeIds.includes(attributeId)
              ? state.selectedAttributeIds.filter((id) => id !== attributeId)
              : [...state.selectedAttributeIds, attributeId],
          })),

        /**
         * Set the selected attribute IDs.
         * This function updates the store with the provided list of attribute IDs.
         *
         * @param ids - An array of attribute IDs to be set as selected.
         */
        setSelectedAttributeIds: (ids) => set({ selectedAttributeIds: ids }),

        /**
         * Reset the selection state.
         */
        resetSelection: () => set({ selectedContextId: null, selectedAttributeIds: [] }),

        /**
         * Reset the entire store to its initial state.
         */
        reset: () => set(initialState),
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isLoading: state.isLoading,
        userInfo: state.userInfo,
        redirectFromConnections: state.redirectFromConnections,
        selectedContextId: state.selectedContextId,
        selectedAttributeIds: state.selectedAttributeIds,
        connectedProviders: state.connectedProviders,
        clientId: state.clientId,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Zustand Persist: Hydration error occurred:', error);
            _set?.({
              isAuthenticated: false,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
              userInfo: null,
              redirectFromConnections: false,
              selectedContextId: null,
              selectedAttributeIds: [],
              connectedProviders: [],
              clientId: null,
            });
          } else {
            _set?.({ isLoading: false });
            console.log('Zustand Store: Persist hydration complete, isLoading set to false.');
          }
        };
      },
    }
  )
);

// Register the global logout handler with the Axios config
setGlobalLogoutHandler(useAuthenticationStore.getState().logout);
