import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ConnectionsContent from '../ConnectionsContent';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as connectionActionsHook from 'shared/hooks/useConnectionActions';
import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
// We no longer need to import the icons here for the mock
// import { FaGoogle, FaGithub } from 'react-icons/fa';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');
jest.mock('shared/hooks/useConnectionActions');

// Mock the data file that provides the provider info.
// Replace the icon components with simple strings to avoid the ReferenceError.
jest.mock('shared/data/oauthProviders', () => ({
  contextProviders: {
    Personal: [
      { id: 'google', name: 'Google', icon: 'GoogleIcon', color: '#db4437' },
    ],
    Work: [
      { id: 'github', name: 'Github', icon: 'GithubIcon', color: '#333' },
    ],
  },
}));


// --- Test Data ---
const mockContexts = [
  { id: 'ctx-1', name: 'Personal' },
  { id: 'ctx-2', name: 'Work' },
];

// Mock connections from the store
const mockConnections = [
  { providerId: 'google' }, // User is connected to Google
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
  describe('Rendering', () => {
    it('should render the main heading and introductory text', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: /manage connections/i })).toBeInTheDocument();
      expect(screen.getByText(/link your external accounts/i)).toBeInTheDocument();
    });

    it('should render context cards with their associated providers', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      // Find the card for the "Personal" context by its unique name
      const personalCard = screen.getByTestId('connection-card-Personal');
      // Check for content *within* that card
      expect(within(personalCard).getByText(/context:/i)).toBeInTheDocument();
      expect(within(personalCard).getByRole('button', { name: /google/i })).toBeInTheDocument();

      // Find the card for the "Work" context
      const workCard = screen.getByTestId('connection-card-Work');
      // Check for content *within* that card
      expect(within(workCard).getByText(/context:/i)).toBeInTheDocument();
      expect(within(workCard).getByRole('button', { name: /github/i })).toBeInTheDocument();
    });

    it('should show "Connected" status for linked providers', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const googleButton = screen.getByRole('button', { name: /google/i });
      expect(within(googleButton).getByText(/connected/i)).toBeInTheDocument();
    });

    it('should show "Connect" status for unlinked providers', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      const githubButton = screen.getByRole('button', { name: /github/i });
      expect(within(githubButton).getByText(/connect/i)).toBeInTheDocument();
    });

    it('should display a message if no contexts are available', () => {
      // Arrange
      identityStore.useIdentityStore.mockReturnValue({
        contexts: [],
        connections: [],
      });

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/no contexts found/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call handleConnect and store functions when a "Connect" button is clicked', () => {
      // Arrange
      renderComponent();
      const githubButton = screen.getByRole('button', { name: /github/i });

      // Act
      fireEvent.click(githubButton);

      // Assert
      expect(mockSetRedirectFromConnections).toHaveBeenCalledWith(true);
      expect(mockSetSelectedContextId).toHaveBeenCalledWith('ctx-2'); // Github is in the "Work" context
      expect(mockHandleConnect).toHaveBeenCalledWith('github', 'ctx-2');
    });

    it('should open the disconnect confirmation modal when a "Connected" button is clicked', async () => {
      // Arrange
      renderComponent();
      const googleButton = screen.getByRole('button', { name: /google/i });

      // Act
      fireEvent.click(googleButton);

      // Assert
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/disconnect google\?/i)).toBeInTheDocument();
    });

    it('should call handleDisconnect when the disconnect is confirmed in the modal', async () => {
      // Arrange
      renderComponent();
      const googleButton = screen.getByRole('button', { name: /google/i });

      // Act
      fireEvent.click(googleButton);
      const dialog = await screen.findByRole('dialog');
      const disconnectConfirmButton = within(dialog).getByRole('button', { name: /disconnect/i });
      fireEvent.click(disconnectConfirmButton);

      // Assert
      expect(mockHandleDisconnect).toHaveBeenCalledWith('google');
    });
  });
});
