import React, { useState, useEffect } from 'react';
import './App.css';
import DashboardPage from './components/DashboardPage';
import LoginRedirect from './components/LoginRedirect';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Check for authentication on component mount (e.g., from session storage)
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('dashboardUsername');
    const storedUserId = sessionStorage.getItem('dashboardUserId');

    if (storedUsername && storedUserId) {
      setIsAuthenticated(true);
      setUserInfo({ username: storedUsername, userId: storedUserId });
      console.log("UserDashboard App.js: Loaded user from sessionStorage:", { username: storedUsername, userId: storedUserId });
    } else {
      setIsAuthenticated(false);
      setUserInfo(null);
      console.log("UserDashboard App.js: No user in sessionStorage, showing LoginRedirect.");
    }
  }, []);

  const handleLoginSuccess = (data) => {
    console.log("UserDashboard App.js: handleLoginSuccess called. Received data:", data);
    setIsAuthenticated(true);
    setUserInfo(data);
    sessionStorage.setItem('dashboardUsername', data.username);
    sessionStorage.setItem('dashboardUserId', data.userId);
    console.log("UserDashboard App.js: Authenticated state set. New userInfo:", data);
  };

  const handleLogout = () => {
    console.log("UserDashboard App.js: Logging out.");
    setIsAuthenticated(false);
    setUserInfo(null);
    sessionStorage.clear();
  };

  // Log on every render to see state
  console.log("UserDashboard App.js: Rendered. isAuthenticated:", isAuthenticated, "userInfo:", userInfo);

  return (
    <div className="App">
      <header className="App-header">
        <h1>User Dashboard</h1>
        {isAuthenticated && (
          <button onClick={handleLogout}>Logout</button>
        )}
      </header>

      {!isAuthenticated ? (
        <LoginRedirect onLoginSuccess={handleLoginSuccess} />
      ) : (
        <DashboardPage userInfo={userInfo} />
      )}
    </div>
  );
}

export default App;