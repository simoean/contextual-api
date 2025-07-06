import React, { useState } from 'react';
import axios from 'axios';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAuthParams from '../../hooks/useAuthParams';

import './App-signin.css';

const SignInPage = () => {

  // State variables for username, password, error message, and loading state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Parse query parameters
  const { clientId, redirectUri, isClientFlow } = useAuthParams();

  const { handleLoginSuccess } = useAuth();

  // Function to handle login success and redirect
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });
      console.log('Login successful:', response.data);

      // Update the authentication context with the user data
      handleLoginSuccess(response.data);

      if (isClientFlow) {
        //  it's a client sign-in, redirect to ContextSelectionPage
        navigate(`/auth/context?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`);
      } else {
        // Navigate to the dashboard after successful login
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Login failed. Please check your credentials.');
      } else if (err.request) {
        setError('No response from server. Please try again later.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render the sign-in form
  return (
    <div className="login-container">
      <h2>Login to Contextual Identity API</h2>
      <form onSubmit={handleSignIn}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default SignInPage;