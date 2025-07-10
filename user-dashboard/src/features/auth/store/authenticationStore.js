import { create } from 'zustand';

/**
 * Authentication Store
 * This store manages the temporary state for the authentication popup,
 * specifically the user's selected context and attributes for client authentication.
 */
export const useAuthenticationStore = create((set) => ({

  // State for the selected context and attributes
  selectedContextId: null,
  selectedAttributeIds: [],

  // --- Actions ---

  /**
   * Sets the currently selected context ID.
   *
   * @param {string | null} contextId - The ID of the selected context, or null to clear.
   */
  setSelectedContextId: (contextId) => set({ selectedContextId: contextId }),

  /**
   * Adds or removes an attribute ID from the selected attributes list.
   * Toggles the selection of an attribute.
   *
   * @param {string} attributeId - The ID of the attribute to toggle.
   */
  toggleSelectedAttributeId: (attributeId) =>
    set((state) => ({
      selectedAttributeIds: state.selectedAttributeIds.includes(attributeId)
        ? state.selectedAttributeIds.filter((id) => id !== attributeId)
        : [...state.selectedAttributeIds, attributeId],
    })),

  /**
   * Resets the popup's authentication selections to their initial state.
   */
  resetSelection: () => set({ selectedContextId: null, selectedAttributeIds: [] }),
}));