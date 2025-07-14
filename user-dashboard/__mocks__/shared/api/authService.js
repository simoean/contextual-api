// shared/api/__mocks__/authService.js

// Ensure these are directly exported as functions.
// This mimics how `authService` would normally export them.
const loginUser = jest.fn();
const registerUser = jest.fn();

export { loginUser, registerUser };