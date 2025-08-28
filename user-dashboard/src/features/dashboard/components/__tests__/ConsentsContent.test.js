import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ConsentsContent from '../ConsentsContent';
import * as authStore from 'features/auth/store/authenticationStore';
import { fetchConsents, revokeConsent, removeAttributeFromConsent, recordConsent } from 'shared/api/authService';
import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');

// Mock the authService module with a factory function to define its shape.
jest.mock('shared/api/authService', () => ({
  fetchConsents: jest.fn(),
  revokeConsent: jest.fn(),
  removeAttributeFromConsent: jest.fn(),
  recordConsent: jest.fn(),
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// --- Test Data ---
const mockContexts = [
  { id: 'ctx-1', name: 'Personal' },
  { id: 'ctx-2', name: 'Work' },
];

const mockAttributes = [
  { id: 'attr-1', name: 'Email', contextIds: ['ctx-1'] },
  { id: 'attr-2', name: 'Phone', contextIds: ['ctx-1', 'ctx-2'] },
  { id: 'attr-3', name: 'Address', contextIds: ['ctx-1'] }, // Unshared attribute for Personal context
];

const mockConsents = [
  {
    id: 'consent-1',
    clientId: 'WebApp-A',
    contextId: 'ctx-1',
    sharedAttributes: ['attr-1', 'attr-2'],
    createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
    accessedAt: [new Date('2023-01-15T12:30:00Z').toISOString()],
    tokenValidity: 'ONE_DAY',
  },
];

describe('ConsentsContent', () => {
  const mockFetchIdentityData = jest.fn();

  const defaultProps = {
    fetchIdentityData: mockFetchIdentityData,
    attributes: mockAttributes,
    contexts: mockContexts,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the auth store
    authStore.useAuthenticationStore.mockReturnValue({
      accessToken: 'fake-token',
    });

    // Set default mock behaviors
    fetchConsents.mockResolvedValue(mockConsents);
    revokeConsent.mockResolvedValue();
    removeAttributeFromConsent.mockResolvedValue();
    recordConsent.mockResolvedValue();
  });

  // Helper to render the component
  const renderComponent = (props = {}) => {
    return render(
      <ChakraProvider>
        <ConsentsContent {...defaultProps} {...props} />
      </ChakraProvider>
    );
  };

  // --- Test Cases ---
  describe('Rendering and Data Fetching', () => {
    it('should show a loading spinner initially and then render consents', async () => {
      // Arrange & Act
      renderComponent();

      // Assert: Initial loading state
      expect(screen.getByText(/loading your consents/i)).toBeInTheDocument();

      // Assert: After data fetching, consents are rendered
      expect(await screen.findByText('WebApp-A')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument(); // Context Tag
      expect(screen.getByText('Email')).toBeInTheDocument(); // Shared Attribute
      expect(screen.queryByText(/loading your consents/i)).not.toBeInTheDocument();
    });

    it('should display a message when no consents are found', async () => {
      // Arrange
      fetchConsents.mockResolvedValue([]);

      // Act
      renderComponent();

      // Assert
      expect(await screen.findByText(/no consents found/i)).toBeInTheDocument();
    });

    it('should display an error toast if fetching consents fails', async () => {
      // Arrange
      const errorMessage = 'API Error';
      fetchConsents.mockRejectedValue(new Error(errorMessage));

      // Act
      renderComponent();

      // Assert
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error fetching consents.',
            status: 'error',
          })
        );
      });
    });
  });

  describe('User Interactions and Modals', () => {
    it('should open the "Revoke Consent" dialog when the revoke button is clicked', async () => {
      // Arrange
      renderComponent();
      const revokeButton = await screen.findByTestId('revoke-all-button-consent-1');

      // Act
      fireEvent.click(revokeButton);

      // Assert
      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Revoke Consent')).toBeInTheDocument();
    });

    it('should open the "Remove Attribute" dialog when the remove attribute button is clicked', async () => {
      // Arrange
      renderComponent();
      const removeButton = await screen.findByTestId('remove-attribute-button-attr-1');

      // Act
      fireEvent.click(removeButton);

      // Assert
      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Remove Attribute')).toBeInTheDocument();
    });

    it('should open the "Edit Consent" dialog when the edit button is clicked', async () => {
      // Arrange
      renderComponent();
      const editButton = await screen.findByTestId('edit-validity-button-consent-1');

      // Act
      fireEvent.click(editButton);

      // Assert
      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText(/edit consent for "webapp-a"/i)).toBeInTheDocument();
    });
  });

  // --- NEW: Modal Actions Tests ---
  describe('Modal Actions', () => {
    it('should call revokeConsent and refetch data on successful revocation', async () => {
      // Arrange
      renderComponent();
      const revokeButton = await screen.findByTestId('revoke-all-button-consent-1');
      fireEvent.click(revokeButton);
      const dialog = await screen.findByRole('alertdialog');
      const confirmButton = within(dialog).getByRole('button', { name: /revoke all/i });

      // Act
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(revokeConsent).toHaveBeenCalledWith('fake-token', 'consent-1');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
        expect(fetchConsents).toHaveBeenCalledTimes(2); // Initial fetch + refetch
        expect(mockFetchIdentityData).toHaveBeenCalled();
      });
    });

    it('should call removeAttributeFromConsent and refetch data on successful removal', async () => {
      // Arrange
      renderComponent();
      const removeButton = await screen.findByTestId('remove-attribute-button-attr-1');
      fireEvent.click(removeButton);
      const dialog = await screen.findByRole('alertdialog');
      const confirmButton = within(dialog).getByRole('button', { name: /remove/i });

      // Act
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(removeAttributeFromConsent).toHaveBeenCalledWith('fake-token', 'consent-1', 'attr-1');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
        expect(fetchConsents).toHaveBeenCalledTimes(2);
      });
    });

    it('should call recordConsent with updated validity and new attributes on save', async () => {
      // Arrange
      renderComponent();
      const editButton = await screen.findByTestId('edit-validity-button-consent-1');
      fireEvent.click(editButton);
      const dialog = await screen.findByRole('alertdialog');
      const validitySelect = within(dialog).getByRole('combobox');
      const newAttributeCheckbox = within(dialog).getByLabelText('Address'); // attr-3 is unshared
      const saveButton = within(dialog).getByRole('button', { name: /save/i });

      // Act
      fireEvent.change(validitySelect, { target: { value: 'ONE_YEAR' } });
      fireEvent.click(newAttributeCheckbox);
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(recordConsent).toHaveBeenCalledWith(
          'fake-token',
          'WebApp-A',
          'ctx-1',
          ['attr-1', 'attr-2', 'attr-3'], // Existing + new
          'ONE_YEAR'
        );
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
        expect(fetchConsents).toHaveBeenCalledTimes(2);
      });
    });

    it('should show an error toast if revoking consent fails', async () => {
      // Arrange
      revokeConsent.mockRejectedValue(new Error('Revocation failed'));
      renderComponent();
      const revokeButton = await screen.findByTestId('revoke-all-button-consent-1');
      fireEvent.click(revokeButton);
      const dialog = await screen.findByRole('alertdialog');
      const confirmButton = within(dialog).getByRole('button', { name: /revoke all/i });

      // Act
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', title: 'Revocation failed.' }));
      });
    });
  });
});
