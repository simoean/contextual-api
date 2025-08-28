import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import AttributesContent from '../AttributesContent';
import * as authStore from 'features/auth/store/authenticationStore';
import * as identityStore from 'features/dashboard/store/identityStore';
import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// Global Mocks
jest.mock('features/auth/store/authenticationStore');
jest.mock('features/dashboard/store/identityStore');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the toast hook from Chakra UI
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

// Test Data
const mockContexts = [
  { id: 'ctx-1', name: 'Personal' },
  { id: 'ctx-2', name: 'Work' },
  { id: 'ctx-3', name: 'Empty Context' }, // For testing empty states
];

const mockAttributes = [
  { id: 'attr-1', name: 'Email', value: 'test@example.com', contextIds: ['ctx-1'], visible: true },
  { id: 'attr-2', name: 'Phone', value: '123-456-7890', contextIds: ['ctx-1', 'ctx-2'], visible: true },
  { id: 'attr-3', name: 'Company ID', value: 'E-999', contextIds: ['ctx-2'], visible: false },
];

describe('AttributesContent', () => {
  // --- Props and Mocks Setup ---
  const mockAddAttribute = jest.fn();
  const mockUpdateAttribute = jest.fn();
  const mockDeleteAttribute = jest.fn();
  const mockFetchIdentityData = jest.fn();

  const defaultProps = {
    attributes: mockAttributes,
    addAttribute: mockAddAttribute,
    updateAttribute: mockUpdateAttribute,
    deleteAttribute: mockDeleteAttribute,
    fetchIdentityData: mockFetchIdentityData,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the stores with default values
    identityStore.useIdentityStore.mockReturnValue({
      contexts: mockContexts,
    });
    authStore.useAuthenticationStore.mockReturnValue({
      selectedContextId: null, // Default to no context selected
    });
  });

  // Helper function to render the component within ChakraProvider
  const renderComponent = (props = {}, authState = {}) => {
    authStore.useAuthenticationStore.mockReturnValue({
      selectedContextId: null,
      ...authState,
    });
    return render(
      <ChakraProvider>
        <AttributesContent {...defaultProps} {...props} />
      </ChakraProvider>
    );
  };

  // Test Cases
  describe('Rendering and Filtering', () => {
    it('should render all attributes when no context is selected', () => {
      // Arrange & Act
      renderComponent();

      // Assert
      expect(screen.getByRole('heading', { name: /your attributes/i })).toBeInTheDocument();
      expect(screen.getByText(/all your attributes/i)).toBeInTheDocument();
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Phone/i)).toBeInTheDocument();
      expect(screen.getByText(/Company ID/i)).toBeInTheDocument();
    });

    it('should render only filtered attributes when a context is selected', () => {
      // Arrange & Act
      renderComponent({}, { selectedContextId: 'ctx-1' });

      // Assert
      expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument();
      expect(screen.getByText(/attributes for your/i)).toBeInTheDocument();
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Phone/i)).toBeInTheDocument();
      expect(screen.queryByText(/Company ID/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions and Modals', () => {
    it('should open the "Add Attribute" modal when the add button is clicked', async () => {
      // Arrange
      renderComponent();

      // Act
      fireEvent.click(screen.getByRole('button', { name: /add attribute/i }));

      // Assert
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Add New Attribute')).toBeInTheDocument();
    });

    it('should open the "Edit Attribute" modal when an attribute card is clicked', async () => {
      // Arrange
      renderComponent();

      // Act
      const emailCard = screen.getByTestId('attribute-card-attr-1');
      fireEvent.click(emailCard);

      // Assert
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Edit Attribute')).toBeInTheDocument();
    });

    it('should open the delete confirmation dialog when the delete button is clicked', async () => {
      // Arrange
      renderComponent();
      const emailCard = screen.getByTestId('attribute-card-attr-1');

      // Act
      const deleteButton = within(emailCard).getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Assert
      const dialog = await screen.findByRole('alertdialog');
      expect(within(dialog).getByText('Delete Attribute')).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    it('should call addAttribute on successful form submission for a new attribute', async () => {
      // Arrange
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add attribute/i }));
      const dialog = await screen.findByRole('dialog');

      // Act
      fireEvent.change(within(dialog).getByLabelText(/name/i), { target: { value: 'Website' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /create attribute/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddAttribute).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      });
    });

    it('should call updateAttribute on successful form submission for an existing attribute', async () => {
      // Arrange
      renderComponent();
      fireEvent.click(screen.getByTestId('attribute-card-attr-1'));
      const dialog = await screen.findByRole('dialog');

      // Act
      fireEvent.change(within(dialog).getByLabelText(/value/i), { target: { value: 'new@example.com' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /update attribute/i }));

      // Assert
      await waitFor(() => {
        expect(mockUpdateAttribute).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      });
    });

    it('should call deleteAttribute on successful deletion confirmation', async () => {
      // Arrange
      renderComponent();
      const emailCard = screen.getByTestId('attribute-card-attr-1');
      fireEvent.click(within(emailCard).getByRole('button', { name: /delete/i }));
      const dialog = await screen.findByRole('alertdialog');

      // Act
      fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }));

      // Assert
      await waitFor(() => {
        expect(mockDeleteAttribute).toHaveBeenCalledWith('attr-1');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'info' }));
      });
    });
  });

  // Validation and Error Handling Tests
  describe('Validation and Error Handling', () => {
    it('should show a validation error and disable save when creating a duplicate attribute name', async () => {
      // Arrange
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add attribute/i }));
      const dialog = await screen.findByRole('dialog');
      const nameInput = within(dialog).getByLabelText(/name/i);
      const saveButton = within(dialog).getByRole('button', { name: /create attribute/i });

      // Act
      fireEvent.change(nameInput, { target: { value: 'Email' } }); // "Email" already exists

      // Assert
      expect(await within(dialog).findByText('This attribute name is already in use.')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should show a validation error when updating to a duplicate attribute name', async () => {
      // Arrange
      renderComponent();
      // Open the modal for the "Phone" attribute
      fireEvent.click(screen.getByTestId('attribute-card-attr-2'));
      const dialog = await screen.findByRole('dialog');
      const nameInput = within(dialog).getByLabelText(/name/i);
      const saveButton = within(dialog).getByRole('button', { name: /update attribute/i });

      // Act
      // Try to rename "Phone" to "Email", which is already used by another attribute
      fireEvent.change(nameInput, { target: { value: 'Email' } });

      // Assert
      expect(await within(dialog).findByText('This attribute name is already in use.')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should show an error toast if adding an attribute fails', async () => {
      // Arrange
      mockAddAttribute.mockRejectedValue(new Error('API Error'));
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add attribute/i }));
      const dialog = await screen.findByRole('dialog');

      // Act
      fireEvent.click(within(dialog).getByRole('button', { name: /create attribute/i }));

      // Assert
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', title: 'Operation failed.' }));
      });
    });
  });
});
