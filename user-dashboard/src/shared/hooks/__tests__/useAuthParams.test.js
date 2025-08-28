import { renderHook } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import useAuthParams from '../useAuthParams';

// Global Mocks
// Mock the useLocation hook from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

describe('useAuthParams', () => {
  // --- Test Cases ---

  it('should return all params when client_id and redirect_uri are present', () => {
    // Arrange
    const mockLocation = {
      search: '?client_id=test-client&redirect_uri=https://example.com/callback',
    };
    useLocation.mockReturnValue(mockLocation);

    // Act
    const { result } = renderHook(() => useAuthParams());

    // Assert
    expect(result.current.clientId).toBe('test-client');
    expect(result.current.redirectUri).toBe('https://example.com/callback');
    expect(result.current.isClientFlow).toBe(true);
  });

  it('should return null for missing params and isClientFlow should be false', () => {
    // Arrange
    const mockLocation = {
      search: '?client_id=test-client-only',
    };
    useLocation.mockReturnValue(mockLocation);

    // Act
    const { result } = renderHook(() => useAuthParams());

    // Assert
    expect(result.current.clientId).toBe('test-client-only');
    expect(result.current.redirectUri).toBeNull();
    expect(result.current.isClientFlow).toBe(false);
  });

  it('should return null for all params when the search string is empty', () => {
    // Arrange
    const mockLocation = {
      search: '',
    };
    useLocation.mockReturnValue(mockLocation);

    // Act
    const { result } = renderHook(() => useAuthParams());

    // Assert
    expect(result.current.clientId).toBeNull();
    expect(result.current.redirectUri).toBeNull();
    expect(result.current.isClientFlow).toBe(false);
  });

  it('should correctly decode URI-encoded redirect_uri', () => {
    // Arrange
    const redirectUri = 'https://my-app.com/auth/callback';
    const mockLocation = {
      search: `?client_id=test-client&redirect_uri=${encodeURIComponent(redirectUri)}`,
    };
    useLocation.mockReturnValue(mockLocation);

    // Act
    const { result } = renderHook(() => useAuthParams());

    // Assert
    expect(result.current.redirectUri).toBe(redirectUri);
    expect(result.current.isClientFlow).toBe(true);
  });
});
