import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import AuthCallbackPage from '../AuthCallbackPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as authService from 'shared/api/authService';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');

// ** THE FIX **
// Mock the authService module with a factory to define its shape.
jest.mock('shared/api/authService', () => ({
  fetchAttributes: jest.fn(),
  saveConnection: jest.fn(),
  saveAttributesBulk: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockUrlParams)],
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// Variable to control URL params for each test
let mockUrlParams = '';

describe('AuthCallbackPage', () => {
  const mockSetProviderConnected = jest.fn();
  const mockFetchIdentityData = jest.fn();
  const mockSetRedirectFromConnections = jest.fn();

  const mockAttributes = [
    { id: 'attr-1', name: 'email', value: 'user@google.com', contextIds: ['ctx-1'], visible: true },
    { id: 'attr-2', name: 'name', value: 'Test User', contextIds: ['ctx-1'], visible: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authStore.useAuthenticationStore.mockReturnValue({
      setProviderConnected: mockSetProviderConnected,
      selectedContextId: 'ctx-1',
      accessToken: 'fake-app-token',
      isAuthenticated: true,
      userInfo: { userId: 'user-123' },
      redirectFromConnections: false,
      setRedirectFromConnections: mockSetRedirectFromConnections,
    });
    identityStore.useIdentityStore.mockReturnValue({
      contexts: [{ id: 'ctx-1', name: 'Personal' }],
      fetchIdentityData: mockFetchIdentityData,
    });
    // Now we can safely set the mock's behavior
    authService.fetchAttributes.mockResolvedValue(mockAttributes);
  });

  const renderComponent = () => {
    return render(
      <ChakraProvider>
        <MemoryRouter>
          <AuthCallbackPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  it('should fetch and display attributes on successful callback', async () => {
    // Arrange
    mockUrlParams = 'status=success&provider=google&providerAccessToken=prov-token';

    // Act
    renderComponent();

    // Assert
    expect(await screen.findByRole('heading', { name: /review and edit/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@google.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('should show an error toast and redirect on error callback', async () => {
    // Arrange
    mockUrlParams = 'status=error&message=Access%20Denied';

    // Act
    renderComponent();

    // Assert
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', description: 'Access Denied' }));
      expect(mockNavigate).toHaveBeenCalledWith('/auth/connect');
    });
  });

  it('should save attributes and connection and then redirect', async () => {
    // Arrange
    mockUrlParams = 'status=success&provider=google&providerAccessToken=prov-token';
    authService.saveConnection.mockResolvedValue({});
    authService.saveAttributesBulk.mockResolvedValue({});
    renderComponent();

    // Wait for the page to load
    await screen.findByText(/save and continue/i);

    // Act
    const saveButton = screen.getByRole('button', { name: /save and continue/i });
    fireEvent.click(saveButton);

    // Assert
    await waitFor(() => {
      expect(authService.saveConnection).toHaveBeenCalled();
      expect(authService.saveAttributesBulk).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(mockNavigate).toHaveBeenCalledWith('/auth/connect');
    });
  });
});
