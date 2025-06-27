import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ContextSelectionPage from './components/ContextSelectionPage';

function App() {

  // State variables to manage authentication status, user info, and dashboard mode
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isDashboardMode, setIsDashboardMode] = useState(false);

  // Check URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'dashboard') {
      setIsDashboardMode(true);
      console.log("login-prompt App.js: Detected dashboard mode.");
    }
  }, []);

  // This is called by LoginPage after successful authentication
  const handleLoginSuccess = (userData) => {
    // userData here is: { userId, username: loggedInUsername, token }
    console.log("login-prompt App.js: handleLoginSuccess received userData (from LoginPage):", userData);
    setIsAuthenticated(true);
    setUserInfo(userData);

    // If in dashboard mode, immediately send success message and close
    if (isDashboardMode && window.opener) {
      console.log("In dashboard mode, sending LOGIN_SUCCESS_DASHBOARD and closing.");
      window.opener.postMessage(
        { type: 'LOGIN_SUCCESS_DASHBOARD', userInfo: userData },
        'http://localhost:3100'
      );
      window.close();
    }
  };

  // This function will be called by ContextSelectionPage when the user confirms their context
  const handleContextSelectionComplete = (selectedData) => {
    console.log("Context selection complete, sending response to client:", selectedData);
    if (window.opener) {
      window.opener.postMessage(
        { type: 'LOGIN_SUCCESS', payload: { ...selectedData, token: userInfo.token } },
        'http://localhost:3200'
      );
      window.close();
    }
  };

  // Render the main application
  return (
    <div className="App">
      <header className="App-header">
        <h1>Contextual Identity API</h1>
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          // Conditionally render ContextSelectionPage only if not in dashboard mode
          !isDashboardMode ? (
            <ContextSelectionPage
              userInfo={userInfo}
              onContextSelectionComplete={handleContextSelectionComplete}
            />
          ) : (
            // If in dashboard mode and authenticated, but window hasn't closed yet
            <p>Authentication successful! Redirecting to dashboard...</p>
          )
        )}
      </header>
    </div>
  );
}

export default App;