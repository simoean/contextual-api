import React, {useState, useEffect, useCallback} from 'react';
import './App.css';
import DashboardPage from './components/DashboardPage';
import LoginRedirect from './components/LoginRedirect';
import { setGlobalLogoutHandler } from './api/axiosConfig';

function App() {

  // State to manage authentication status and user info
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Effect to handle incoming messages from the login-prompt window
  useEffect(() => {
    const handleMessage = (event) => {

      // Ensure the message is from the login-prompt
      if (event.origin !== 'http://localhost:3000') {
        console.warn('Message received from unknown origin:', event.origin);
        return;
      }

      // Check the type of message
      if (event.data && event.data.type === 'LOGIN_SUCCESS_DASHBOARD') {
        const {userInfo: receivedUserInfo} = event.data;
        console.log("Received LOGIN_SUCCESS_DASHBOARD message:", receivedUserInfo);

        // Update state and sessionStorage with full user info, including the token
        setIsAuthenticated(true);
        setUserInfo(receivedUserInfo);
        sessionStorage.setItem('dashboardUsername', receivedUserInfo.username);
        sessionStorage.setItem('dashboardUserId', receivedUserInfo.userId);
        sessionStorage.setItem('dashboardJwtToken', receivedUserInfo.token);

        console.log("Authenticated via message. New userInfo:", receivedUserInfo);
      }
    };

    // Add event listener for messages
    window.addEventListener('message', handleMessage);

    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Check for authentication on component mount (e.g., from session storage)
  useEffect(() => {

    // Check sessionStorage for existing user info
    const storedUsername = sessionStorage.getItem('dashboardUsername');
    const storedUserId = sessionStorage.getItem('dashboardUserId');
    const storedJwtToken = sessionStorage.getItem('dashboardJwtToken');

    // If we have all necessary user info, set authenticated state
    if (storedUsername && storedUserId && storedJwtToken) {
      setIsAuthenticated(true);
      setUserInfo({username: storedUsername, userId: storedUserId, token: storedJwtToken});
      console.log("Loaded user from sessionStorage:", {
        username: storedUsername,
        userId: storedUserId,
        token: '********'
      });
    } else {
      setIsAuthenticated(false);
      setUserInfo(null);
      console.log("No complete user info in sessionStorage, showing LoginRedirect.");
    }
  }, []);

  // This handleLoginSuccess is for direct login
  const handleLoginSuccess = (data) => {
    console.log("handleLoginSuccess called. Received data:", data);
    setIsAuthenticated(true);
    setUserInfo(data);
    sessionStorage.setItem('dashboardUsername', data.username);
    sessionStorage.setItem('dashboardUserId', data.userId);
    sessionStorage.setItem('dashboardJwtToken', data.token);
    console.log("Authenticated state set. New userInfo:", data);
  };

  // Handle logout by clearing state and session storage
  const handleLogout = useCallback(() => {
    console.log("Logging out.");
    setIsAuthenticated(false);
    setUserInfo(null);
    sessionStorage.clear();
  }, []);

  // Register the logout handler with the Axios config
  useEffect(() => {
    setGlobalLogoutHandler(handleLogout);
  }, [handleLogout]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>User Dashboard</h1>
        {isAuthenticated && (
          <button onClick={handleLogout}>Logout</button>
        )}
      </header>

      {!isAuthenticated ? (
        <LoginRedirect onLoginSuccess={handleLoginSuccess}/>
      ) : (
        // Pass the full userInfo object to DashboardPage
        <DashboardPage userInfo={userInfo}/>
      )}
    </div>
  );
}

export default App;