import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ContextSelectionPage({ userInfo, onContextSelectionComplete }) {
  const [contexts, setContexts] = useState([]);
  const [selectedContext, setSelectedContext] = useState(null);
  const [attributes, setAttributes] = useState([]); // This list holds public attributes from backend
  const [sharedAttributeIds, setSharedAttributeIds] = useState([]); // NEW: IDs of attributes the user *chooses* to share
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthHeader = () => {
    const base64Credentials = btoa(`${userInfo.username}:password`);
    return {
      'Authorization': `Basic ${base64Credentials}`
    };
  };

  useEffect(() => {
    const fetchContexts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(
          'http://localhost:8080/api/users/me/contexts',
          { headers: getAuthHeader() }
        );
        setContexts(response.data);
      } catch (err) {
        console.error('Error fetching contexts:', err);
        setError('Failed to load contexts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userInfo && userInfo.username) {
      fetchContexts();
    }
  }, [userInfo]);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (!selectedContext) {
        setAttributes([]);
        setSharedAttributeIds([]); // Clear shared selection
        return;
      }
      setLoading(true);
      setError('');
      try {
        // This request now gets ONLY public attributes from the backend
        const response = await axios.get(
          `http://localhost:8080/api/users/me/attributes/${selectedContext.id}`,
          { headers: getAuthHeader() }
        );
        setAttributes(response.data);
        // NEW: Automatically select all fetched public attributes for sharing by default
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
  }, [selectedContext, userInfo]);

  // NEW: Handler for attribute sharing checkboxes
  const handleShareCheckboxChange = (attributeId) => {
    setSharedAttributeIds((prevSelected) => {
      if (prevSelected.includes(attributeId)) {
        return prevSelected.filter((id) => id !== attributeId); // Deselect
      } else {
        return [...prevSelected, attributeId]; // Select
      }
    });
  };


  const handleConfirmSelection = () => {
    if (selectedContext && onContextSelectionComplete) {
      // NEW: Filter the attributes based on what the user chose to share
      const attributesToShare = attributes.filter(attr => sharedAttributeIds.includes(attr.id));

      console.log("login-prompt ContextSelectionPage: Confirming attributes to share:", attributesToShare);

      onContextSelectionComplete({
        userId: userInfo.userId,
        username: userInfo.username,
        selectedContext: selectedContext,
        contextualAttributes: attributesToShare // Send only the attributes the user chose to share
      });
    } else if (!selectedContext) {
      setError("Please select a context before confirming.");
    }
  };

  if (loading && contexts.length === 0) {
    return <p>Loading contexts...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

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
            <ul className="attribute-list">
              <p className="note-text-small">Select attributes to share with the client application:</p> {/* New instruction */}
              {attributes.map((attr) => (
                <li key={attr.id} className="attribute-share-item"> {/* Added class for styling */}
                  <div className="attribute-info">
                    <strong>{attr.name}:</strong> {attr.value}
                    {/* (Public) is shown for user's information, but backend already filtered for public */}
                    {attr.public ? ' (Public)' : ''}
                  </div>
                  <div className="attribute-share-toggle">
                    <input
                      type="checkbox"
                      id={`share-${attr.id}`}
                      checked={sharedAttributeIds.includes(attr.id)}
                      onChange={() => handleShareCheckboxChange(attr.id)}
                      className="form-checkbox"
                    />
                    <label htmlFor={`share-${attr.id}`} className="share-label">Share</label> {/* New label */}
                  </div>
                </li>
              ))}
            </ul>
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