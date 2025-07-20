import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider, useToast } from '@chakra-ui/react';
import ContextSelectionPage from '../ContextSelectionPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import { useColorMode } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// --- Global Mocks (outside describe) ---
// Mocking the entire modules
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');

jest.mock('@chakra-ui/react', () => {
  const actualChakra = jest.requireActual('@chakra-ui/react');
  return {
    ...actualChakra,
    // Ensure useToast and useColorMode are mocked correctly for v2.x
    useToast: jest.fn(),
    useColorMode: jest.fn(),
    // If you're using specific Alert components, ensure they are also mocked or handled
    // For v2.x, Alert, AlertIcon, etc. are usually direct exports
    Alert: actualChakra.Alert,
    AlertIcon: actualChakra.AlertIcon,
    Checkbox: actualChakra.Checkbox, // Ensure Checkbox is also passed through if used in the component
    // If you have other components from @chakra-ui/react that are used in the page
    // and need to be real, pass them through here.
  };
});

// Mock logo import
jest.mock('assets/images/logo.png', () => 'logo.png');

// Mock react-router-dom's useNavigate and useLocation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/select', // Correctly mock pathname
    search: '?redirect_uri=https://example.com'
  }),
}));

// Live state for authentication store mock (managed globally within the test file)
let liveAuthStoreState = {
  userInfo: { username: 'JohnDoe', userId: 'u123' },
  isAuthenticated: true,
  isLoading: false,
  accessToken: 'token123',
  selectedContextId: null,
  selectedAttributeIds: [],
  // These will be assigned the actual global mock functions in beforeEach
  setSelectedContextId: jest.fn(),
  toggleSelectedAttributeId: jest.fn(),
  resetSelection: jest.fn(),
  setSelectedAttributeIds: jest.fn(),
};

describe('ContextSelectionPage', () => {
  // --- Given: Mock Functions and Data ---
  const mockPostMessage = jest.fn();
  const mockCloseWindow = jest.fn();
  const mockToggleColorMode = jest.fn();
  const mockToast = jest.fn();
  const mockToastInfo = jest.fn();

  // Authentication Store Mocks - These are the specific Jest mock instances
  const mockSetSelectedContextId = jest.fn();
  const mockToggleSelectedAttributeId = jest.fn();
  const mockResetSelection = jest.fn();
  const mockSetSelectedAttributeIds = jest.fn();
  const mockFetchIdentityData = jest.fn();

  // Sample Data (can remain constant)
  const sampleContexts = [{ id: 'ctx1', name: 'Work', description: 'Work related context' }];
  const sampleAttributes = [
    { id: 'attr1', name: 'Email', value: 'john@example.com', contextIds: ['ctx1'], visible: true },
    { id: 'attr2', name: 'Phone', value: '123-456-7890', contextIds: ['ctx1'], visible: true },
    { id: 'attr3', name: 'Invisible', value: 'hidden', contextIds: ['ctx1'], visible: false },
    { id: 'attr4', name: 'Other Context', value: 'data', contextIds: ['ctx2'], visible: true },
  ];

  const defaultIdentityStoreState = {
    contexts: sampleContexts,
    attributes: sampleAttributes,
    fetchIdentityData: mockFetchIdentityData,
    isLoading: false,
    error: null,
  };

  // Centralized render function
  const renderComponent = (authOverrides = {}, identityOverrides = {}, routerProps = {}) => {
    // Given: Auth and identity store states are prepared for the component
    liveAuthStoreState = { ...liveAuthStoreState, ...authOverrides }; // This updates the global variable

    // <--- START OF CRITICAL CHANGE ---
    authStore.useAuthenticationStore.mockImplementation(() => {
      // This function is called every time useAuthenticationStore is called by the component
      // It should return the *current* state of liveAuthStoreState,
      // and its setters should update liveAuthStoreState directly.
      return {
        ...liveAuthStoreState, // Spread the current live state
        setSelectedContextId: mockSetSelectedContextId.mockImplementation((id) => {
          act(() => { // Wrap state updates in act
            liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: id };
          });
        }),
        toggleSelectedAttributeId: mockToggleSelectedAttributeId.mockImplementation((id) => {
          act(() => { // Wrap state updates in act
            if (liveAuthStoreState.selectedAttributeIds.includes(id)) {
              liveAuthStoreState.selectedAttributeIds = liveAuthStoreState.selectedAttributeIds.filter(aId => aId !== id);
            } else {
              liveAuthStoreState.selectedAttributeIds = [...liveAuthStoreState.selectedAttributeIds, id];
            }
            liveAuthStoreState = { ...liveAuthStoreState, selectedAttributeIds: liveAuthStoreState.selectedAttributeIds };
          });
        }),
        resetSelection: mockResetSelection.mockImplementation(() => {
          act(() => { // Wrap state updates in act
            liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: null, selectedAttributeIds: [] };
          });
        }),
        setSelectedAttributeIds: mockSetSelectedAttributeIds.mockImplementation((ids) => {
          act(() => { // Wrap state updates in act
            liveAuthStoreState = { ...liveAuthStoreState, selectedAttributeIds: ids };
          });
        }),
      };
    });
    // <--- END OF CRITICAL CHANGE ---

    identityStore.useIdentityStore.mockReturnValue({
      ...defaultIdentityStoreState,
      ...identityOverrides,
    });
    useColorMode.mockReturnValue({
      colorMode: 'light',
      toggleColorMode: mockToggleColorMode,
    });
    useToast.mockReturnValue(mockToast);
    mockToast.mockImplementation((options) => {
      if (options.status === 'info') mockToastInfo(options);
    });

    // When: The ContextSelectionPage component is rendered
    return render(
      <ChakraProvider>
        <MemoryRouter initialEntries={['/select?redirect_uri=https://example.com']} {...routerProps}>
          <ContextSelectionPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    // Given: All mocks are reset to a clean state before each test
    jest.clearAllMocks();

    // Reset the 'live' authentication store state to its default for each test
    liveAuthStoreState = {
      userInfo: { username: 'JohnDoe', userId: 'u123' },
      isAuthenticated: true,
      isLoading: false,
      accessToken: 'token123',
      selectedContextId: null,
      selectedAttributeIds: [],
      setSelectedContextId: mockSetSelectedContextId,
      toggleSelectedAttributeId: mockToggleSelectedAttributeId,
      resetSelection: mockResetSelection,
      setSelectedAttributeIds: mockSetSelectedAttributeIds,
    };

    // Re-define window.opener and window.close for each test to ensure clean state
    Object.defineProperty(window, 'opener', {
      writable: true,
      value: { postMessage: mockPostMessage },
    });
    Object.defineProperty(window, 'close', {
      writable: true,
      value: mockCloseWindow,
    });
  });

  // Initial Rendering and Basic Interactions

  it('Given: ContextSelectionPage is rendered with contexts, When: Components are displayed, Then: Contexts and header elements are visible', () => {
    // Given: ContextSelectionPage is rendered with default contexts available
    renderComponent();

    // When: Components are displayed
    // Then: Contexts and header elements are visible
    expect(screen.getByText(/please select a context to proceed:/i)).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle color mode/i })).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-selection-button')).toBeInTheDocument();
  });

  it('Given: ContextSelectionPage is rendered, When: Color mode toggle button is clicked, Then: toggleColorMode is called', () => {
    // Given: ContextSelectionPage is rendered
    renderComponent();

    // When: The color mode toggle button is clicked
    fireEvent.click(screen.getByRole('button', { name: /toggle color mode/i }));

    // Then: toggleColorMode is called
    expect(mockToggleColorMode).toHaveBeenCalledTimes(1);
  });

  // Context and Attribute Selection

  it('Given: A context is selected and attributes are displayed, When: An attribute checkbox is toggled, Then: toggleSelectedAttributeId is called', async () => {
    // Given: A context ('ctx1') is pre-selected and 'attr1' is initially selected in the live mock state
    liveAuthStoreState.selectedContextId = 'ctx1';
    liveAuthStoreState.selectedAttributeIds = ['attr1'];
    renderComponent(); // Render with the predefined state

    // Ensure the Email attribute row is rendered before interacting
    await screen.findByText('Email:');

    // When: An attribute checkbox ('attr1') is toggled
    await act(async () => {
      const emailCheckbox = await screen.findByTestId('share-checkbox-attr1');
      fireEvent.click(emailCheckbox);
    });

    // Then: toggleSelectedAttributeId is called with 'attr1'
    expect(mockToggleSelectedAttributeId).toHaveBeenCalledWith('attr1');
  });

  it('Given: No contexts are found for the user, When: ContextSelectionPage renders, Then: Displays a "No contexts found" message', () => {
    // Given: The identity store provides an empty array for contexts
    renderComponent({}, { contexts: [] });

    // When: ContextSelectionPage renders
    // Then: It displays a "No contexts found" message
    expect(screen.getByText('Your Contexts:')).toBeInTheDocument();
    expect(screen.getByText(/no contexts found for your user/i)).toBeInTheDocument();
  });

  it('Given: A context is selected but has no visible attributes, When: ContextSelectionPage renders, Then: Displays "No visible attributes found" message', () => {
    // Given: A specific context ('ctx1') is pre-selected in the live mock state
    liveAuthStoreState.selectedContextId = 'ctx1';

    // Given: The identity store provides the selected context but no visible attributes for it
    renderComponent(
      {},
      {
        contexts: [{ id: 'ctx1', name: 'EmptyContext' }],
        attributes: [{ id: 'attr5', name: 'Hidden', value: 'val', contextIds: ['ctx1'], visible: false }],
      }
    );

    // When: ContextSelectionPage renders
    // Then: It displays an "Attributes for 'EmptyContext' Context" heading and "No visible attributes found" message
    expect(screen.getByText(/attributes for "emptycontext" context:/i)).toBeInTheDocument();
    expect(screen.getByText(/no visible attributes found for this context/i)).toBeInTheDocument();
    // And: The hidden attribute is not displayed
    expect(screen.queryByText('Hidden:')).not.toBeInTheDocument();
  });

  // Effect Hook Logic

  it('Given: Authenticated user with no contexts/attributes initially, When: Component mounts, Then: fetchIdentityData is called', async () => {
    // Given: An authenticated user and the identity store initially has no contexts or attributes
    renderComponent(
      { isAuthenticated: true, isLoading: false, accessToken: 'token123' },
      { contexts: [], attributes: [] }
    );

    // When: Component mounts
    // Then: fetchIdentityData is called with the access token
    await waitFor(() => {
      expect(mockFetchIdentityData).toHaveBeenCalledWith('token123');
    });
  });

  it('Given: Unauthenticated user and auth is not loading, When: Component mounts, Then: Navigates to auth page', async () => {
    // Given: An unauthenticated user and the auth store is not in a loading state
    liveAuthStoreState = { ...liveAuthStoreState, isAuthenticated: false, isLoading: false, accessToken: null };
    renderComponent();

    // When: Component mounts
    // Then: It navigates to the auth page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth', { state: { from: '/select' } });
    });
  });

  it('Given: A context is selected, When: filteredAttributes change (e.g., component re-renders or data updates), Then: setSelectedAttributeIds is called with all visible attributes from that context', async () => {
    // Given: A context ('ctx1') is selected and selectedAttributeIds is initially empty in the live mock state
    liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: 'ctx1', selectedAttributeIds: [] };
    renderComponent(); // Render with the predefined state

    // When: filteredAttributes change (triggered by selectedContextId update or initial render)
    // Then: setSelectedAttributeIds is called with all visible attributes for 'ctx1'
    await waitFor(() => {
      expect(mockSetSelectedAttributeIds).toHaveBeenCalledWith(['attr1', 'attr2']);
    });
  });

  it('Given: No context is selected, When: selectedAttributeIds is not empty, Then: setSelectedAttributeIds is called with an empty array', async () => {
    // Given: No context is selected (null) but selectedAttributeIds contains some values in the live mock state
    liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: null, selectedAttributeIds: ['attr1'] };
    renderComponent(); // Render with the predefined state

    // When: Component re-renders (triggered by selectedContextId being null)
    // Then: setSelectedAttributeIds is called with an empty array
    await waitFor(() => {
      expect(mockSetSelectedAttributeIds).toHaveBeenCalledWith([]);
    });
  });

  // Action Buttons and Communication

  it('Given: "Cancel" button is clicked, When: window.opener exists, Then: Sends CANCEL message and closes window', async () => {
    // Given: window.opener exists (default mock behavior)
    renderComponent();

    // When: The "Cancel" button is clicked
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    // Then: resetSelection is called, a CANCEL message is sent via postMessage, and the window closes
    expect(mockResetSelection).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'CONTEXT_AUTH_CANCEL' }, window.location.origin);
    expect(mockCloseWindow).toHaveBeenCalledTimes(1);
  });

  it('Given: "Confirm Selection" button is clicked and data is valid, When: window.opener exists, Then: Sends SUCCESS message and closes window', async () => {
    // Given: A context ('ctx1') is selected and 'attr1' is selected in the live mock state
    liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: 'ctx1', selectedAttributeIds: ['attr1'] };
    renderComponent(); // Render with the predefined state

    // When: The "Confirm Selection" button is clicked
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-selection-button'));
    });

    // Then: A SUCCESS message with the payload is sent via postMessage to the redirect_uri, and the window closes
    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        type: 'CONTEXT_AUTH_SUCCESS',
        payload: {
          token: 'token123',
          userId: 'u123',
          username: 'JohnDoe',
          selectedContext: { id: 'ctx1', name: 'Work', description: 'Work related context' },
          selectedAttributes: [
            { id: 'attr1', name: 'Email', value: 'john@example.com', contextIds: ['ctx1'], visible: true },
          ],
        },
      },
      'https://example.com' // This comes from the `redirect_uri` query param mock
    );
    expect(mockCloseWindow).toHaveBeenCalledTimes(1);
    // And: The selection is reset
    expect(mockResetSelection).toHaveBeenCalledTimes(1);
  });

  it('Given: "Confirm Selection" button is clicked, When: No window.opener, Then: Shows info toast and logs warning', async () => {
    // Given: window.opener is null
    Object.defineProperty(window, 'opener', { writable: true, value: null });
    // Given: Console spies are set up to capture warnings/logs
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    // Given: A context ('ctx1') and 'attr1' are selected in the live mock state
    liveAuthStoreState = { ...liveAuthStoreState, selectedContextId: 'ctx1', selectedAttributeIds: ['attr1'] };
    renderComponent(); // Render with the predefined state

    // When: The "Confirm Selection" button is clicked
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-selection-button'));
    });

    // Then: An info toast is shown, and warnings/logs are made to the console
    expect(mockToastInfo).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Authentication data prepared.',
      status: 'info',
    }));
    expect(consoleWarnSpy).toHaveBeenCalledWith('No opener window found. Cannot send authentication data.');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'AuthData payload:',
      expect.objectContaining({ userId: 'u123' })
    );
    // And: The window is not closed
    expect(mockCloseWindow).not.toHaveBeenCalled();
    // And: The selection is reset
    expect(mockResetSelection).toHaveBeenCalledTimes(1);

    // Clean up console spies
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
