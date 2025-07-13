import React, {createContext, useState, useEffect, useCallback, useContext, useMemo} from 'react';
import {setGlobalLogoutHandler} from 'shared/api/axiosConfig';

// Create the AuthContext
const AuthContext = createContext(null);

// AuthProvider Component
export const AuthProvider = ({children}) => {

  // State to manage authentication status, user info, and loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // This is the setter we need to expose
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load user info from sessionStorage on initial mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      console.log("AuthContext: Checking sessionStorage for user info...");
      const storedUsername = sessionStorage.getItem('dashboardUsername');
      const storedUserId = sessionStorage.getItem('dashboardUserId');
      const storedJwtToken = sessionStorage.getItem('dashboardJwtToken');

      // Check if we have all necessary user info
      if (storedUsername && storedUserId && storedJwtToken) {
        setIsAuthenticated(true);
        setUserInfo({username: storedUsername, userId: storedUserId, token: storedJwtToken});
        console.log("User loaded from sessionStorage.", {
          username: storedUsername,
          userId: storedUserId,
          token: '********'
        });
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
        console.log("No complete user info found in sessionStorage.");
      }
      setIsLoading(false);
    };

    loadUserFromStorage();
  }, []);

  // Handle login success
  const handleLoginSuccess = useCallback((data) => {
    console.log("Handle login success. Received data:", data);
    setIsAuthenticated(true);
    setUserInfo(data);
    sessionStorage.setItem('dashboardUsername', data.username);
    sessionStorage.setItem('dashboardUserId', data.userId);
    sessionStorage.setItem('dashboardJwtToken', data.token);
    console.log("Authenticated state set. New userInfo:", data);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    console.log("Logging out.");
    setIsAuthenticated(false);
    setUserInfo(null);
    sessionStorage.clear();
    console.log("Session storage cleared and state reset.");
  }, []);

  // Register the logout handler with the Axios config
  // This ensures that if Axios intercepts a 401, it can trigger a global logout
  useEffect(() => {
    console.log("Registering global logout handler.");
    setGlobalLogoutHandler(handleLogout);
  }, [handleLogout]);

  // Value object to be provided by the context
  const authContextValue = useMemo(() => ({
    isAuthenticated,
    userInfo,
    isLoading,
    handleLoginSuccess,
    handleLogout,
    setUserInfo,
  }), [isAuthenticated, userInfo, isLoading, handleLoginSuccess, handleLogout, setUserInfo]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};