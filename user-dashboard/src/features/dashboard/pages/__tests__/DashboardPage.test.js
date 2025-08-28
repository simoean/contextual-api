import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '../DashboardPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import { useColorMode } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// Global Mocks
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');

// Mock child components to isolate DashboardPage logic
jest.mock('features/dashboard/components/ContextsContent', () => () => <div>Contexts Content</div>);
jest.mock('features/dashboard/components/AttributesContent', () => () => <div>Attributes Content</div>);
jest.mock('features/dashboard/components/ConsentsContent', () => () => <div>Consents Content</div>);
jest.mock('features/dashboard/components/ConnectionsContent', () => () => <div>Connections Content</div>);


jest.mock('@chakra-ui/react', () => {
  const actualChakra = jest.requireActual('@chakra-ui/react');
  return {
    ...actualChakra,
    useColorMode: jest.fn(),
  };
});

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard/contexts' }) // Default location
}));


describe('DashboardPage', () => {
  // --- Given: Mock Functions (Set up once for the suite) ---
  const mockLogout = jest.fn();
  const mockToggleColorMode = jest.fn();
  const mockFetchIdentityData = jest.fn();

  // Reusable default states for the stores
  const defaultAuthStoreState = {
    userInfo: { username: 'TestUser' },
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
    accessToken: 'fake-token',
  };

  const defaultIdentityStoreState = {
    contexts: [{id: 'ctx1', name: 'Personal'}],
    attributes: [{id: 'attr1', name: 'Email'}],
    fetchIdentityData: mockFetchIdentityData,
    isLoading: false,
    error: null,
    addContext: jest.fn(),
    updateContext: jest.fn(),
    deleteContext: jest.fn(),
    addAttribute: jest.fn(),
    updateAttribute: jest.fn(),
    deleteAttribute: jest.fn(),
  };

  // A helper function to set up the default successful state for stores
  const setupSuccessMocks = () => {
    authStore.useAuthenticationStore.mockReturnValue(defaultAuthStoreState);
    identityStore.useIdentityStore.mockReturnValue(defaultIdentityStoreState);
    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode,
    });
  };


  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    setupSuccessMocks(); // Setup default success state
  });

  // --- Loading, Error, and Auth State Tests ---
  describe('Initial State Rendering', () => {
    it('should display a loading spinner when auth or identity data is loading', () => {
      // Arrange
      authStore.useAuthenticationStore.mockReturnValue({ isLoading: true });

      // Act
      render(<DashboardPage />);

      // Assert
      expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
    });

    it('should display an error alert with a retry button when there is a store error', () => {
      // Arrange
      identityStore.useIdentityStore.mockReturnValue({
        ...identityStore.useIdentityStore(),
        error: 'Failed to load data',
        fetchIdentityData: mockFetchIdentityData,
      });
      render(<DashboardPage />);

      // Act
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Assert
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
    });

    it('should redirect to the auth page if the user is not authenticated', async () => {
      // Arrange
      authStore.useAuthenticationStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
      });

      // Act
      render(<DashboardPage />);

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      });
    });
  });


  // --- Main Layout and Interaction Tests ---
  describe('Authenticated User Interactions', () => {
    it('should display the main dashboard layout with user greeting', () => {
      // Arrange & Act
      render(<DashboardPage />);

      // Assert
      expect(screen.getByText(/hello, testuser/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /contextual identity api/i })).toBeInTheDocument();
    });

    it('should call toggleColorMode when the color mode button is clicked', () => {
      // Arrange
      render(<DashboardPage />);

      // Act
      fireEvent.click(screen.getByLabelText(/toggle color mode/i));

      // Assert
      expect(mockToggleColorMode).toHaveBeenCalledTimes(1);
    });

    it('should call logout when the sign out button is clicked', () => {
      // Arrange
      render(<DashboardPage />);

      // Act
      fireEvent.click(screen.getByLabelText(/sign out/i));

      // Assert
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should expand and collapse the sidebar when the toggle button is clicked', () => {
      // Arrange
      render(<DashboardPage />);
      const toggleButton = screen.getByLabelText(/expand sidebar/i);

      // Act & Assert for expand
      fireEvent.click(toggleButton);
      expect(screen.getByLabelText(/collapse sidebar/i)).toBeInTheDocument();

      // Act & Assert for collapse
      fireEvent.click(toggleButton);
      expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument();
    });
  });

  // --- Navigation and Content Rendering Tests ---
  describe('Navigation and Content Rendering', () => {
    // Helper to re-render the component with a new URL
    const renderWithLocation = (pathname) => {
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname });
      return render(<DashboardPage />);
    };

    it('should render ContextsContent by default for the base dashboard URL', () => {
      // Arrange & Act
      renderWithLocation('/dashboard');

      // Assert
      expect(screen.getByText('Contexts Content')).toBeInTheDocument();
    });

    it('should render ContextsContent when navigating to /dashboard/contexts', () => {
      // Arrange & Act
      renderWithLocation('/dashboard/contexts');

      // Assert
      expect(screen.getByText('Contexts Content')).toBeInTheDocument();
    });

    it('should navigate to the attributes page and render AttributesContent when the attributes link is clicked', () => {
      // Arrange
      const { rerender } = renderWithLocation('/dashboard/contexts');
      const attributesLink = screen.getByTestId('nav-attributes');

      // Act
      fireEvent.click(attributesLink);

      // Assert: Navigation was triggered
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/attributes');

      // Act: Simulate the URL change by re-rendering
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard/attributes' });
      rerender(<DashboardPage />);

      // Assert: The correct content is now displayed
      expect(screen.getByText('Attributes Content')).toBeInTheDocument();
      expect(screen.queryByText('Contexts Content')).not.toBeInTheDocument();
    });

    it('should navigate to the consents page and render ConsentsContent when the consents link is clicked', () => {
      // Arrange
      const { rerender } = renderWithLocation('/dashboard/contexts');

      // Act
      fireEvent.click(screen.getByTestId('nav-consents'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/consents');

      // Act
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard/consents' });
      rerender(<DashboardPage />);

      // Assert
      expect(screen.getByText('Consents Content')).toBeInTheDocument();
    });

    it('should navigate to the connections page and render ConnectionsContent when the connections link is clicked', () => {
      // Arrange
      const { rerender } = renderWithLocation('/dashboard/contexts');

      // Act
      fireEvent.click(screen.getByTestId('nav-connections'));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/connections');

      // Act
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({ pathname: '/dashboard/connections' });
      rerender(<DashboardPage />);

      // Assert
      expect(screen.getByText('Connections Content')).toBeInTheDocument();
    });

    it('should default to ContextsContent for an invalid URL path', () => {
      // Arrange & Act
      renderWithLocation('/dashboard/some-invalid-page');

      // Assert
      expect(screen.getByText('Contexts Content')).toBeInTheDocument();
    });
  });

  // --- Data Fetching Logic Test ---
  describe('Data Fetching Effect', () => {
    it('should call fetchIdentityData if contexts are empty', async () => {
      // Arrange
      identityStore.useIdentityStore.mockReturnValue({
        ...defaultIdentityStoreState,
        contexts: [], // Override contexts to be empty for this test
      });

      // Act
      render(<DashboardPage />);

      // Assert
      await waitFor(() => {
        expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
      });
    });

    it('should NOT call fetchIdentityData if data is already present and there is no error', () => {
      // Arrange & Act
      render(<DashboardPage />);

      // Assert
      expect(mockFetchIdentityData).not.toHaveBeenCalled();
    });
  });
});
