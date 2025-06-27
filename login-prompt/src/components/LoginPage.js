import React, { useState } from 'react';
import axios from 'axios';

function LoginPage({ onLoginSuccess }) {

  // State variables for username, password, error message, and loading state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Make a POST request to the backend's login endpoint
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });

      console.log('Login successful:', response.data);

      // Successful auth response contains userId, username, AND the JWT token
      const { userId, username: loggedInUsername, token } = response.data;

      if (onLoginSuccess) {
        // Pass the token along with other user data to the parent component
        onLoginSuccess({ userId, username: loggedInUsername, token });
      }

    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render the login form
  return (
    <div className="login-container">
      <h2>Login to Contextual Identity API</h2>
      <form onSubmit={handleSubmit}>
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
          {loading ? 'Logging In...' : 'Login'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default LoginPage;