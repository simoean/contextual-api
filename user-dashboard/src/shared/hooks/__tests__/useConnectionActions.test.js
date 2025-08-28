import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnectionActions } from '../useConnectionActions';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as authService from 'shared/api/authService';
import { useToast } from '@chakra-ui/react';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');

// ** THE FIX **
// Explicitly mock the authService and define the functions it exports.
jest.mock('shared/api/authService', () => ({
  deleteConnection: jest.fn(),
}));

// Mock the data file for providers
jest.mock('shared/data/oauthProviders', () => ({
  contextProviders: {
    Personal: [{ id: 'google', name: 'Google', icon: 'GoogleIcon', authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', clientId: 'google-client-id', scopes: 'openid profile email' }],
    Work: [{ id: 'github', name: 'Github', icon: 'GithubIcon', authUrl: 'https://github.com/login/oauth/authorize', clientId: 'github-client-id', scopes: 'user' }],
    Social: [{ id: 'facebook', name: 'Facebook', icon: 'FacebookIcon', authUrl: 'https://www.facebook.com/v12.0/dialog/oauth', clientId: 'YOUR_FACEBOOK_CLIENT_ID', scopes: 'email' }],
  },
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// Mock window.location.href
const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { href: '' };
});
afterAll(() => {
  window.location = originalLocation;
});


describe('useConnectionActions', () => {
  const mockFetchIdentityData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the stores
    authStore.useAuthenticationStore.mockReturnValue({
      accessToken: 'fake-token',
    });
    identityStore.useIdentityStore.mockReturnValue({
      fetchIdentityData: mockFetchIdentityData,
    });
  });

  describe('handleConnect', () => {
    it('should redirect to the correct OAuth URL for a valid provider', () => {
      // Arrange
      const { result } = renderHook(() => useConnectionActions());

      // Act
      act(() => {
        result.current.handleConnect('google');
      });

      // Assert
      const expectedRedirectUri = encodeURIComponent('http://localhost:8080/api/v1/auth/callback?provider=google');
      expect(window.location.href).toBe(`https://accounts.google.com/o/oauth2/v2/auth?client_id=google-client-id&redirect_uri=${expectedRedirectUri}&response_type=code&scope=openid%20profile%20email`);
    });

    it('should show an info toast for a provider with a placeholder client ID', () => {
      // Arrange
      const { result } = renderHook(() => useConnectionActions());

      // Act
      act(() => {
        result.current.handleConnect('facebook');
      });

      // Assert
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'info',
        title: 'Feature Coming Soon',
      }));
      expect(window.location.href).not.toContain('facebook');
    });

    it('should show an error toast for a provider that does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useConnectionActions());

      // Act
      act(() => {
        result.current.handleConnect('invalid-provider');
      });

      // Assert
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        title: 'Error',
        description: 'Provider configuration not found.',
      }));
    });
  });

  describe('handleDisconnect', () => {
    it('should call deleteConnection and refetch data on success', async () => {
      // Arrange
      authService.deleteConnection.mockResolvedValue();
      const { result } = renderHook(() => useConnectionActions());

      // Act
      await act(async () => {
        await result.current.handleDisconnect('google');
      });

      // Assert
      expect(authService.deleteConnection).toHaveBeenCalledWith('fake-token', 'google');
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        title: 'Connection Removed',
      }));
    });

    it('should show an error toast if deleteConnection fails', async () => {
      // Arrange
      authService.deleteConnection.mockRejectedValue(new Error('API Error'));
      const { result } = renderHook(() => useConnectionActions());

      // Act
      await act(async () => {
        await result.current.handleDisconnect('google');
      });

      // Assert
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        title: 'Error',
        description: 'Failed to remove connection. Please try again.',
      }));
    });
  });
});
