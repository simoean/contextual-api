import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {loginUser, registerUser} from 'shared/api/authService';
import {setGlobalLogoutHandler} from 'shared/api/axiosConfig';

import {useIdentityStore} from 'features/dashboard/store/identityStore';

let _set;

/**
 * Authentication Store
 * This store manages the authentication state, user information, and actions related to login, registration, and logout.
 */
export const useAuthenticationStore = create(
  persist(
    (set, get) => {
      _set = set; // <-- Capture it here to be used in `onRehydrateStorage`

      return {

        // Initial state
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        isLoading: true,

        // Selection state for contexts and attributes
        selectedContextId: null,
        selectedAttributeIds: [],

        // Actions

        /**
         * Initialize authentication state from localStorage.
         */
        initializeAuth: () => {
          const token = localStorage.getItem('dashboardJwtToken');
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
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
         * @returns {Promise<Object>}
         */
        login: async (username, password) => {
          set({ isLoading: true });
          try {
            const data = await loginUser(username, password);
            set({
              isAuthenticated: true,
              userInfo: { userId: data.userId, username: data.username },
              accessToken: data.token,
            });

            sessionStorage.setItem('dashboardUsername', data.username);
            sessionStorage.setItem('dashboardUserId', data.userId);
            sessionStorage.setItem('dashboardUserInfo', JSON.stringify({ userId: data.userId, username: data.username }));
            sessionStorage.setItem('dashboardJwtToken', data.token);

            return data;
          } catch (error) {
            set({ isAuthenticated: false, userInfo: null, accessToken: null, refreshToken: null });
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
            return response;
          } catch (error) {
            set({ isAuthenticated: false, userInfo: null, accessToken: null, refreshToken: null });
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
            isLoading: false,
          });

          // Clear session storage
          sessionStorage.removeItem('dashboardUsername');
          sessionStorage.removeItem('dashboardUserId');
          sessionStorage.removeItem('dashboardUserInfo');
          sessionStorage.removeItem('dashboardJwtToken');
          sessionStorage.removeItem('auth-storage');

          // Reset the identity store
          useIdentityStore.getState().reset();
        },

        /**
         * Set the selected context ID.
         * This function updates the store with the provided context ID,
         *
         * @param contextId - The ID of the context to be selected.
         */
        setSelectedContextId: (contextId) => set({ selectedContextId: contextId }),

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
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userInfo: state.userInfo,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        selectedContextId: state.selectedContextId,
        selectedAttributeIds: state.selectedAttributeIds,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Zustand Persist: Hydration error occurred:', error);
            _set?.({
              isAuthenticated: false,
              userInfo: null,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
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