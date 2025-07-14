// __mocks__/zustand/middleware.js
// This file will be automatically picked up by Jest when 'zustand/middleware' is imported.

module.exports = {
  // Mock the `persist` function
  persist: (config) => (set, get, api) => {
    // Call the actual store creator function (the one you pass to `create`)
    // This `storeCreator` function contains your actual state and actions (login, logout, etc.)
    const storeCreator = config(set, get, api);

    // Now, return an object that contains all the properties (state and actions)
    // that your actual store creator defines.
    // This makes sure `store.login`, `store.logout`, etc., are available.
    // Also, merge in any mocked hydration logic.
    return {
      ...storeCreator, // Spread the actual store's state and actions
      // Override/add any persistence-specific logic for tests
      // For instance, make sure `isLoading` is set to false right away,
      // as `persist` would normally handle this after rehydration.
      isLoading: false, // Ensure isLoading starts as false in tests after mocked hydration
      // If you had `onRehydrateStorage` that needs to be explicitly run,
      // you'd call it here or in a `beforeEach`.
      // For now, we assume `isLoading: false` is sufficient to simulate hydration.
    };
  },
  // Mock `createJSONStorage` similarly
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
};