import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import SignInPage from '../SignInPage';
import * as authStore from 'features/auth/store/authenticationStore';
import { fetchConsents } from 'shared/api/authService';
import * as useAuthParamsHook from 'shared/hooks/useAuthParams';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('shared/hooks/useAuthParams');

// Mock the authService module with a factory function to define its shape.
jest.mock('shared/api/authService', () => ({
  fetchConsents: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// Mock window.close and window.opener
const mockWindowClose = jest.fn();
Object.defineProperty(window, 'close', { value: mockWindowClose });
Object.defineProperty(window, 'opener', { writable: true, value: { postMessage: jest.fn() } });


describe('SignInPage', () => {
  const mockLogin = jest.fn();
  const mockSetAuthFlowParams = jest.fn();

  // Create a default state for the auth store mock to ensure all functions are present.
  const defaultAuthStoreState = {
    login: mockLogin,
    isAuthenticated: false,
    accessToken: null,
    userInfo: null,
    setAuthFlowParams: mockSetAuthFlowParams,
  };

  // Helper to render the component
  const renderComponent = (initialRoute = '/') => {
    return render(
      <ChakraProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <SignInPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Use the default mock setup
    authStore.useAuthenticationStore.mockReturnValue(defaultAuthStoreState);

    useAuthParamsHook.default.mockReturnValue({
      clientId: null,
      redirectUri: null,
      isClientFlow: false,
    });

    // Set a default mock implementation for fetchConsents
    fetchConsents.mockResolvedValue([]);
  });

  describe('Initial Rendering', () => {
    it('should render the sign-in form with a sign-up button for dashboard flow', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('signin-button')).toBeInTheDocument();
      expect(screen.getByTestId('signup-button')).toBeInTheDocument();
      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    it('should render the sign-in form with a cancel button for client flow', () => {
      // Arrange
      useAuthParamsHook.default.mockReturnValue({ isClientFlow: true });

      // Act
      renderComponent();

      // Assert
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.queryByTestId('signup-button')).not.toBeInTheDocument();
    });
  });

  describe('Sign-In Flow (Dashboard)', () => {
    it('should call login and navigate to dashboard on successful sign-in', async () => {
      // Arrange
      mockLogin.mockResolvedValue({ accessToken: 'new-token', userInfo: {} });
      renderComponent();

      // Act
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password' } });
      fireEvent.click(screen.getByTestId('signin-button'));

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password', null);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show an error toast on failed sign-in', async () => {
      // Arrange
      mockLogin.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
      renderComponent();

      // Act
      fireEvent.click(screen.getByTestId('signin-button'));

      // Assert
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', description: 'Invalid credentials' }));
      });
    });
  });

  describe('Sign-In Flow (Client)', () => {
    it('should navigate to context page if user has no prior consent', async () => {
      // Arrange
      useAuthParamsHook.default.mockReturnValue({
        clientId: 'client-abc',
        redirectUri: 'https://example.com',
        isClientFlow: true,
      });
      fetchConsents.mockResolvedValue([]); // No consents
      mockLogin.mockResolvedValue({ accessToken: 'new-token', userInfo: {} });
      renderComponent();

      // Act
      fireEvent.click(screen.getByTestId('signin-button'));

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/context?client_id=client-abc&redirect_uri=https%3A%2F%2Fexample.com');
      });
    });

    it('should close window if user has prior consent', async () => {
      // Arrange
      useAuthParamsHook.default.mockReturnValue({
        clientId: 'client-abc',
        redirectUri: 'https://example.com',
        isClientFlow: true,
      });
      fetchConsents.mockResolvedValue([{ clientId: 'client-abc' }]);
      mockLogin.mockResolvedValue({
        accessToken: 'new-token',
        userInfo: { userId: 'user1', username: 'test' }
      });
      renderComponent();

      // Act
      fireEvent.click(screen.getByTestId('signin-button'));

      // Assert
      await waitFor(() => {
        expect(window.opener.postMessage).toHaveBeenCalled();
        expect(window.close).toHaveBeenCalled();
      });
    });
  });

  describe('useEffect Redirects for Authenticated Users', () => {
    it('should redirect to dashboard if already authenticated in a dashboard flow', async () => {
      // Arrange
      authStore.useAuthenticationStore.mockReturnValue({
        ...defaultAuthStoreState,
        isAuthenticated: true,
        accessToken: 'existing-token',
      });

      // Act
      renderComponent();

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to context page if authenticated in a client flow without consent', async () => {
      // Arrange
      authStore.useAuthenticationStore.mockReturnValue({
        ...defaultAuthStoreState,
        isAuthenticated: true,
        accessToken: 'existing-token',
      });
      useAuthParamsHook.default.mockReturnValue({
        clientId: 'client-abc',
        redirectUri: 'https://example.com',
        isClientFlow: true,
      });
      fetchConsents.mockResolvedValue([]); // No consents

      // Act
      renderComponent();

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/context?client_id=client-abc&redirect_uri=https%3A%2F%2Fexample.com');
      });
    });
  });
});
