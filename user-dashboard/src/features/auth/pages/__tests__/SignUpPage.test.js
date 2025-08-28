import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import SignUpPage from '../SignUpPage';
import * as authStore from 'features/auth/store/authenticationStore';
import '@testing-library/jest-dom';

// --- Global Mocks ---
jest.mock('features/auth/store/authenticationStore');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

describe('SignUpPage', () => {
  const mockRegister = jest.fn();

  const renderComponent = () => {
    return render(
      <ChakraProvider>
        <MemoryRouter>
          <SignUpPage />
        </MemoryRouter>
      </ChakraProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authStore.useAuthenticationStore.mockReturnValue({
      register: mockRegister,
    });
  });

  it('should render the form with all fields and buttons', () => {
    // Arrange & Act
    renderComponent();

    // Assert
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-submit-button')).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show an error toast when passwords do not match', async () => {
    // Arrange
    renderComponent();

    // Act
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByTestId('signup-submit-button'));

    // Assert
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Passwords do not match.',
        status: 'error',
      }));
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should call register and navigate on successful signup', async () => {
    // Arrange
    mockRegister.mockResolvedValueOnce();
    renderComponent();

    // Act
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('signup-submit-button'));

    // Assert
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({ username: 'newuser', password: 'password123' });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      // ** THE FIX **
      expect(mockNavigate).toHaveBeenCalledWith('/auth/connect');
    });
  });

  it('should show an error toast on registration failure', async () => {
    // Arrange
    mockRegister.mockRejectedValueOnce(new Error('User already exists'));
    renderComponent();

    // Act
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('signup-submit-button'));

    // Assert
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: 'User already exists',
        status: 'error',
      }));
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    // Arrange
    renderComponent();
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByLabelText(/show password/i);

    // Assert: Initial state
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Act
    fireEvent.click(toggleButton);

    // Assert: After click
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/hide password/i)).toBeInTheDocument();
  });
});
