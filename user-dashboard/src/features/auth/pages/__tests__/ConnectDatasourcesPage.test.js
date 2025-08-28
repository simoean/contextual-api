import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import ConnectDatasourcesPage from '../ConnectDatasourcesPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as connectionActionsHook from 'shared/hooks/useConnectionActions';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');
jest.mock('shared/hooks/useConnectionActions');

// ** THE FIX **
// Mock the data file and replace icon components with strings to avoid the ReferenceError.
jest.mock('shared/data/oauthProviders', () => ({
  contextProviders: {
    Personal: [{ id: 'google', name: 'Google', icon: 'GoogleIcon' }],
    Work: [{ id: 'github', name: 'Github', icon: 'GithubIcon' }],
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ConnectDatasourcesPage', () => {
  const mockSetSelectedContextId = jest.fn();
  const mockFetchIdentityData = jest.fn().mockResolvedValue(true);
  const mockHandleConnect = jest.fn();

  const mockContexts = [
    { id: 'ctx-1', name: 'Personal' },
    { id: 'ctx-2', name: 'Work' },
  ];

  const renderComponent = (authOverrides = {}, identityOverrides = {}) => {
    authStore.useAuthenticationStore.mockReturnValue({
      connectedProviders: [],
      accessToken: 'fake-token',
      selectedContextId: 'ctx-1', // Default to Personal selected
      setSelectedContextId: mockSetSelectedContextId,
      ...authOverrides,
    });
    identityStore.useIdentityStore.mockReturnValue({
      contexts: mockContexts,
      fetchIdentityData: mockFetchIdentityData,
      isLoaded: true,
      ...identityOverrides,
    });
    connectionActionsHook.useConnectionActions.mockReturnValue({
      handleConnect: mockHandleConnect,
    });

    return render(
      <ChakraProvider>
        <MemoryRouter>
          <ConnectDatasourcesPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the initial page content and providers for the default context', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByRole('heading', { name: /populate your account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect with google/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect with github/i })).not.toBeInTheDocument();
  });

  it('should switch providers when a different context is selected', () => {
    // Arrange
    renderComponent();
    const workButton = screen.getByRole('button', { name: /work/i });

    // Act
    fireEvent.click(workButton);

    // Assert
    expect(mockSetSelectedContextId).toHaveBeenCalledWith('ctx-2');
  });

  it('should call handleConnect when a provider button is clicked', () => {
    // Arrange
    renderComponent();
    const connectButton = screen.getByRole('button', { name: /connect with google/i });

    // Act
    fireEvent.click(connectButton);

    // Assert
    expect(mockHandleConnect).toHaveBeenCalledWith('google', 'ctx-1');
  });

  it('should show "Continue to Dashboard" and navigate when the button is clicked', async () => {
    // Arrange
    renderComponent({ connectedProviders: ['google'] }); // Simulate a provider is connected
    const continueButton = screen.getByRole('button', { name: /continue to dashboard/i });

    // Act
    fireEvent.click(continueButton);

    // Assert
    await waitFor(() => {
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
