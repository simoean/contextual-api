import React, {useEffect, useState, useCallback} from 'react';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';
import useAuthParams from '../../hooks/useAuthParams';

import './App-signin.css';

const ContextSelectionPage = () => {

  // State variables to manage contexts, selected context, attributes, shared attribute IDs
  const [contexts, setContexts] = useState([]);
  const [selectedContext, setSelectedContext] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [sharedAttributeIds, setSharedAttributeIds] = useState([]);

  // Loading the state and error messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use the authentication context to get user info and authentication status
  const { userInfo, isAuthenticated, isLoading } = useAuth();
  const { isClientFlow, clientId, redirectUri } = useAuthParams();

  const getAuthHeader = useCallback(() => {
    if (userInfo?.token) {
      return {'Authorization': `Bearer ${userInfo.token}`};
    }
    return {};
  }, [userInfo.token]);

  // Fetch contexts when userInfo is available
  useEffect(() => {

    // Add a check to ensure we are in a valid client flow context
    if (!isLoading && (!isAuthenticated || !isClientFlow)) {
      setError("Invalid access. Please log in through a client application.");
      console.error("ContextSelectionPage: Missing authentication or client parameters for external flow.");
      window.close();
    }

    const fetchContexts = async () => {
      if (!userInfo?.token) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:8080/api/users/me/contexts', {
          headers: getAuthHeader()
        });
        setContexts(response.data);
      } catch (err) {
        console.error('Error fetching contexts:', err);
        setError('Failed to load contexts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch contexts if authenticated and in a client flow
    if (!isLoading && isAuthenticated && isClientFlow)
      fetchContexts();

  }, [userInfo, isLoading, isAuthenticated, isClientFlow, getAuthHeader]);

  // Fetch attributes when a context is selected
  useEffect(() => {
    const fetchAttributes = async () => {
      if (!selectedContext || !userInfo?.token) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/me/attributes/${selectedContext.id}`,
          {headers: getAuthHeader()}
        );
        setAttributes(response.data);
        setSharedAttributeIds(response.data.map(attr => attr.id));
      } catch (err) {
        console.error(`Error fetching attributes for context ${selectedContext.id}:`, err);
        setError(`Failed to load attributes for ${selectedContext.name}.`);
        setAttributes([]);
        setSharedAttributeIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [selectedContext, userInfo, getAuthHeader]);

  // Handle checkbox changes for sharing attributes
  const handleShareCheckboxChange = (attributeId) => {
    setSharedAttributeIds((prev) =>
      prev.includes(attributeId)
        ? prev.filter((id) => id !== attributeId)
        : [...prev, attributeId]
    );
  };

  // Handle confirmation of context selection and shared attributes
  const handleConfirmSelection = async () => { // Made async if you add API call here
    if (!selectedContext) {
      setError("Please select a context before confirming.");
      return;
    }
    // Ensure we have client parameters and user info to send back
    if (!isClientFlow || !clientId || !redirectUri || !userInfo?.token) {
      setError("Cannot complete selection: Missing client or user information.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const attributesToShare = attributes.filter(attr =>
        sharedAttributeIds.includes(attr.id)
      );

      // --- Audit shared contexts for this client ---
      /*
      try {
        await axios.post(
          'http://localhost:8080/api/context-sharing/record', // Adjust API endpoint
          {
            clientId: clientId,
            userId: userInfo.userId,
            selectedContextId: selectedContext.id,
            sharedAttributeIds: sharedAttributeIds
          },
          { headers: getAuthHeader() }
        );
        console.log("Context sharing recorded successfully on backend.");
      } catch (backendErr) {
        console.warn("Failed to record context sharing on backend (non-critical for client flow):", backendErr);
        // Decide if this error should block the postMessage or just log a warning
      }
      */

      // Construct the data payload to send back to the client
      const payload = {
        type: 'LOGIN_SUCCESS',
        token: userInfo.token,
        userId: userInfo.userId,
        username: userInfo.username,
        selectedContext: selectedContext,
        contextualAttributes: attributesToShare,
      };

      // Use window.opener.postMessage to send the data back
      if (window.opener && redirectUri) {
        window.opener.postMessage(payload, redirectUri);
        console.log("Sent payload back to client:", payload);
      } else {
        console.error("window.opener not found or redirectUri missing. Cannot post message.");
        setError("Could not communicate with the client application. Please try again.");
        return;
      }

      // Close the popup window
      window.close();
      console.log("Popup sign-in window closed.");

    } catch (err) {
      console.error('Error during context confirmation or communication:', err);
      setError(err.response?.data?.message || 'An error occurred during context selection and communication.');
    } finally {
      setLoading(false);
    }
  };

  // If loading, show a loading message
  if (loading && contexts.length === 0) {
    return <p>Loading contexts...</p>;
  }

  // If there's an error, display it
  if (error) {
    return <p className="error-message">{error}</p>;
  }

  // Render the context selection UI
  return (
    <div className="context-selection-container">
      <h2>Welcome, {userInfo?.username}!</h2>
      <h3>Select a Context:</h3>
      <div className="context-list">
        {contexts.length > 0 ? (
          contexts.map((context) => (
            <button
              key={context.id}
              className={`context-button ${selectedContext?.id === context.id ? 'selected' : ''}`}
              onClick={() => setSelectedContext(context)}
            >
              {context.name}
            </button>
          ))
        ) : (
          <p>No contexts found for your user.</p>
        )}
      </div>

      {selectedContext && (
        <div className="selected-context-details">
          <h3>Attributes for "{selectedContext.name}" Context:</h3>
          {loading && attributes.length === 0 ? (
            <p>Loading attributes...</p>
          ) : attributes.length > 0 ? (
            <>
              <p className="note-text-small">Select attributes to share with the client application:</p>
              <ul className="attribute-list">
                {attributes.map((attr) => (
                  <li key={attr.id} className="attribute-share-item">
                    <div className="attribute-info">
                      <strong>{attr.name}:</strong> {attr.value}
                      {attr.public ? ' (Public)' : ''}
                    </div>
                    <div className="attribute-share-toggle">
                      <input
                        type="checkbox"
                        id={`share-${attr.id}`}
                        checked={sharedAttributeIds.includes(attr.id)}
                        onChange={() => handleShareCheckboxChange(attr.id)}
                      />
                      <label htmlFor={`share-${attr.id}`} className="share-label">Share</label>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No public attributes found for this context.</p>
          )}

          <button onClick={handleConfirmSelection} disabled={!selectedContext || loading}>
            Confirm Selection
          </button>
        </div>
      )}
    </div>
  );
}

export default ContextSelectionPage;
