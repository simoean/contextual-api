import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import ContextSelectionPage from '../ContextSelectionPage';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import * as authService from 'shared/api/authService';
import * as useAuthParamsHook from 'shared/hooks/useAuthParams';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');
jest.mock('shared/hooks/useAuthParams');
jest.mock('shared/api/authService', () => ({
  fetchConsents: jest.fn(),
  recordConsent: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/auth/context' }),
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// Mock window functions
const mockWindowClose = jest.fn();
const mockPostMessage = jest.fn();
Object.defineProperty(window, 'close', { value: mockWindowClose });
Object.defineProperty(window, 'opener', { writable: true, value: { postMessage: mockPostMessage } });

// --- Test Data ---
const mockContexts = [
  { id: 'ctx-1', name: 'Personal' },
  { id: 'ctx-2', name: 'Work' },
];
const mockAttributes = [
  { id: 'attr-1', name: 'Email', value: 'test@example.com', contextIds: ['ctx-1'], visible: true },
  { id: 'attr-2', name: 'Phone', value: '123-456-7890', contextIds: ['ctx-1'], visible: false }, // Invisible
  { id: 'attr-3', name: 'Company', value: 'Big Corp', contextIds: ['ctx-2'], visible: true },
];

describe('ContextSelectionPage', () => {
  // --- Mocks Setup ---
  const mockSetSelectedContextId = jest.fn();
  const mockToggleSelectedAttributeId = jest.fn();
  const mockResetSelection = jest.fn();
  const mockSetSelectedAttributeIds = jest.fn();
  const mockFetchIdentityData = jest.fn();

  const defaultAuthStoreState = {
    userInfo: { username: 'TestUser', userId: 'user-123' },
    isAuthenticated: true,
    isLoading: false,
    accessToken: 'fake-token',
    selectedContextId: null,
    selectedAttributeIds: [],
    setSelectedContextId: mockSetSelectedContextId,
    toggleSelectedAttributeId: mockToggleSelectedAttributeId,
    resetSelection: mockResetSelection,
    setSelectedAttributeIds: mockSetSelectedAttributeIds,
  };

  const defaultIdentityStoreState = {
    contexts: mockContexts,
    attributes: mockAttributes,
    fetchIdentityData: mockFetchIdentityData,
    isLoading: false,
    error: null,
  };

  const renderComponent = (authOverrides = {}, identityOverrides = {}) => {
    authStore.useAuthenticationStore.mockReturnValue({ ...defaultAuthStoreState, ...authOverrides });
    identityStore.useIdentityStore.mockReturnValue({ ...defaultIdentityStoreState, ...identityOverrides });
    return render(
      <ChakraProvider>
        <MemoryRouter>
          <ContextSelectionPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthParamsHook.default.mockReturnValue({
      clientId: 'test-client',
      redirectUri: 'https://example.com/callback',
    });
    authService.fetchConsents.mockResolvedValue([]);
  });

  // --- Test Cases ---
  describe('Rendering and Initial State', () => {
    it('should render the welcome message and context buttons', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: /welcome, testuser/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
    });

    it('should show a loading spinner if auth or identity data is loading', () => {
      // Arrange & Act
      renderComponent({ isLoading: true });

      // Assert
      expect(screen.getByText(/loading contexts and attributes/i)).toBeInTheDocument();
    });

    it('should show an error message if there is a store error', () => {
      // Arrange & Act
      renderComponent({}, { error: 'Failed to fetch' });

      // Assert
      expect(screen.getByRole('heading', { name: /error loading data/i })).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call setSelectedContextId when a context button is clicked', () => {
      // Arrange
      renderComponent();
      const personalButton = screen.getByRole('button', { name: /personal/i });

      // Act
      fireEvent.click(personalButton);

      // Assert
      expect(mockSetSelectedContextId).toHaveBeenCalledWith('ctx-1');
    });

    it('should display visible attributes for the selected context', () => {
      // Arrange & Act
      renderComponent({ selectedContextId: 'ctx-1' });

      // Assert
      expect(screen.getByRole('heading', { name: /attributes for "personal" context/i })).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.queryByText('Phone:')).not.toBeInTheDocument(); // Invisible attribute
      expect(screen.queryByText('Company:')).not.toBeInTheDocument(); // Different context
    });

    it('should call toggleSelectedAttributeId when a checkbox is clicked', () => {
      // Arrange
      renderComponent({ selectedContextId: 'ctx-1' });
      const emailCheckbox = screen.getByTestId('share-checkbox-attr-1');

      // Act
      fireEvent.click(emailCheckbox);

      // Assert
      expect(mockToggleSelectedAttributeId).toHaveBeenCalledWith('attr-1');
    });

    it('should call resetSelection and close the window on cancel', () => {
      // Arrange
      renderComponent();
      const cancelButton = screen.getByTestId('cancel-button');

      // Act
      fireEvent.click(cancelButton);

      // Assert
      expect(mockResetSelection).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'CONTEXT_AUTH_CANCEL' }, window.location.origin);
      expect(mockWindowClose).toHaveBeenCalled();
    });
  });

  describe('Confirm Selection Logic', () => {
    it('should call recordConsent and post a success message on confirm', async () => {
      // Arrange
      renderComponent({ selectedContextId: 'ctx-1', selectedAttributeIds: ['attr-1'] });
      const confirmButton = screen.getByTestId('confirm-selection-button');

      // Act
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(authService.recordConsent).toHaveBeenCalledWith(
          'fake-token',
          'test-client',
          'ctx-1',
          ['attr-1'],
          'ONE_DAY' // Default validity
        );
        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'CONTEXT_AUTH_SUCCESS' }),
          'https://example.com/callback'
        );
        expect(mockWindowClose).toHaveBeenCalled();
      });
    });

    it('should show an error toast if clientId is missing on confirm', async () => {
      // Arrange
      useAuthParamsHook.default.mockReturnValue({ clientId: null, redirectUri: null });
      renderComponent({ selectedContextId: 'ctx-1' });
      const confirmButton = screen.getByTestId('confirm-selection-button');

      // Act
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', title: 'Error' }));
      });
    });
  });
});
