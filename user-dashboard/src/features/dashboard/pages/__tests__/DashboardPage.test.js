import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '../DashboardPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import { useColorMode } from '@chakra-ui/react'; // Import useColorMode to mock it
import '@testing-library/jest-dom'; // Ensure jest-dom matchers are available

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');
jest.mock('@chakra-ui/react', () => {
  const actualChakra = jest.requireActual('@chakra-ui/react');
  return {
    ...actualChakra,
    useColorMode: jest.fn(),
  };
});

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardPage', () => {
  // --- Given: Mock Functions (Set up once for the suite) ---
  const mockLogout = jest.fn();
  const mockToggleColorMode = jest.fn();
  const mockFetchIdentityData = jest.fn();
  const mockAddContext = jest.fn();
  const mockUpdateContext = jest.fn();
  const mockDeleteContext = jest.fn();
  const mockAddAttribute = jest.fn();
  const mockUpdateAttribute = jest.fn();
  const mockDeleteAttribute = jest.fn();

  beforeEach(() => {
    // --- Given: Reset mocks and initial state for each test ---
    jest.clearAllMocks(); // Resets all mocks and their call history

    // Reset specific mock implementations if they were set with .mockImplementationOnce etc.
    mockLogout.mockReset();
    mockToggleColorMode.mockReset();
    mockFetchIdentityData.mockReset();
    mockAddContext.mockReset();
    mockUpdateContext.mockReset();
    mockDeleteContext.mockReset();
    mockAddAttribute.mockReset();
    mockUpdateAttribute.mockReset();
    mockDeleteAttribute.mockReset();
    mockNavigate.mockReset(); // Reset navigate mock

    // Mock useAuthenticationStore's default successful state
    authStore.useAuthenticationStore.mockReturnValue({
      userInfo: { username: 'TestUser', selectedContext: null },
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout,
      accessToken: 'fake-token',
      setUserInfo: jest.fn(), // Ensure setUserInfo is also mocked if used by children
    });

    // Mock useIdentityStore's default successful state
    identityStore.useIdentityStore.mockReturnValue({
      contexts: [],
      attributes: [],
      fetchIdentityData: mockFetchIdentityData,
      isLoading: false,
      error: null,
      addContext: mockAddContext,
      updateContext: mockUpdateContext,
      deleteContext: mockDeleteContext,
      addAttribute: mockAddAttribute,
      updateAttribute: mockUpdateAttribute,
      deleteAttribute: mockDeleteAttribute,
    });

    // Mock useColorMode
    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode,
    });
  });

  // Loading and Error States

  it('Given: Auth store or identity data is loading, When: DashboardPage renders, Then: Displays a loading spinner and message', () => {
    // Given: Authentication is loading
    authStore.useAuthenticationStore.mockReturnValue({
      userInfo: null,
      isAuthenticated: false,
      isLoading: true,
      logout: mockLogout,
      accessToken: null,
      setUserInfo: jest.fn(),
    });

    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: A loading message and spinner should be displayed
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  it('Given: Identity store has an error, When: DashboardPage renders, Then: Displays an error alert with a retry button that calls fetchIdentityData', () => {
    // Given: Identity store returns an error
    identityStore.useIdentityStore.mockReturnValue({
      contexts: [],
      attributes: [],
      fetchIdentityData: mockFetchIdentityData,
      isLoading: false,
      error: 'Failed to load data',
      addContext: mockAddContext, updateContext: mockUpdateContext, deleteContext: mockDeleteContext,
      addAttribute: mockAddAttribute, updateAttribute: mockUpdateAttribute, deleteAttribute: mockDeleteAttribute,
    });

    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: An error alert with specific messages should be displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();

    // When: Retry button is clicked
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Then: fetchIdentityData should be called with the access token
    expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
  });

  it('Given: User is unauthenticated and auth is not loading, When: DashboardPage renders, Then: Redirects to the auth page', async () => {
    // Given: Authentication state indicates not authenticated and not loading
    authStore.useAuthenticationStore.mockReturnValue({
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
      logout: mockLogout,
      accessToken: null,
      setUserInfo: jest.fn(),
    });

    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: useNavigate should be called to redirect to '/auth'
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  it('Given: User is unauthenticated and auth is not loading AND has an accessToken, When: DashboardPage renders, Then: Redirects to the auth page', async () => {
    // Given: Authentication state indicates not authenticated but has a token (should still redirect)
    authStore.useAuthenticationStore.mockReturnValue({
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
      logout: mockLogout,
      accessToken: 'stale-token',
      setUserInfo: jest.fn(),
    });

    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: useNavigate should be called to redirect to '/auth'
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  // Main Layout and Interactions

  it('Given: User is authenticated and data is loaded, When: DashboardPage renders, Then: Displays the main dashboard layout with user greeting and navigation', () => {
    // Given: All stores return success states (default beforeEach setup)
    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: Header with username greeting should be present
    expect(screen.getByText(/hello, testuser/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contextual identity api/i })).toBeInTheDocument();

    // Verify: Sidebar navigation items are present
    expect(screen.getByTestId('nav-contexts')).toBeInTheDocument();
    expect(screen.getByTestId('nav-attributes')).toBeInTheDocument();
  });

  it('Given: Dashboard is rendered, When: Color mode toggle button is clicked, Then: toggleColorMode is called', () => {
    // Given: DashboardPage is rendered
    render(<DashboardPage />);

    // When: Color mode toggle button is clicked
    const toggleButton = screen.getByLabelText(/toggle color mode/i);
    fireEvent.click(toggleButton);

    // Then: mockToggleColorMode should be called
    expect(mockToggleColorMode).toHaveBeenCalledTimes(1);
  });

  it('Given: Dashboard is rendered, When: Sidebar toggle button is clicked, Then: Sidebar expands and collapses, updating button text', () => {
    // Given: DashboardPage is rendered (sidebar starts collapsed by default in component)
    render(<DashboardPage />);

    const toggleSidebarButton = screen.getByRole('button', {
      name: /expand sidebar/i,
    });

    // When: Sidebar toggle button is clicked to expand
    fireEvent.click(toggleSidebarButton);

    // Then: Button text should change to "Collapse Sidebar"
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand sidebar/i })).not.toBeInTheDocument();

    // When: Sidebar toggle button is clicked again to collapse
    fireEvent.click(toggleSidebarButton);

    // Then: Button text should change back to "Expand Sidebar"
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /collapse sidebar/i })).not.toBeInTheDocument();
  });

  it('Given: Dashboard is rendered, When: Sign out button is clicked, Then: User is logged out', () => {
    // Given: DashboardPage is rendered
    render(<DashboardPage />);

    // When: Sign out button is clicked
    const signOutButton = screen.getByLabelText(/sign out/i);
    fireEvent.click(signOutButton);

    // Then: logout function should be called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('Given: Dashboard is rendered, When: "Attributes" nav item is clicked, Then: AttributesContent is rendered', () => {
    // Given: DashboardPage is rendered with default contexts and attributes
    render(<DashboardPage />);

    // When: "Attributes" navigation item is clicked
    const attributesNavItem = screen.getByTestId('nav-attributes');
    fireEvent.click(attributesNavItem);

    // Then: AttributesContent should be rendered (check for unique text in AttributesContent)
    expect(screen.getByTestId('attribute-heading')).toBeInTheDocument();
    expect(screen.queryByTestId('context-heading')).not.toBeInTheDocument();
  });

  it('Given: Dashboard is rendered and AttributesContent is active, When: "Contexts" nav item is clicked, Then: ContextsContent is rendered', () => {
    // Given: DashboardPage is rendered and "Attributes" page is active
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-attributes'));

    // When: "Contexts" navigation item is clicked
    const contextsNavItem = screen.getByTestId('nav-contexts');
    fireEvent.click(contextsNavItem);

    // Then: ContextsContent should be rendered (check for unique text in ContextsContent)
    expect(screen.getByText(/your contexts/i)).toBeInTheDocument();
    expect(screen.queryByText(/your attributes/i)).not.toBeInTheDocument();
  });

  it('Given: Initial data fetch succeeds, When: useEffect runs, Then: fetchIdentityData is called with access token', async () => {
    // Given: authLoading is false, isAuthenticated is true, accessToken is present (default setup)
    // When: DashboardPage is rendered, triggering useEffect
    render(<DashboardPage />);

    // Then: fetchIdentityData should be called with the accessToken
    await waitFor(() => {
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
    });
  });

  it('Given: Store error previously, When: useEffect runs, Then: fetchIdentityData is called with access token to retry', async () => {
    // Given: Store has a previous error, and default auth state is good
    identityStore.useIdentityStore.mockReturnValue({
      contexts: [],
      attributes: [],
      fetchIdentityData: mockFetchIdentityData,
      isLoading: false,
      error: 'Previous error occurred',
      addContext: mockAddContext, updateContext: mockUpdateContext, deleteContext: mockDeleteContext,
      addAttribute: mockAddAttribute, updateAttribute: mockUpdateAttribute, deleteAttribute: mockDeleteAttribute,
    });

    // When: DashboardPage is rendered
    render(<DashboardPage />);

    // Then: fetchIdentityData should be called (as it retries on storeError)
    await waitFor(() => {
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
    });
  });

  it('Given: Contexts or attributes are empty, When: useEffect runs, Then: fetchIdentityData is called with access token', async () => {
    // Given: Contexts are empty (default setup has contexts empty, so it will trigger a fetch)
    render(<DashboardPage />);

    // When: useEffect runs
    // Then: fetchIdentityData should be called
    await waitFor(() => {
      expect(mockFetchIdentityData).toHaveBeenCalledWith('fake-token');
    });
  });

});