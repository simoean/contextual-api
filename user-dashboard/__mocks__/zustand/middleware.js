module.exports = {
  // Mock the `persist` function
  persist: (config) => (set, get, api) => {
    const storeCreator = config(set, get, api);
    return {
      ...storeCreator, // Spread the actual store's state and actions
      isLoading: false, // Ensure isLoading starts as false in tests after mocked hydration
    };
  },
  // Mock `createJSONStorage` similarly
  createJSONStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
};