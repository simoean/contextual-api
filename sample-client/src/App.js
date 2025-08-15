import React, {useEffect, useState, useMemo, useCallback} from 'react';
import axios from 'axios';
import {AlertTriangle, Award, Briefcase, Gamepad2, Loader2, RefreshCcw, Users,} from 'lucide-react';
import './App.css';
import SignInPage from './components/SignInPage';

// Function to create a unique key for each client's token.
// Moved outside the component to ensure it's a stable reference.
const getAuthTokenKey = (clientId) => `authToken-${clientId}`;

/**
 * Main application component.
 * Manages client state, authentication, and data display.
 */
function App() {
  // Assume you have an axios instance configured with a base URL
  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'http://localhost:8080/api/v1',
  }), []);

  // A simple API client to interact with your backend, memoized for stability.
  // Now includes axiosInstance as a dependency.
  const API = useMemo(() => ({
    loginUser: async (username, password, clientId) => {
      try {
        const response = await axiosInstance.post('/auth/login', {
          username,
          password,
          clientId,
        });
        return response.data;
      } catch (error) {
        console.error('API Login Error:', error.response?.data || error.message);
        throw error;
      }
    },
    validateToken: async (token) => {
      try {
        const response = await axiosInstance.get('/auth/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('API Token Validation Error:', error.response?.data || error.message);
        throw error;
      }
    },
    fetchConsentedAttributes: async (userId, clientId, accessToken) => {
      try {
        const response = await axiosInstance.get(`/users/${userId}/attributes?clientId=${clientId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        return response.data;
      } catch (error) {
        console.error("API Fetch Error:", error.response?.data || error.message);
        throw error;
      }
    }
  }), [axiosInstance]);

  // Sample Client Configurations, memoized because they are static
  const clientConfigs = useMemo(() => [
    {
      id: "professional-network",
      name: "Pro-Connect",
      theme: "pro-connect",
      icon: <Briefcase className="w-6 h-6" />,
      description: "Manage your professional network and career profile. Requires your work history and skills.",
    },
    {
      id: "social-network",
      name: "Social Sphere",
      theme: "social-sphere",
      icon: <Users className="w-6 h-6" />,
      description: "Connect with friends and family. Requires your name and profile photo.",
    },
    {
      id: "learning-platform",
      name: "LearnHub",
      theme: "learn-hub",
      icon: <Award className="w-6 h-6" />,
      description: "Track your learning progress and certifications. Requires your course history and academic achievements.",
    },
    {
      id: "gaming-site",
      name: "Game Zone",
      theme: "game-zone",
      icon: <Gamepad2 className="w-6 h-6" />,
      description: "Personalize your gaming experience. Requires your game preferences and achievements.",
    },
  ], []);

  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentClient, setCurrentClient] = useState(null);
  const [currentClientIndex, setCurrentClientIndex] = useState(null);

  // Login Success Handler, memoized with useCallback.
  // getAuthTokenKey is no longer a dependency since it's a stable, outside function.
  const handleLoginSuccess = useCallback(async (payloadData) => {
    console.log("App.js: handleLoginSuccess received payload from message/direct login:", payloadData);
    setIsAuthenticated(true);
    setUserInfo(payloadData);
    // Store the new token in session storage using a client-specific key
    sessionStorage.setItem(getAuthTokenKey(currentClient.id), payloadData.token);

    // Now, fetch the specific attributes using the new API
    try {
      const fetchedAttributes = await API.fetchConsentedAttributes(payloadData.userId, currentClient.id, payloadData.token);
      setAttributes(fetchedAttributes);
    } catch (e) {
      setError('Failed to fetch attributes after login.');
    }
  }, [API, currentClient]);

  // Manual Attribute Refresh Handler
  const refreshAttributes = async () => {
    if (!userInfo || !currentClient) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem(getAuthTokenKey(currentClient.id));
      const fetchedAttributes = await API.fetchConsentedAttributes(userInfo.userId, currentClient.id, token);
      setAttributes(fetchedAttributes);
      setError('');
    } catch (e) {
      setError('Failed to refresh attributes.');
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    console.log("App.js: Logging out.");
    setIsAuthenticated(false);
    setUserInfo(null);
    setAttributes([]);
    setError('');
    // Remove only the current client's token
    sessionStorage.removeItem(getAuthTokenKey(currentClient.id));
  };

  /**
   * Cycles the current client to the next one in the list.
   */
  const changeClient = () => {
    // Clear state when changing clients
    setAttributes([]);
    setIsAuthenticated(false);
    setUserInfo(null);
    setError('');

    // Increment the index and wrap around if it exceeds the array length
    const newIndex = (currentClientIndex + 1) % clientConfigs.length;
    setCurrentClientIndex(newIndex);
    setCurrentClient(clientConfigs[newIndex]);
  };

  // Initial Setup on Component Mount and Client Change
  useEffect(() => {
    const trySilentSignIn = async () => {
      setLoading(true);
      const storedToken = sessionStorage.getItem(getAuthTokenKey(currentClient.id));

      if (storedToken) {
        try {
          const userData = await API.validateToken(storedToken);
          // Update the stored token with the new one from the backend
          sessionStorage.setItem(getAuthTokenKey(currentClient.id), userData.token);
          // Now handle the successful login
          handleLoginSuccess({
            ...userData,
            selectedAttributes: [], // This will be fetched below
          });
        } catch (err) {
          console.log('Silent sign-in failed, clearing token.');
          // Token is invalid or expired, so we remove it
          sessionStorage.removeItem(getAuthTokenKey(currentClient.id));
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    if (currentClient) {
      trySilentSignIn();
    } else {
      // No session data, so select a random client for a fresh start
      const randomIndex = Math.floor(Math.random() * clientConfigs.length);
      setCurrentClient(clientConfigs[randomIndex]);
      setCurrentClientIndex(randomIndex);
    }
  }, [currentClient, API, clientConfigs, handleLoginSuccess]);

  // UI Rendering
  if (!currentClient || loading) {
    return (
      <div className="App-container theme-default">
        <div className="loading-state">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App-container theme-${currentClient.theme}`}>
      <div className="App-header">
        <div className="header-content">
          <h1>{currentClient.icon} {currentClient.name}</h1>
          <p>{currentClient.description}</p>
        </div>
        <div className="button-group">
          <button className="change-client-button" onClick={changeClient}>Change Client</button>
          {isAuthenticated && (
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <SignInPage onLoginSuccess={handleLoginSuccess} currentClient={currentClient} loginUserApi={API.loginUser} />
      ) : (
        <div className="data-display-container">
          <h2>Welcome, {userInfo?.username || 'User'}!</h2>
          <div className="data-control-buttons">
            <button onClick={refreshAttributes} disabled={loading}>
              <RefreshCcw className="icon" /> Refresh Attributes
            </button>
          </div>
          {loading ? (
            <div className="loading-state">
              <Loader2 className="icon animate-spin" />
              <p>Loading your data...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <AlertTriangle className="icon" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {attributes.length > 0 ? (
                <ul className="data-list">
                  {attributes.map((attr, index) => (
                    <li key={index}>
                      <strong>{attr.name}:</strong> {attr.value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No attributes found for this client.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
