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
    expect(state.message).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  describe('fetchIdentityData', () => {
    it('should fetch contexts and attributes and update state on success', async () => {
      const mockContexts = [{ id: 'ctx1', name: 'Context 1' }];
      const mockAttributes = [{ id: 'attr1', name: 'Attribute 1' }];

      axiosInstance.get.mockImplementation((url) => {
        if (url === '/users/me/contexts') {
          return Promise.resolve({ data: mockContexts });
        }
        if (url === '/users/me/attributes') {
          return Promise.resolve({ data: mockAttributes });
        }
      });

      await useIdentityStore.getState().fetchIdentityData(accessToken);

      const state = useIdentityStore.getState();
      expect(state.contexts).toEqual(mockContexts);
      expect(state.attributes).toEqual(mockAttributes);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.message).toBe('Identity data loaded successfully!');
    });

    it('should set error if no accessToken is provided', async () => {
      await useIdentityStore.getState().fetchIdentityData(null);

      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot fetch identity data.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors during fetch', async () => {
      const errorMessage = 'Network Error';
      axiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await useIdentityStore.getState().fetchIdentityData(accessToken);

      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('addContext', () => {
    const newContext = { name: 'New Context' };
    const savedContext = { id: 'ctx2', name: 'New Context' };

    it('should add a new context and update state on success', async () => {
      axiosInstance.post.mockResolvedValue({ data: savedContext });

      const result = await useIdentityStore.getState().addContext(newContext, accessToken);

      const state = useIdentityStore.getState();
      expect(state.contexts).toContainEqual(savedContext);
      expect(state.message).toBe(`Context "${newContext.name}" added successfully!`);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(result).toEqual(savedContext);
    });

    it('should throw error if no accessToken', async () => {
      await expect(useIdentityStore.getState().addContext(newContext, null))
        .rejects.toThrow('Authentication token missing. Cannot add context.');

      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot add context.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors when adding context', async () => {
      const errorMsg = 'Failed to add context';
      axiosInstance.post.mockRejectedValue(new Error(errorMsg));

      await expect(useIdentityStore.getState().addContext(newContext, accessToken))
        .rejects.toThrow();

      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
      expect(state.isLoading).toBe(false);
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
      axiosInstance.put.mockResolvedValue({ data: updatedContext });

      const result = await useIdentityStore.getState().updateContext(initialContext.id, updatedContextData, accessToken);

      const state = useIdentityStore.getState();
      expect(state.contexts).toContainEqual(updatedContext);
      expect(state.message).toBe(`Context "${updatedContextData.name}" updated successfully!`);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(result).toEqual(updatedContext);
    });

    it('should throw error if no accessToken', async () => {
      await expect(useIdentityStore.getState().updateContext(initialContext.id, updatedContextData, null))
        .rejects.toThrow('Authentication token missing. Cannot update context.');

      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot update context.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors when updating context', async () => {
      const errorMsg = 'Failed to update context';
      axiosInstance.put.mockRejectedValue(new Error(errorMsg));

      await expect(useIdentityStore.getState().updateContext(initialContext.id, updatedContextData, accessToken))
        .rejects.toThrow();

      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('deleteContext', () => {
    const contextToDelete = { id: 'ctx1', name: 'Context 1' };

    beforeEach(() => {
      useIdentityStore.setState({ contexts: [contextToDelete] });
    });

    it('should delete a context successfully', async () => {
      axiosInstance.delete.mockResolvedValue();

      await useIdentityStore.getState().deleteContext(contextToDelete.id, accessToken);

      const state = useIdentityStore.getState();
      expect(state.contexts).not.toContainEqual(contextToDelete);
      expect(state.message).toBe('Context deleted successfully!');
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should throw error if no accessToken', async () => {
      await expect(useIdentityStore.getState().deleteContext(contextToDelete.id, null))
        .rejects.toThrow('Authentication token missing. Cannot delete context.');

      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot delete context.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors when deleting context', async () => {
      const errorMsg = 'Failed to delete context';
      axiosInstance.delete.mockRejectedValue(new Error(errorMsg));

      await expect(useIdentityStore.getState().deleteContext(contextToDelete.id, accessToken))
        .rejects.toThrow();

      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
      expect(state.isLoading).toBe(false);
    });
  });

  // AddAttribute tests
  describe('addAttribute', () => {
    const newAttribute = { name: 'New Attribute' };
    const savedAttribute = { id: 'attr2', name: 'New Attribute' };

    it('should add a new attribute and update state on success', async () => {
      axiosInstance.post.mockResolvedValue({ data: savedAttribute });

      const result = await useIdentityStore.getState().addAttribute(newAttribute, accessToken);

      const state = useIdentityStore.getState();
      expect(state.attributes).toContainEqual(savedAttribute);
      expect(state.message).toBe(`Attribute "${newAttribute.name}" added successfully!`);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(result).toEqual(savedAttribute);
    });

    it('should throw error if no accessToken', async () => {
      await expect(useIdentityStore.getState().addAttribute(newAttribute, null))
        .rejects.toThrow('Authentication token missing. Cannot add attribute.');

      const state = useIdentityStore.getState();
      expect(state.error).toBe('Authentication token missing. Cannot add attribute.');
      expect(state.isLoading).toBe(false);
    });

    it('should handle errors when adding attribute', async () => {
      const errorMsg = 'Failed to add attribute';
      axiosInstance.post.mockRejectedValue(new Error(errorMsg));

      await expect(useIdentityStore.getState().addAttribute(newAttribute, accessToken))
        .rejects.toThrow();

      const state = useIdentityStore.getState();
      expect(state.error).toBe(errorMsg);
      expect(state.isLoading).toBe(false);
    });
  });

  // Similarly you can add updateAttribute and deleteAttribute tests if your store has them
});
