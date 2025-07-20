import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import SignUpPage from '../SignUpPage';

// Mock Chakra UI's useToast
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const original = jest.requireActual('@chakra-ui/react');
  return {
    ...original,
    useToast: () => mockToast,
    useColorMode: () => ({
      colorMode: 'light',
      toggleColorMode: jest.fn(),
    }),
  };
});

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => mockNavigate,
    Link: ({children, to}) => <a href={to}>{children}</a>,
  };
});

// Mock authentication store
const mockRegister = jest.fn();
jest.mock('features/auth/store/authenticationStore', () => ({
  useAuthenticationStore: () => ({
    register: mockRegister,
  }),
}));

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the form with all fields and buttons', () => {
    render(<SignUpPage />, {wrapper: MemoryRouter});

    expect(screen.getByLabelText(/username/i)).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByTestId('confirm-password-input')).toBeTruthy();

    expect(screen.getByRole('button', {name: /sign up/i})).toBeTruthy();
    expect(screen.getByRole('button', {name: /toggle color mode/i})).toBeTruthy();
    expect(screen.getByText(/already have an account\?/i)).toBeTruthy();
    expect(screen.getByRole('link', {name: /sign in/i})).toBeTruthy();
  });

  test('shows error toast when passwords do not match', async () => {
    render(<SignUpPage />, {wrapper: MemoryRouter});

    fireEvent.change(screen.getByLabelText(/username/i), {target: {value: 'user1'}});
    fireEvent.change(screen.getByTestId('password-input'), {target: {value: 'password1'}});
    fireEvent.change(screen.getByTestId('confirm-password-input'), {target: {value: 'password2'}});

    fireEvent.click(screen.getByRole('button', {name: /sign up/i}));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Registration Error',
        description: 'Passwords do not match.',
        status: 'error',
      }));
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('calls register and navigates on successful signup', async () => {
    mockRegister.mockResolvedValueOnce(); // simulate successful registration

    render(<SignUpPage />, {wrapper: MemoryRouter});

    fireEvent.change(screen.getByLabelText(/username/i), {target: {value: 'user1'}});
    fireEvent.change(screen.getByTestId('password-input'), {target: {value: 'password123'}});
    fireEvent.change(screen.getByTestId('confirm-password-input'), {target: {value: 'password123'}});

    fireEvent.click(screen.getByRole('button', {name: /sign up/i}));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({username: 'user1', password: 'password123'});
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Registration Successful',
        status: 'success',
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('shows error toast on registration failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('User already exists'));

    render(<SignUpPage />, {wrapper: MemoryRouter});

    fireEvent.change(screen.getByLabelText(/username/i), {target: {value: 'user1'}});
    fireEvent.change(screen.getByTestId('password-input'), {target: {value: 'password123'}});
    fireEvent.change(screen.getByTestId('confirm-password-input'), {target: {value: 'password123'}});

    fireEvent.click(screen.getByRole('button', {name: /sign up/i}));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Registration Failed',
        description: 'User already exists',
        status: 'error',
      }));
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('toggles password visibility icons', () => {
    render(<SignUpPage />, {wrapper: MemoryRouter});

    // Password field toggle
    const passwordToggleBtn = screen.getByLabelText(/show password/i);
    expect(passwordToggleBtn).toBeTruthy();
    fireEvent.click(passwordToggleBtn);
    // After toggle, the aria-label changes to 'Hide password'
    expect(screen.getByLabelText(/hide password/i)).toBeTruthy();

    // Confirm password field toggle
    const confirmToggleBtn = screen.getByLabelText(/show confirm password/i);
    expect(confirmToggleBtn).toBeTruthy();
    fireEvent.click(confirmToggleBtn);
    expect(screen.getByLabelText(/hide confirm password/i)).toBeTruthy();
  });
});
