import { useAuthenticationStore } from '../authenticationStore';
import * as authService from 'shared/api/authService';
import { useIdentityStore } from 'features/dashboard/store/identityStore';

// --- Global Mocks ---
jest.mock('shared/api/authService', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

const mockIdentityReset = jest.fn();
jest.mock('features/dashboard/store/identityStore', () => ({
  useIdentityStore: {
    getState: jest.fn(() => ({
      reset: mockIdentityReset,
    })),
  },
}));

describe('authenticationStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    useAuthenticationStore.getState().reset();
    // Clear session storage and any mock call history
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with the correct default state', () => {
    // Arrange & Act
    const state = useAuthenticationStore.getState();

    // Assert
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.userInfo).toBeNull();
    expect(state.isLoading).toBe(true); // Initial state is loading
  });

  describe('initializeAuth action', () => {
    it('should set auth state if token exists in session storage', () => {
      // Arrange
      sessionStorage.setItem('dashboardJwtToken', 'persistent-token');
      sessionStorage.setItem('userInfo', JSON.stringify({ userId: 'user1', username: 'test' }));

      // Act
      useAuthenticationStore.getState().initializeAuth();

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('persistent-token');
      expect(state.userInfo).toEqual({ userId: 'user1', username: 'test' });
      expect(state.isLoading).toBe(false);
    });

    it('should remain logged out if no token exists', () => {
      // Arrange & Act
      useAuthenticationStore.getState().initializeAuth();

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('login action', () => {
    it('should update state and session storage on successful login', async () => {
      // Arrange
      const mockResponse = { userId: '123', username: 'testuser', token: 'fake-token' };
      authService.loginUser.mockResolvedValue(mockResponse);

      // Act
      const result = await useAuthenticationStore.getState().login('testuser', 'password');

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('fake-token');
      expect(state.userInfo).toEqual({ userId: '123', username: 'testuser' });
      expect(sessionStorage.getItem('dashboardJwtToken')).toBe('fake-token');
      expect(result).toEqual(mockResponse);
    });

    it('should reset state on failed login', async () => {
      // Arrange
      authService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(useAuthenticationStore.getState().login('testuser', 'wrongpass')).rejects.toThrow('Invalid credentials');

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
    });
  });

  describe('register action', () => {
    it('should update state and session storage on successful registration', async () => {
      // Arrange
      const mockResponse = { userId: '456', username: 'newuser', token: 'new-token' };
      authService.registerUser.mockResolvedValue(mockResponse);

      // Act
      const result = await useAuthenticationStore.getState().register({ username: 'newuser', password: 'password' });

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('new-token');
      expect(state.userInfo).toEqual({ userId: '456', username: 'newuser' });
      expect(sessionStorage.getItem('dashboardJwtToken')).toBe('new-token');
      expect(result).toEqual(mockResponse);
    });

    it('should reset state on failed registration', async () => {
      // Arrange
      authService.registerUser.mockRejectedValue(new Error('Registration failed'));

      // Act & Assert
      await expect(useAuthenticationStore.getState().register({ username: 'fail', password: 'bad' })).rejects.toThrow('Registration failed');

      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
    });
  });

  describe('logout action', () => {
    it('should clear all auth state and reset the identity store', () => {
      // Arrange
      useAuthenticationStore.setState({ isAuthenticated: true, accessToken: 'token', userInfo: {} });
      sessionStorage.setItem('dashboardJwtToken', 'token');

      // Act
      useAuthenticationStore.getState().logout();

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.userInfo).toBeNull();
      expect(sessionStorage.getItem('dashboardJwtToken')).toBeNull();
      expect(mockIdentityReset).toHaveBeenCalled();
    });
  });

  describe('Simple State Setters', () => {
    it('should set the auth token and update session storage', () => {
      // Arrange & Act
      useAuthenticationStore.getState().setAuthToken('social-login-token');

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('social-login-token');
      expect(sessionStorage.getItem('dashboardJwtToken')).toBe('social-login-token');
    });

    it('should add a connected provider only once', () => {
      // Arrange
      const { setProviderConnected } = useAuthenticationStore.getState();

      // Act
      setProviderConnected('google');
      setProviderConnected('google'); // Call a second time

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.connectedProviders).toEqual(['google']);
    });

    it('should set auth flow params', () => {
      // Arrange & Act
      useAuthenticationStore.getState().setAuthFlowParams('client-123');

      // Assert
      expect(useAuthenticationStore.getState().clientId).toBe('client-123');
    });

    it('should set redirect from connections', () => {
      // Arrange & Act
      useAuthenticationStore.getState().setRedirectFromConnections(true);

      // Assert
      expect(useAuthenticationStore.getState().redirectFromConnections).toBe(true);
    });
  });

  // --- NEW: Selection Actions Tests ---
  describe('Selection Actions', () => {
    it('should set the selected context ID', () => {
      // Arrange & Act
      useAuthenticationStore.getState().setSelectedContextId('ctx-1');

      // Assert
      expect(useAuthenticationStore.getState().selectedContextId).toBe('ctx-1');
    });

    it('should toggle an attribute ID on and off', () => {
      // Arrange
      const { toggleSelectedAttributeId } = useAuthenticationStore.getState();

      // Act: Add attribute
      toggleSelectedAttributeId('attr-1');
      // Assert: Attribute is added
      expect(useAuthenticationStore.getState().selectedAttributeIds).toEqual(['attr-1']);

      // Act: Remove attribute
      toggleSelectedAttributeId('attr-1');
      // Assert: Attribute is removed
      expect(useAuthenticationStore.getState().selectedAttributeIds).toEqual([]);
    });

    it('should set the selected attribute IDs', () => {
      // Arrange & Act
      useAuthenticationStore.getState().setSelectedAttributeIds(['attr-1', 'attr-2']);

      // Assert
      expect(useAuthenticationStore.getState().selectedAttributeIds).toEqual(['attr-1', 'attr-2']);
    });

    it('should reset the selection', () => {
      // Arrange
      useAuthenticationStore.setState({ selectedContextId: 'ctx-1', selectedAttributeIds: ['attr-1'] });

      // Act
      useAuthenticationStore.getState().resetSelection();

      // Assert
      const state = useAuthenticationStore.getState();
      expect(state.selectedContextId).toBeNull();
      expect(state.selectedAttributeIds).toEqual([]);
    });
  });
});
