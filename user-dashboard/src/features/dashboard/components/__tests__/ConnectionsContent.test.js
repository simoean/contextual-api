import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import ConnectionsContent from '../ConnectionsContent';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as connectionActionsHook from 'shared/hooks/useConnectionActions';
import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');
jest.mock('shared/hooks/useConnectionActions');

// Mock the data file for providers
jest.mock('shared/data/oauthProviders', () => ({
  contextProviders: {
    Personal: [{ id: 'google', name: 'Google', icon: 'GoogleIcon', color: '#db4437' }],
    Work: [{ id: 'github', name: 'Github', icon: 'GithubIcon', color: '#333' }],
  },
}));


// --- Test Data ---
const mockContexts = [
  { id: 'ctx-1', name: 'Personal' },
  { id: 'ctx-2', name: 'Work' },
];

// ** THE FIX **: Updated mock data to match the new multi-account structure
const mockConnections = [
  { id: 'conn-1', providerId: 'google', providerUserId: 'user.one@google.com' },
  { id: 'conn-2', providerId: 'google', providerUserId: 'user.two@google.com' },
];

describe('ConnectionsContent', () => {
  // --- Mocks Setup ---
  const mockSetSelectedContextId = jest.fn();
  const mockSetRedirectFromConnections = jest.fn();
  const mockHandleConnect = jest.fn();
  const mockHandleDisconnect = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the stores
    authStore.useAuthenticationStore.mockReturnValue({
      setSelectedContextId: mockSetSelectedContextId,
      setRedirectFromConnections: mockSetRedirectFromConnections,
    });
    identityStore.useIdentityStore.mockReturnValue({
      contexts: mockContexts,
      connections: mockConnections,
    });

    // Mock the custom hook
    connectionActionsHook.useConnectionActions.mockReturnValue({
      handleConnect: mockHandleConnect,
      handleDisconnect: mockHandleDisconnect,
      isDeleting: false,
    });
  });

  // Helper to render the component
  const renderComponent = () => {
    return render(
      <ChakraProvider>
        <ConnectionsContent />
      </ChakraProvider>
    );
  };

  // --- Test Cases ---
  describe('Rendering for Multiple Accounts', () => {
    it('should render a list of connected accounts for a provider', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const personalCard = screen.getByTestId('connection-card-Personal');
      expect(within(personalCard).getByText('user.one@google.com')).toBeInTheDocument();
      expect(within(personalCard).getByText('user.two@google.com')).toBeInTheDocument();
    });

    it('should render an "Add another account" button when connections exist', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const personalCard = screen.getByTestId('connection-card-Personal');
      expect(within(personalCard).getByRole('button', { name: /add another google account/i })).toBeInTheDocument();
    });

    it('should render a "Connect with" button when no connections exist for a provider', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const workCard = screen.getByTestId('connection-card-Work');
      expect(within(workCard).getByRole('button', { name: /connect with github/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions for Multiple Accounts', () => {
    it('should call handleConnect when the "Add another account" button is clicked', () => {
      // Arrange
      renderComponent();
      const addGoogleButton = screen.getByRole('button', { name: /add another google account/i });

      // Act
      fireEvent.click(addGoogleButton);

      // Assert
      expect(mockSetRedirectFromConnections).toHaveBeenCalledWith(true);
      expect(mockSetSelectedContextId).toHaveBeenCalledWith('ctx-1');
      expect(mockHandleConnect).toHaveBeenCalledWith('google', 'ctx-1');
    });

    it('should open the disconnect modal with the correct user ID when a disconnect icon is clicked', async () => {
      // Arrange
      renderComponent();
      // Find the disconnect button specifically for user.one@google.com
      const disconnectButton = screen.getByLabelText(/disconnect user.one@google.com/i);

      // Act
      fireEvent.click(disconnectButton);

      // Assert
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/disconnect account\?/i)).toBeInTheDocument();
      // Verify it shows the correct user ID in the modal body
      expect(within(dialog).getByText('user.one@google.com')).toBeInTheDocument();
    });

    it('should call handleDisconnect with the correct connection ID on confirmation', async () => {
      // Arrange
      renderComponent();
      const disconnectButton = screen.getByLabelText(/disconnect user.two@google.com/i);

      // Act
      fireEvent.click(disconnectButton);
      const dialog = await screen.findByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /disconnect/i });
      fireEvent.click(confirmButton);

      // Assert
      // It should be called with 'conn-2', which is the ID for user.two@google.com
      expect(mockHandleDisconnect).toHaveBeenCalledWith('conn-2');
    });
  });
});
