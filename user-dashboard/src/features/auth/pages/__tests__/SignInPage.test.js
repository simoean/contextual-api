import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider, useToast, useColorMode, useColorModeValue } from '@chakra-ui/react'; // Ensure all used Chakra components are imported
import SignInPage from '../SignInPage';
import * as authStore from 'features/auth/store/authenticationStore';
import useAuthParams from 'shared/hooks/useAuthParams';
import '@testing-library/jest-dom';

// --- Global Mocks (outside describe) ---
// Mocking the entire modules
jest.mock('features/auth/store/authenticationStore');
jest.mock('shared/hooks/useAuthParams');

jest.mock('@chakra-ui/react', () => {
  const actualChakra = jest.requireActual('@chakra-ui/react');
  return {
    ...actualChakra,
    useToast: jest.fn(),
    useColorMode: jest.fn(),
    useColorModeValue: jest.fn(), // Mock useColorModeValue as well
    // Pass through other Chakra components used in SignInPage
    Button: actualChakra.Button,
    Input: actualChakra.Input,
    Stack: actualChakra.Stack,
    HStack: actualChakra.HStack,
    Heading: actualChakra.Heading,
    Text: actualChakra.Text,
    IconButton: actualChakra.IconButton,
    Container: actualChakra.Container,
    Box: actualChakra.Box,
    FormControl: actualChakra.FormControl, // Added FormControl
    FormLabel: actualChakra.FormLabel,     // Added FormLabel
  };
});

// Mock logo import
jest.mock('assets/images/logo.png', () => 'logo.png');

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Live state for authentication store mock
let liveAuthStoreState = {
  userInfo: null, // Initially null
  isAuthenticated: false, // <--- CRITICAL: Initially false for tests
  isLoading: false,
  accessToken: null, // Initially null
  // Mock implementations for store actions
  login: jest.fn(),
  register: jest.fn(),
};

describe('SignInPage', () => {
  // --- Given: Mock Functions ---
  const mockToast = jest.fn();
  const mockToggleColorMode = jest.fn();

  // Helper to render the component within a router and ChakraProvider
  const renderWithRouter = (ui, { route = '/' } = {}) => {
    return render(
      <ChakraProvider>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    // Given: All mocks are reset to a clean state before each test
    jest.clearAllMocks();

    // Reset liveAuthStoreState to default for each test
    liveAuthStoreState = {
      userInfo: null,
      isAuthenticated: false, // <--- CRITICAL: Reset to false
      isLoading: false,
      accessToken: null,
      login: jest.fn(),
      register: jest.fn(),
    };

    // Implement the mock for useAuthenticationStore
    authStore.useAuthenticationStore.mockImplementation(() => ({
      ...liveAuthStoreState,
      // CRITICAL: Mock login to update isAuthenticated state
      login: liveAuthStoreState.login.mockImplementation(async (...args) => {
        // Simulate async login
        await Promise.resolve(); // Simulate network delay
        act(() => { // Wrap state update in act
          liveAuthStoreState = {
            ...liveAuthStoreState,
            isAuthenticated: true,
            userInfo: { username: args[0], userId: 'test-user-id' },
            accessToken: 'mock-access-token',
          };
        });
      }),
      register: liveAuthStoreState.register.mockImplementation(async (...args) => {
        await Promise.resolve();
        act(() => {
          liveAuthStoreState = {
            ...liveAuthStoreState,
            isAuthenticated: true,
            userInfo: { username: args[0].username, userId: 'test-user-id' },
            accessToken: 'mock-access-token',
          };
        });
      }),
    }));

    // Mock Chakra UI hooks
    useToast.mockReturnValue(mockToast);
    useColorMode.mockReturnValue({ colorMode: 'light', toggleColorMode: mockToggleColorMode });
    useColorModeValue.mockImplementation((lightValue, darkValue) => lightValue); // Default to light mode values
    useAuthParams.mockReturnValue({
      clientId: 'mock-client',
      redirectUri: 'https://example.com/callback',
      isClientFlow: false, // Default to false for most tests
    });
  });

  // Initial Rendering and Basic Interactions

  it('Given: SignInPage is rendered, When: Components are displayed, Then: Login form elements are visible', () => {
    // Given: SignInPage is rendered
    renderWithRouter(<SignInPage />);

    // Then: Login form elements are visible
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle color mode/i })).toBeInTheDocument();
  });

  it('Given: SignInPage is rendered, When: Color mode toggle button is clicked, Then: toggleColorMode is called', () => {
    // Given: SignInPage is rendered
    renderWithRouter(<SignInPage />);

    // When: The color mode toggle button is clicked
    fireEvent.click(screen.getByRole('button', { name: /toggle color mode/i }));

    // Then: toggleColorMode is called
    expect(mockToggleColorMode).toHaveBeenCalledTimes(1);
  });

  // Login Scenarios

  it('Given: Login form is filled with valid credentials, When: Login is successful and isClientFlow is false, Then: Navigates to dashboard', async () => {
    // Given: useAuthParams returns isClientFlow as false (default)
    renderWithRouter(<SignInPage />);

    // When: The form is submitted with credentials
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'john' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Then: Login is called, a success toast is shown, and the user is navigated to the dashboard
    await waitFor(() => {
      expect(liveAuthStoreState.login).toHaveBeenCalledWith('john', 'password');
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', title: 'Login Successful!' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('Given: Login form is filled with valid credentials, When: Login is successful and isClientFlow is true, Then: Navigates to auth context page', async () => {
    // Given: useAuthParams returns isClientFlow as true and a redirectUri
    useAuthParams.mockReturnValue({
      clientId: 'mock-client',
      redirectUri: 'https://client-app.com/callback',
      isClientFlow: true,
    });
    renderWithRouter(<SignInPage />);

    // When: The form is submitted with credentials
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Then: Login is called, a success toast is shown, and the user is navigated to the specified redirectUri
    await waitFor(() => {
      expect(liveAuthStoreState.login).toHaveBeenCalledWith('alice', 'pass');
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', title: 'Login Successful!' }));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/context?client_id=mock-client&redirect_uri=https%3A%2F%2Fclient-app.com%2Fcallback');
  });

  it('Given: Login form is filled, When: Login fails, Then: Shows error toast and remains on page', async () => {
    // Given: The mock login function rejects with an error
    liveAuthStoreState.login.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    renderWithRouter(<SignInPage />);

    // When: The form is submitted with credentials
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'failuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Then: Login is called, an error toast is shown, and navigation does not occur
    await waitFor(() => {
      expect(liveAuthStoreState.login).toHaveBeenCalledWith('failuser', 'wrongpass');
    });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', title: 'Login Failed', description: 'Invalid credentials' }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument(); // Still on the same page
  });

  // Cancel and Sign Up Actions

  it('Given: isClientFlow is true, When: Cancel button is clicked and window.opener exists, Then: Closes popup window', () => {
    // Given: isClientFlow is true and window.opener exists
    useAuthParams.mockReturnValue({ isClientFlow: true });
    const mockWindowClose = jest.fn();
    Object.defineProperty(window, 'close', { writable: true, value: mockWindowClose });
    Object.defineProperty(window, 'opener', { writable: true, value: { closed: false } }); // Simulate opener exists

    renderWithRouter(<SignInPage />);

    // When: Cancel button is clicked
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Then: window.close is called
    expect(mockWindowClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled(); // No navigation if window closes
  });

  it('Given: isClientFlow is true, When: Cancel button is clicked and window.opener does NOT exist, Then: Navigates back', () => {
    // Given: isClientFlow is true and window.opener does NOT exist
    useAuthParams.mockReturnValue({ isClientFlow: true });
    Object.defineProperty(window, 'opener', { writable: true, value: null }); // Simulate no opener

    renderWithRouter(<SignInPage />);

    // When: Cancel button is clicked
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Then: Navigates back
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(window.close).not.toHaveBeenCalled(); // Window should not close
  });

  it('Given: isDashboardDirectAccess is true, When: Sign Up button is clicked, Then: Navigates to sign up page', () => {
    // Given: isDashboardDirectAccess is true (isClientFlow is false by default)
    renderWithRouter(<SignInPage />);

    // When: Sign Up button is clicked
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Then: Navigates to sign up page
    expect(mockNavigate).toHaveBeenCalledWith('/auth/signup');
  });

  // Initial Authentication Check (useEffect)

  it('Given: User is already authenticated and isClientFlow is false, When: Component mounts, Then: Navigates to dashboard', async () => {
    // Given: User is authenticated and isClientFlow is false
    liveAuthStoreState.isAuthenticated = true; // Set authenticated before render
    liveAuthStoreState.userInfo = { username: 'existing', userId: 'e123' };
    liveAuthStoreState.accessToken = 'existing-token';

    renderWithRouter(<SignInPage />);

    // Then: Navigates to dashboard immediately due to useEffect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    expect(liveAuthStoreState.login).not.toHaveBeenCalled(); // Login should not be called
  });

  it('Given: User is already authenticated and isClientFlow is true, When: Component mounts, Then: Navigates to auth context page', async () => {
    // Given: User is authenticated and isClientFlow is true
    liveAuthStoreState.isAuthenticated = true;
    liveAuthStoreState.userInfo = { username: 'existing', userId: 'e123' };
    liveAuthStoreState.accessToken = 'existing-token';
    useAuthParams.mockReturnValue({
      clientId: 'mock-client-2',
      redirectUri: 'https://client-app-2.com/callback',
      isClientFlow: true,
    });

    renderWithRouter(<SignInPage />);

    // Then: Navigates to auth context page immediately due to useEffect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/context?client_id=mock-client-2&redirect_uri=https%3A%2F%2Fclient-app-2.com%2Fcallback');
    });
    expect(liveAuthStoreState.login).not.toHaveBeenCalled(); // Login should not be called
  });
});
