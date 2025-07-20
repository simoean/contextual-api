import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ContextsContent from '../ContextsContent';
import { useAuthenticationStore } from 'features/auth/store/authenticationStore';
import { useToast } from '@chakra-ui/react';
import '@testing-library/jest-dom';

// Global Mocks
jest.mock('features/auth/store/authenticationStore');
jest.mock('@chakra-ui/react', () => {
  const actualChakra = jest.requireActual('@chakra-ui/react');
  return {
    ...actualChakra,
    useToast: jest.fn(),
  };
});

describe('ContextsContent', () => {
  // Given: Mock Functions and Data (Set up once for the suite)
  const mockAddContext = jest.fn();
  const mockUpdateContext = jest.fn();
  const mockDeleteContext = jest.fn();
  const mockFetchIdentityData = jest.fn();
  const mockSetUserInfo = jest.fn();

  const mockToast = jest.fn();
  const mockToastSuccess = jest.fn();
  const mockToastError = jest.fn();
  const mockToastInfo = jest.fn();

  let mockSelectedContextId = null;
  const mockSetSelectedContextId = jest.fn();

  const sampleContexts = [
    { id: 'c1', name: 'Work', description: 'Professional context' },
    { id: 'c2', name: 'Personal', description: 'Personal life context' },
    { id: 'c3', name: 'Shopping', description: 'Online shopping activities' },
  ];

  const sampleAttributes = [
    { id: 'a1', name: 'Location', contextIds: ['c1'] },
    { id: 'a2', name: 'Device', contextIds: ['c1', 'c2'] },
    { id: 'a3', name: 'Payment Method', contextIds: ['c3'] },
    { id: 'a4', name: 'Mood', contextIds: ['c2'] },
  ];

  const defaultProps = {
    contexts: sampleContexts,
    attributes: sampleAttributes,
    addContext: mockAddContext,
    updateContext: mockUpdateContext,
    deleteContext: mockDeleteContext,
    fetchIdentityData: mockFetchIdentityData,
    userInfo: { selectedContext: null },
    setUserInfo: mockSetUserInfo,
  };

  beforeEach(() => {
    // Given: Reset mocks and initial state for each test
    jest.clearAllMocks();

    mockAddContext.mockReset();
    mockUpdateContext.mockReset();
    mockDeleteContext.mockReset();
    mockFetchIdentityData.mockReset();
    mockSetUserInfo.mockReset();
    mockToast.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockToastInfo.mockReset();
    mockSetSelectedContextId.mockReset();

    mockSelectedContextId = null;
    mockSetSelectedContextId.mockImplementation((id) => {
      mockSelectedContextId = id;
    });

    useAuthenticationStore.mockReturnValue({
      selectedContextId: mockSelectedContextId,
      setSelectedContextId: mockSetSelectedContextId,
    });

    useToast.mockReturnValue((options) => {
      mockToast(options);
      if (options.status === 'success') mockToastSuccess(options);
      if (options.status === 'error') mockToastError(options);
      if (options.status === 'info') mockToastInfo(options);
    });
  });

 // Rendering Tests

  it('Given: ContextsContent component, When: It renders with contexts, Then: Displays contexts and relevant UI elements', () => {
    // Given: Default contexts and props are set up in beforeEach
    // When: ContextsContent component is rendered
    render(<ContextsContent {...defaultProps} />);

    // Then: Core UI elements and context names should be in the document
    expect(screen.getByText(/your contexts/i)).toBeInTheDocument();
    expect(screen.getByText(/add context/i)).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('Given: ContextsContent component, When: It renders with an empty contexts array, Then: Displays "No contexts found" message', () => {
    // Given: ContextsContent will receive an empty contexts array
    const emptyContextsProps = { ...defaultProps, contexts: [] };

    // When: ContextsContent component is rendered with empty contexts
    render(<ContextsContent {...emptyContextsProps} />);

    // Then: "No contexts found" message should be displayed
    expect(screen.getByText(/no contexts found/i)).toBeInTheDocument();
  });

  it('Given: ContextsContent renders with contexts and attributes, When: Component displays attributes, Then: Only associated attributes are shown per context card', () => {
    // Given: Default contexts and attributes are set up in beforeEach
    render(<ContextsContent {...defaultProps} />);

    // When: Checking attributes for 'Work' context (c1)
    const workContextCard = screen.getByTestId('context-card-c1');

    // Then: 'Work' card should be in the document, contain 'Location', and not contain 'Title'
    expect(workContextCard).toBeInTheDocument();
    expect(within(workContextCard).getByText('Location')).toBeInTheDocument();
    expect(within(workContextCard).queryByText('Title')).not.toBeInTheDocument();

    // Given: ContextsContent renders with a context that has no attributes
    const noAttrContexts = [{ id: 'c4', name: 'Empty', description: 'No attributes' }];
    render(<ContextsContent {...defaultProps} contexts={noAttrContexts} attributes={[]} />);

    // When: Checking the 'Empty' context card
    // Then: 'Empty' context card should be in the document and display "No attributes associated."
    expect(screen.getByText('Empty')).toBeInTheDocument();
    const emptyContextCard = screen.getByTestId('context-card-c4');
    expect(within(emptyContextCard).getByText('No attributes associated.')).toBeInTheDocument();
  });

  // Add Context Modal Tests

  it('Given: ContextsContent component, When: "Add Context" button is clicked, Then: "Add New Context" modal opens with empty fields', async () => {
    // Given: ContextsContent is rendered
    render(<ContextsContent {...defaultProps} />);

    // When: "Add Context" button is clicked
    fireEvent.click(screen.getByRole('button', { name: /add context/i }));

    // Then: "Add New Context" modal should be in the document with empty name and description fields
    expect(screen.getByRole('dialog', { name: /add new context/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('Given: "Add New Context" modal is open and form is filled, When: "Create Context" is clicked successfully, Then: addContext is called, success toast shown, and modal closes', async () => {
    // Given: mockAddContext will resolve successfully
    mockAddContext.mockResolvedValueOnce({});
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-context-button'));

    // When: Form fields are changed and "Create Context" button is clicked
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Context' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Description of new context' } });
    fireEvent.click(screen.getByTestId('edit-create-context'));

    // Then: mockAddContext should be called with correct data
    await waitFor(() => {
      expect(mockAddContext).toHaveBeenCalledWith({
        name: 'New Context',
        description: 'Description of new context',
      });
    });
    // Verify: Success toast is shown, identity data is refetched, and modal closes
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Context added.',
      status: 'success',
    }));
    expect(mockFetchIdentityData).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('edit-create-modal')).not.toBeInTheDocument();
  });

  it('Given: "Add New Context" modal is open, When: addContext API call fails, Then: Error toast is shown and identity data is NOT refetched', async () => {
    // Given: mockAddContext will reject with an error
    const errorMessage = 'Failed to add context';
    mockAddContext.mockRejectedValueOnce(new Error(errorMessage));
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-context-button'));

    // When: Form is submitted and API call fails
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Failing Context' } });
    fireEvent.click(screen.getByTestId('edit-create-context'));

    // Then: mockAddContext should be called
    await waitFor(() => {
      expect(mockAddContext).toHaveBeenCalled();
    });
    // Verify: Error toast is shown, and identity data is NOT refetched
    expect(mockToastError).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Operation failed.',
      description: errorMessage,
      status: 'error',
    }));
    expect(mockFetchIdentityData).not.toHaveBeenCalled();
  });

  // Edit Context Modal Tests

  it('Given: ContextsContent component, When: "Edit" button of a context card is clicked, Then: "Edit Context" modal opens with pre-filled data', async () => {
    // Given: ContextsContent is rendered
    render(<ContextsContent {...defaultProps} />);

    // When: "Edit" button for 'Work' context (c1) is clicked
    fireEvent.click(screen.getByTestId('edit-context-button-c1'));

    // Then: "Edit Context" modal should be in the document with 'Work' context data pre-filled
    expect(screen.getByRole('dialog', { name: /edit context/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('Work');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Professional context');
  });

  it('Given: "Edit Context" modal is open and form is modified, When: "Update Context" is clicked successfully, Then: updateContext is called, success toast shown, and modal closes', async () => {
    // Given: mockUpdateContext will resolve successfully
    mockUpdateContext.mockResolvedValueOnce({});
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('edit-context-button-c1'));

    // When: Name field is changed and "Update Context" button is clicked
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Updated Work' } });
    fireEvent.click(screen.getByTestId('edit-create-context'));

    // Then: mockUpdateContext should be called with updated data
    await waitFor(() => {
      expect(mockUpdateContext).toHaveBeenCalledWith(
        'c1',
        { name: 'Updated Work', description: 'Professional context' }
      );
    });
    // Verify: Success toast is shown, identity data is refetched, and modal closes
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Context updated.',
      status: 'success',
    }));
    expect(mockFetchIdentityData).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('edit-create-modal')).not.toBeInTheDocument();
  });

  it('Given: "Edit Context" modal is open, When: updateContext API call fails, Then: Error toast is shown', async () => {
    // Given: mockUpdateContext will reject with an error
    const errorMessage = 'Failed to update context';
    mockUpdateContext.mockRejectedValueOnce(new Error(errorMessage));
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('edit-context-button-c1'));

    // When: Form is submitted and API call fails
    fireEvent.click(screen.getByTestId('edit-create-context'));

    // Then: mockUpdateContext should be called
    await waitFor(() => {
      expect(mockUpdateContext).toHaveBeenCalled();
    });
    // Verify: Error toast is shown
    expect(mockToastError).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Operation failed.',
      description: errorMessage,
      status: 'error',
    }));
  });

  // Delete Context AlertDialog Tests

  it('Given: ContextsContent component, When: "Delete" button of a context card is clicked, Then: Delete confirmation dialog opens', async () => {
    // Given: ContextsContent is rendered
    render(<ContextsContent {...defaultProps} />);

    // When: "Delete" button for 'Work' context (c1) is clicked
    fireEvent.click(screen.getByTestId('delete-context-button-c1'));

    // Then: Delete confirmation AlertDialog should be in the document with correct text
    expect(screen.getByRole('alertdialog', { name: /delete context/i })).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete context/i)).toBeInTheDocument();
    expect(screen.getByText('Work', { selector: 'strong' })).toBeInTheDocument();
  });

  it('Given: Delete confirmation dialog is open, When: "Delete" is clicked successfully, Then: deleteContext is called, info toast shown, and dialog closes', async () => {
    // Given: mockDeleteContext will resolve successfully
    mockDeleteContext.mockResolvedValueOnce({});
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-context-button-c2'));

    // When: "Confirm Delete" button is clicked
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Then: mockDeleteContext should be called with the correct context ID
    await waitFor(() => {
      expect(mockDeleteContext).toHaveBeenCalledWith('c2');
    });
    // Verify: Info toast is shown and identity data is refetched
    expect(mockToastInfo).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Context deleted.',
      status: 'info',
    }));
    expect(mockFetchIdentityData).toHaveBeenCalledTimes(1);
  });

  it('Given: Delete confirmation dialog is open, When: "Cancel" button is clicked, Then: Dialog closes and deleteContext is NOT called', async () => {
    // Given: ContextsContent is rendered
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-context-button-c2'));

    // When: "Cancel" button is clicked
    expect(screen.getByRole('alertdialog', { name: /delete context/i })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('cancel-delete'));

    // Then: Dialog should be removed from the document, and deleteContext should not have been called
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog', { name: /delete context/i })).not.toBeInTheDocument();
    });
    expect(mockDeleteContext).not.toHaveBeenCalled();
    expect(mockFetchIdentityData).not.toHaveBeenCalled();
  });

  it('Given: Delete confirmation dialog is open, When: deleteContext API call fails, Then: Error toast is shown and identity data is NOT refetched', async () => {
    // Given: mockDeleteContext will reject with an error
    const errorMessage = 'Failed to delete context';
    mockDeleteContext.mockRejectedValueOnce(new Error(errorMessage));
    render(<ContextsContent {...defaultProps} />);
    fireEvent.click(screen.getByTestId('delete-context-button-c2'));

    // When: "Confirm Delete" button is clicked and API call fails
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Then: mockDeleteContext should be called
    await waitFor(() => {
      expect(mockDeleteContext).toHaveBeenCalled();
    });
    // Verify: Error toast is shown, and identity data is NOT refetched
    expect(mockToastError).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Deletion failed.',
      description: errorMessage,
      status: 'error',
    }));
    expect(mockFetchIdentityData).not.toHaveBeenCalled();
  });

  it('Given: A context is currently selected and is then deleted, When: deleteContext succeeds, Then: selectedContextId in auth store is cleared', async () => {
    // Given: 'Work' context (c1) is initially selected in the auth store
    useAuthenticationStore.mockReturnValue({
      selectedContextId: 'c1',
      setSelectedContextId: mockSetSelectedContextId,
    });
    mockDeleteContext.mockResolvedValueOnce({}); // Ensure delete succeeds

    const propsWithSelectedContext = {
      ...defaultProps,
      userInfo: { selectedContext: { id: 'c1', name: 'Work' } },
    };
    render(<ContextsContent {...propsWithSelectedContext} />);

    // When: "Delete" button for the selected 'Work' context is clicked and confirmed
    fireEvent.click(screen.getByTestId('delete-context-button-c1'));
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Then: mockDeleteContext should be called
    await waitFor(() => {
      expect(mockDeleteContext).toHaveBeenCalledWith('c1');
    });
    // Verify: setUserInfo is called with an update function that sets selectedContext to null
    expect(mockSetUserInfo).toHaveBeenCalledWith(expect.any(Function));
    const setUserInfoUpdateFn = mockSetUserInfo.mock.calls[0][0];
    const prevState = { ...propsWithSelectedContext.userInfo, selectedContext: { id: 'c1', name: 'Work' } };
    expect(setUserInfoUpdateFn(prevState)).toEqual({ ...prevState, selectedContext: null });
  });

  it('Given: A context is selected, When: A *different* context is deleted, Then: selectedContextId in auth store is NOT cleared', async () => {
    // Given: 'Work' context (c1) is initially selected, and mockDeleteContext succeeds
    useAuthenticationStore.mockReturnValue({
      selectedContextId: 'c1',
      setSelectedContextId: mockSetSelectedContextId,
    });
    mockDeleteContext.mockResolvedValueOnce({});

    const propsWithSelectedContext = {
      ...defaultProps,
      userInfo: { selectedContext: { id: 'c1', name: 'Work' } },
    };
    render(<ContextsContent {...propsWithSelectedContext} />);

    // When: "Delete" button for 'Personal' context (c2, which is not selected) is clicked and confirmed
    fireEvent.click(screen.getByTestId('delete-context-button-c2'));
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Then: mockDeleteContext should be called for 'c2'
    await waitFor(() => {
      expect(mockDeleteContext).toHaveBeenCalledWith('c2');
    });
    // Verify: setUserInfo should NOT have been called to clear selectedContext
    expect(mockSetUserInfo).not.toHaveBeenCalledWith(expect.objectContaining({ selectedContext: null }));
  });

  // Context Selection Tests

  it('Given: ContextsContent component, When: A context card is clicked, Then: The context is selected via auth store and styling is applied', () => {
    // Given: ContextsContent is rendered
    render(<ContextsContent {...defaultProps} />);

    // When: 'Work' context card (c1) is clicked
    const workContextCard = screen.getByTestId('context-card-c1');
    fireEvent.click(workContextCard);

    // Then: setSelectedContextId should be called with 'c1' and the card should have selected styling
    expect(mockSetSelectedContextId).toHaveBeenCalledWith('c1');
    expect(workContextCard).toHaveStyle('border-color: var(--chakra-colors-brand-500)');
  });

  it('Given: An already selected context, When: The same context is clicked again, Then: The context is deselected via auth store', () => {
    // Given: 'Work' context (c1) is initially selected in the auth store
    useAuthenticationStore.mockReturnValue({
      selectedContextId: 'c1',
      setSelectedContextId: mockSetSelectedContextId,
    });
    render(<ContextsContent {...defaultProps} />);

    // When: The already selected 'Work' context card is clicked again
    const workContextCard = screen.getByTestId('context-card-c1');
    fireEvent.click(workContextCard);

    // Then: setSelectedContextId should be called with null to deselect
    expect(mockSetSelectedContextId).toHaveBeenCalledWith(null);
  });

  it('Given: A context is set as selected in the auth store, When: ContextsContent renders, Then: The selected context card displays correct styling', () => {
    // Given: 'Personal' context (c2) is initially selected in the auth store
    useAuthenticationStore.mockReturnValue({
      selectedContextId: 'c2',
      setSelectedContextId: mockSetSelectedContextId,
    });

    // When: ContextsContent component is rendered
    render(<ContextsContent {...defaultProps} />);

    // Then: The 'Personal' context card should have specific styling for selected state
    const personalContextCard = screen.getByTestId('context-card-c2');
    expect(personalContextCard).toHaveStyle('border-width: 2px');
    expect(personalContextCard).toHaveStyle('box-shadow: lg');
  });

  // Helper for within calls
  function within(element) {
    return {
      getByText: (text, options) => screen.getByText(text, { container: element, ...options }),
      queryByText: (text, options) => screen.queryByText(text, { container: element, ...options }),
      getByRole: (role, options) => screen.getByRole(role, { container: element, ...options }),
    };
  }
});