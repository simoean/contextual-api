import React, { useState, useEffect } from 'react';
import './App.css'; // Or './App-dark.css' if you prefer
import LoginPage from './components/LoginPage';
import ContextSelectionPage from './components/ContextSelectionPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isDashboardMode, setIsDashboardMode] = useState(false); // New state for dashboard mode

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
    console.log("login-prompt App.js: handleLoginSuccess received userData (from LoginPage):", userData);
    setIsAuthenticated(true);
    setUserInfo(userData);

    // If in dashboard mode, immediately send success message and close
    if (isDashboardMode && window.opener) {
      console.log("login-prompt App.js: In dashboard mode, sending LOGIN_SUCCESS_DASHBOARD and closing.");
      window.opener.postMessage(
        { type: 'LOGIN_SUCCESS_DASHBOARD', userInfo: userData }, // Send basic userInfo
        'http://localhost:3100' // Explicitly target user-dashboard's origin
      );
      window.close(); // Close the login prompt window
    }
    // If NOT in dashboard mode, the flow continues to ContextSelectionPage
  };

  // This function will be called by ContextSelectionPage when the user confirms their context
  // This logic is ONLY for when NOT in dashboard mode (e.g., for sample-client)
  const handleContextSelectionComplete = (selectedData) => {
    console.log("login-prompt App.js: Context selection complete (non-dashboard mode), sending message to opener:", selectedData);
    if (window.opener) {
      window.opener.postMessage(
        { type: 'LOGIN_SUCCESS', payload: selectedData },
        'http://localhost:3200' // Explicitly target sample-client's origin
      );
      window.close(); // Close the login prompt window after sending the message
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Contextual Identity API</h1>
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          // Conditionally render ContextSelectionPage ONLY if NOT in dashboard mode
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