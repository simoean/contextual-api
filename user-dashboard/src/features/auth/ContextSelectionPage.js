import React, {useEffect, useMemo} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {useIdentityStore} from '../../store/identityStore';
import {useAuthenticationStore} from '../../store/authenticationStore';

import {useAuth} from '../../context/AuthContext';

import './App-signin.css';

/**
 * Context Selection Page
 * This component allows users to select a context and attributes to share with a client application during the
 * authentication process.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const ContextSelectionPage = () => {

  // Use React Router hooks for navigation and location
  const navigate = useNavigate();
  const location = useLocation();

  // State to manage contexts, attributes, loading and error messages
  const { contexts, attributes, fetchIdentityData, isLoading: dataLoading, error: storeError } = useIdentityStore();

  // Get selected state and actions from the popup-specific store
  const { selectedContextId, selectedAttributeIds, setSelectedContextId, toggleSelectedAttributeId, resetSelection } = useAuthenticationStore();

  // Use the authentication context to get user info and authentication status
  const {userInfo, isAuthenticated, isLoading: authLoading} = useAuth();

  /**
   * Fetch Identity Data
   * This effect fetches the user's contexts and attributes from the backend
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated && userInfo?.token && contexts.length === 0 && attributes.length === 0) {
      fetchIdentityData(userInfo);
    }
  }, [userInfo, isAuthenticated, authLoading, fetchIdentityData, contexts.length, attributes.length]);

  /**
   * Handle Authentication Status
   * This effect checks if the user is authenticated and redirects to the sign-in page if not.
   */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("ContextSelectionPage: Not authenticated, redirecting to sign in.");
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [authLoading, isAuthenticated, navigate, location.pathname]);

  /**
   * Handle Context Button Click
   * This function updates the selected context ID in the store when a context button is clicked.
   *
   * @param contextId - The ID of the context that was clicked.
   */
  const handleContextButtonClick = (contextId) => {
    setSelectedContextId(contextId);
  };

  /**
   * Handle Cancel Action
   */
  const handleCancel = () => {
    resetSelection();
    if (window.opener) {
      window.opener.postMessage({ type: 'CONTEXT_AUTH_CANCEL' }, window.location.origin);
    }
    window.close();
  };

  /**
   * Handle Share Checkbox Change
   * This function toggles the selection of an attribute when the user checks or unchecks the checkbox.
   *
   * @param attributeId - The ID of the attribute to toggle selection for.
   */
  const handleShareCheckboxChange = (attributeId) => {
    toggleSelectedAttributeId(attributeId);
  };

  /**
   * Handle Confirm Selection
   * This function collects the selected context and attributes, prepares the authentication data,
   * and sends it back to client apps.
   */
  const handleConfirmSelection = () => {
    // Get the selected context object from store using 'selectedContextId'
    const finalSelectedContext = contexts.find(ctx => ctx.id === selectedContextId);

    // Filter the attributes to include only the ones selected by the user
    const finalSelectedAttributes = filteredAttributes.filter(attr =>
      selectedAttributeIds.includes(attr.id)
    );

    // Generate the authentication data to send back to the client
    const authData = {
      token: userInfo?.token,
      userId: userInfo?.userId,
      username: userInfo?.username,
      selectedContext: finalSelectedContext,
      selectedAttributes: finalSelectedAttributes,
    };

    // Respond to the opener window with the authentication data
    if (window.opener) {
      window.opener.postMessage({ type: 'CONTEXT_AUTH_SUCCESS', payload: authData }, window.location.origin);
      window.close();
    } else {
      console.warn("No opener window found. Cannot send authentication data.");
      console.log("AuthData payload:", authData);
    }

    resetSelection();
  };

  // Memoize the selected context to avoid unnecessary recalculations
  const selectedContext = useMemo(() => {
    return contexts.find(ctx => ctx.id === selectedContextId);
  }, [selectedContextId, contexts]);

  // Memoize the filtered attributes based on the selected context ID and visibility
  const filteredAttributes = useMemo(() => {
    if (!selectedContextId) {
      return [];
    }
    return attributes.filter(attr =>
      Array.isArray(attr.contextIds) &&
      attr.contextIds.includes(selectedContextId) &&
      attr.visible
    );
  }, [selectedContextId, attributes]);

  // If loading contexts or attributes, show a loading message
  if (authLoading || dataLoading) {
    return <p>Loading contexts and attributes for selection...</p>;
  }

  // If there is an error in the store, display it
  if (storeError) {
    return <p className="error-message">Error loading selection options: {storeError}</p>;
  }

  // If the user is not authenticated or userInfo is missing, show an error message
  if (!isAuthenticated || !userInfo?.token) {
    return <p className="error-message">Authentication required for context selection. Please sign in.</p>;
  }

  /**
   * Render the Context Selection Page
   */
  return (
    <div className="context-selection-container">
      <h2>Welcome, {userInfo?.username}!</h2>
      <h3>Select a Context:</h3>
      <div className="context-list">
        {contexts.length > 0 ? (
          contexts.map((context) => (
            <button
              key={context.id}
              className={`context-button ${selectedContextId === context.id ? 'selected' : ''}`}
              // When button clicked, directly update the selectedContextId in the store
              onClick={() => handleContextButtonClick(context.id)}
            >
              {context.name}
            </button>
          ))
        ) : (
          <p>No contexts found for your user.</p>
        )}
      </div>

      { selectedContext && ( // Only render this block if a context has been selected
        <div className="selected-context-details">
          <h3>Attributes for "{selectedContext.name}" Context:</h3>
          { dataLoading ? ( // Either render the form or a loading message
            <p>Loading attributes...</p>
          ) : filteredAttributes.length > 0 ? (
            <>
              <p className="note-text-small">Select attributes to share with the client application:</p>
              <ul className="attribute-list">
                {filteredAttributes.map((attr) => (
                  <li key={attr.id} className="attribute-share-item">
                    <div className="attribute-info">
                      <strong>{attr.name}:</strong> {attr.value}
                    </div>
                    <div className="attribute-share-toggle">
                      <input
                        type="checkbox"
                        id={`share-${attr.id}`}
                        checked={selectedAttributeIds.includes(attr.id)}
                        // Use the store's toggle action directly
                        onChange={() => handleShareCheckboxChange(attr.id)}
                      />
                      <label htmlFor={`share-${attr.id}`} className="share-label">Share</label>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No visible attributes found for this context.</p>
          )}

          <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleConfirmSelection} // Prepare and return the selected context and attributes
              disabled={!selectedContextId || dataLoading}
              className="add-button"
              style={{ flexGrow: 1 }}
            >
              Confirm Selection
            </button>
            <button
              onClick={handleCancel} // Cancel and close popup
              className="cancel-button"
              style={{ flexGrow: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSelectionPage;
