import React, { useState, useEffect } from 'react';

import './App.css';
import SignInPage from './components/SignInPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // Stores the full payload from login-prompt
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Keep loading state if you re-fetch or for direct login

  const handleLoginSuccess = (payloadData) => {
    console.log("Sample client App.js: handleLoginSuccess received payload from message/direct login:", payloadData);
    setIsAuthenticated(true);
    setUserInfo(payloadData);
    // Store as string to handle full object
    sessionStorage.setItem('sampleClientAuthData', JSON.stringify(payloadData));
  };

  useEffect(() => {
    const storedAuthData = sessionStorage.getItem('sampleClientAuthData');
    if (storedAuthData) {
      try {
        const parsedData = JSON.parse(storedAuthData);
        setIsAuthenticated(true);
        setUserInfo(parsedData);
        console.log("Sample client App.js: Loaded user info from session storage:", parsedData);
      } catch (e) {
        console.error("Sample client App.js: Failed to parse stored auth data from session storage:", e);
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    console.log("Sample client App.js: Logging out.");
    setIsAuthenticated(false);
    setUserInfo(null);
    setError('');
    sessionStorage.clear();
  };

  const displayAttributes = userInfo?.selectedAttributes || [];

  return (
    <div className="App">
      <div className="App-header">
        <h1>My Sample Client App</h1>
        <p>This application consumes identity data from the Contextual Identity API.</p>
        {isAuthenticated && (
          <button onClick={handleLogout}>Logout</button>
        )}
      </div>

      {!isAuthenticated ? (
        <SignInPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="data-display-container">
          <h2>Welcome, {userInfo?.username}!</h2>
          {userInfo?.selectedContext && (
            <p>Displaying data for your <strong>"{userInfo.selectedContext.name}"</strong> context:</p>
          )}
          {loading ? ( // This loading state might not be used much now, as data comes with payload
            <p>Loading your data...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <>
              {displayAttributes.length > 0 ? (
                <ul className="data-list">
                  {displayAttributes.map((attr) => (
                    // Use a more robust key like id or a combination of id and name
                    <li key={attr.id || `${attr.name}-${attr.value}`}>
                      <strong>{attr.name}:</strong> {attr.value}
                      {attr.public ? ' (Public)' : ' (Private)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No specific contextual data was selected or found for you from the API.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;