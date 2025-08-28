/**
 * @jest-environment jsdom
 */

import { useIdentityStore } from '../identityStore';
import axiosInstance from 'shared/api/axiosConfig';

jest.mock('shared/api/axiosConfig');

describe('identityStore', () => {
  const accessToken = 'mock-token';

  beforeEach(() => {
    // Reset store state and mocks before each test
    useIdentityStore.getState().reset();
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useIdentityStore.getState();
    expect(state.contexts).toEqual([]);
    expect(state.attributes).toEqual([]);
    expect(state.connections).toEqual([]);
    expect(state.message).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  describe('fetchIdentityData', () => {
    it('should fetch all identity data and update state on success', async () => {
      // Arrange
      const mockContexts = [{ id: 'ctx1', name: 'Context 1' }];
      const mockAttributes = [{ id: 'attr1', name: 'Attribute 1' }];
      const mockConnections = [{ id: 'conn1', provider: 'google' }];

      axiosInstance.get.mockImplementation((url) => {
        if (url === '/users/me/contexts') {
          return Promise.resolve({ data: mockContexts });
        }
        if (url === '/users/me/attributes') {
          return Promise.resolve({ data: mockAttributes });
        }
        if (url === '/users/me/connections') {
          return Promise.resolve({ data: mockConnections });
        }
        return Promise.reject(new Error(`Unhandled GET request to ${url}`));
      });

      // Act
      await useIdentityStore.getState().fetchIdentityData(accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.contexts).toEqual(mockContexts);
      expect(state.attributes).toEqual(mockAttributes);
      expect(state.connections).toEqual(mockConnections);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.message).toBe('Identity data loaded successfully!');
    });

    it('should set error if no accessToken is provided', async () => {
      // Arrange & Act
      await useIdentityStore.getState().fetchIdentityData(null);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot fetch identity data.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors during fetch', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      axiosInstance.get.mockRejectedValue(new Error(errorMessage));

      // Act
      await useIdentityStore.getState().fetchIdentityData(accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('addContext', () => {
    const newContext = { name: 'New Context' };
    const savedContext = { id: 'ctx2', name: 'New Context' };

    it('should add a new context and update state on success', async () => {
      // Arrange
      axiosInstance.post.mockResolvedValue({ data: savedContext });

      // Act
      const result = await useIdentityStore.getState().addContext(newContext, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.contexts).toContainEqual(savedContext);
      expect(state.message).toBe(`Context "${newContext.name}" added successfully!`);
      expect(result).toEqual(savedContext);
    });

    it('should throw error if no accessToken', async () => {
      // Arrange, Act & Assert
      await expect(useIdentityStore.getState().addContext(newContext, null))
        .rejects.toThrow('Authentication token missing. Cannot add context.');
    });

    it('should handle errors when adding context', async () => {
      // Arrange
      const errorMsg = 'Failed to add context';
      axiosInstance.post.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(useIdentityStore.getState().addContext(newContext, accessToken))
        .rejects.toThrow(errorMsg);
      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('updateContext', () => {
    const initialContext = { id: 'ctx1', name: 'Context 1' };
    const updatedContextData = { name: 'Updated Context' };
    const updatedContext = { id: 'ctx1', name: 'Updated Context' };

    beforeEach(() => {
      useIdentityStore.setState({ contexts: [initialContext] });
    });

    it('should update an existing context on success', async () => {
      // Arrange
      axiosInstance.put.mockResolvedValue({ data: updatedContext });

      // Act
      const result = await useIdentityStore.getState().updateContext(initialContext.id, updatedContextData, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.contexts).toContainEqual(updatedContext);
      expect(state.message).toBe(`Context "${updatedContextData.name}" updated successfully!`);
      expect(result).toEqual(updatedContext);
    });
  });

  describe('deleteContext', () => {
    const contextToDelete = { id: 'ctx1', name: 'Context 1' };

    beforeEach(() => {
      useIdentityStore.setState({ contexts: [contextToDelete] });
    });

    it('should delete a context successfully', async () => {
      // Arrange
      axiosInstance.delete.mockResolvedValue();

      // Act
      await useIdentityStore.getState().deleteContext(contextToDelete.id, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.contexts).not.toContainEqual(contextToDelete);
      expect(state.message).toBe('Context deleted successfully!');
    });
  });

  describe('addAttribute', () => {
    const newAttribute = { name: 'New Attribute' };
    const savedAttribute = { id: 'attr2', name: 'New Attribute' };

    it('should add a new attribute and update state on success', async () => {
      // Arrange
      axiosInstance.post.mockResolvedValue({ data: savedAttribute });

      // Act
      const result = await useIdentityStore.getState().addAttribute(newAttribute, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.attributes).toContainEqual(savedAttribute);
      expect(state.message).toBe(`Attribute "${newAttribute.name}" added successfully!`);
      expect(result).toEqual(savedAttribute);
    });
  });

  // --- NEW: Tests for updateAttribute and deleteAttribute ---
  describe('updateAttribute', () => {
    const initialAttribute = { id: 'attr1', name: 'Attribute 1' };
    const updatedAttributeData = { name: 'Updated Attribute' };
    const updatedAttribute = { id: 'attr1', name: 'Updated Attribute' };

    beforeEach(() => {
      useIdentityStore.setState({ attributes: [initialAttribute] });
    });

    it('should update an existing attribute on success', async () => {
      // Arrange
      axiosInstance.put.mockResolvedValue({ data: updatedAttribute });

      // Act
      const result = await useIdentityStore.getState().updateAttribute(initialAttribute.id, updatedAttributeData, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.attributes).toContainEqual(updatedAttribute);
      expect(state.message).toBe(`Attribute "${updatedAttributeData.name}" updated successfully!`);
      expect(result).toEqual(updatedAttribute);
    });

    it('should throw error if no accessToken', async () => {
      // Arrange, Act & Assert
      await expect(useIdentityStore.getState().updateAttribute(initialAttribute.id, updatedAttributeData, null))
        .rejects.toThrow('Authentication token missing. Cannot update attribute.');
    });

    it('should handle errors when updating attribute', async () => {
      // Arrange
      const errorMsg = 'Failed to update attribute';
      axiosInstance.put.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(useIdentityStore.getState().updateAttribute(initialAttribute.id, updatedAttributeData, accessToken))
        .rejects.toThrow(errorMsg);
      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
    });
  });

  describe('deleteAttribute', () => {
    const attributeToDelete = { id: 'attr1', name: 'Attribute 1' };

    beforeEach(() => {
      useIdentityStore.setState({ attributes: [attributeToDelete] });
    });

    it('should delete an attribute successfully', async () => {
      // Arrange
      axiosInstance.delete.mockResolvedValue();

      // Act
      await useIdentityStore.getState().deleteAttribute(attributeToDelete.id, accessToken);

      // Assert
      const state = useIdentityStore.getState();
      expect(state.attributes).not.toContainEqual(attributeToDelete);
      expect(state.message).toBe('Attribute deleted successfully!');
    });

    it('should throw error if no accessToken', async () => {
      // Arrange, Act & Assert
      await expect(useIdentityStore.getState().deleteAttribute(attributeToDelete.id, null))
        .rejects.toThrow('Authentication token missing. Cannot delete attribute.');
    });

    it('should handle errors when deleting attribute', async () => {
      // Arrange
      const errorMsg = 'Failed to delete attribute';
      axiosInstance.delete.mockRejectedValue(new Error(errorMsg));

      // Act & Assert
      await expect(useIdentityStore.getState().deleteAttribute(attributeToDelete.id, accessToken))
        .rejects.toThrow(errorMsg);
      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
    });
  });
});
