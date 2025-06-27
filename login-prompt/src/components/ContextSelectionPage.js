import React, {useEffect, useState} from 'react';
import axios from 'axios';

function ContextSelectionPage({userInfo, onContextSelectionComplete}) {

  // State variables to manage contexts, selected context, attributes, shared attribute IDs, loading state, and error messages
  const [contexts, setContexts] = useState([]);
  const [selectedContext, setSelectedContext] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [sharedAttributeIds, setSharedAttributeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthHeader = () => {
    if (userInfo?.token) {
      return {'Authorization': `Bearer ${userInfo.token}`};
    }
    return {};
  };

  // Fetch contexts when userInfo is available
  useEffect(() => {
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

    fetchContexts();
  }, [userInfo]);

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
  }, [selectedContext, userInfo]);

  const handleShareCheckboxChange = (attributeId) => {
    setSharedAttributeIds((prev) =>
      prev.includes(attributeId)
        ? prev.filter((id) => id !== attributeId)
        : [...prev, attributeId]
    );
  };

  // Handle confirmation of context selection and shared attributes
  const handleConfirmSelection = () => {
    if (!selectedContext) {
      setError("Please select a context before confirming.");
      return;
    }

    const attributesToShare = attributes.filter(attr =>
      sharedAttributeIds.includes(attr.id)
    );

    onContextSelectionComplete?.({
      userId: userInfo.userId,
      username: userInfo.username,
      selectedContext,
      contextualAttributes: attributesToShare
    });
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
