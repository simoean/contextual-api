import React, { useState } from 'react';
import axios from 'axios';

function LoginPage({ onLoginSuccess }) { // onLoginSuccess prop to handle successful login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    setError('');

    try {
      // Make a POST request to your Spring Boot backend's login endpoint
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });

      console.log('Login successful:', response.data);
      // Assuming a successful response contains user ID/username
      if (onLoginSuccess) {
        onLoginSuccess(response.data); // Pass authenticated user data to parent component
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