import React, {useEffect, useState, useCallback} from 'react';
import axiosInstance from '../api/axiosConfig';
import useApi from '../hooks/useApi';
import ContextForm from './ContextForm';
import AttributeForm from './AttributeForm';

function DashboardPage({userInfo}) {

  // State to manage contexts and attributes (data specific to this page)
  const [contexts, setContexts] = useState([]);
  const [attributes, setAttributes] = useState([]);

  // Use the custom useApi hook to manage loading, error, and message states
  const {loading, error, message, callApi, setError} = useApi();

  // State for Context editing
  const [showContextForm, setShowContextForm] = useState(false);
  const [editingContext, setEditingContext] = useState(null);

  // State for Attribute editing
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);

  // Function to fetch contexts and attributes for the dashboard
  const fetchDashboardData = useCallback(async () => {

    // Ensure userInfo and token are available before making API calls
    if (!userInfo || !userInfo.token) {
      setError("Authentication token missing. Please log out and log in again.");
      return;
    }

    try {
      // Use callApi to wrap your data fetching
      const fetchedContexts = await callApi(
        () => axiosInstance.get('/users/me/contexts'),
        '',
        'Failed to load contexts.'
      );
      setContexts(fetchedContexts);

      const fetchedAttributes = await callApi(
        () => axiosInstance.get('/users/me/attributes'),
        '',
        'Failed to load attributes.'
      );
      setAttributes(fetchedAttributes);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  }, [userInfo, callApi, setError]);

  // Fetch dashboard data when userInfo is available (useEffect still useful here)
  useEffect(() => {
    if (userInfo && userInfo.token) {
      fetchDashboardData().then(() => console.log("Dashboard data fetched successfully."));
    }
  }, [userInfo]);

  // --- Context CRUD Handlers ---

  // Function to handle adding contexts
  const handleAddContext = () => {
    setEditingContext(null);
    setShowContextForm(true);
    setShowAttributeForm(false);
  };

  // Function to handle editing contexts
  const handleEditContext = (contextId) => {
    const contextToEdit = contexts.find(ctx => ctx.id === contextId);
    if (contextToEdit) {
      setEditingContext(contextToEdit);
      setShowContextForm(true);
      setShowAttributeForm(false);
    } else {
      setError("Context not found for editing.");
    }
  };

  // Function to handle saving contexts (both add and edit)
  const handleSaveContext = useCallback(async (contextToSave) => {
    if (!userInfo || !userInfo.token) { // Pre-check token presence
      setError("Authentication token missing. Please log out and log in again.");
      return;
    }
    try {
      await callApi(
        () => contextToSave.id
          ? axiosInstance.put(`/users/me/contexts/${contextToSave.id}`, contextToSave)
          : axiosInstance.post('/users/me/contexts', contextToSave),
        contextToSave.id
          ? `Context "${contextToSave.name}" updated successfully!`
          : `Context "${contextToSave.name}" added successfully!`,
        `Failed to save context.`
      );

      await fetchDashboardData();
      setShowContextForm(false);
      setEditingContext(null);
    } catch (err) {
      console.error("Error saving context:", err);
    }
  }, [userInfo, callApi, fetchDashboardData, setError]);

  // Function to handle cancelling the context form
  const handleCancelContextForm = () => {
    setShowContextForm(false);
    setEditingContext(null);
    setError('');
  };

  // Function to handle deleting contexts
  const handleDeleteContext = useCallback(async (contextId) => {
    if (!window.confirm("Are you sure you want to delete this context? This cannot be undone and will remove context references from attributes.")) {
      return;
    }
    if (!userInfo || !userInfo.token) { // Pre-check token presence
      setError("Authentication token missing. Please log out and log in again.");
      return;
    }
    try {
      await callApi(
        () => axiosInstance.delete(`/users/me/contexts/${contextId}`),
        "Context deleted successfully!",
        "Failed to delete context."
      );
      await fetchDashboardData();
    } catch (err) {
      console.error("Error deleting context:", err);
    }
  }, [userInfo, callApi, fetchDashboardData, setError]);

  // --- Attribute CRUD Handlers ---

  // Function to handle adding attributes
  const handleAddAttribute = () => {
    setEditingAttribute(null);
    setShowAttributeForm(true);
    setShowContextForm(false);
  };

  // Function to handle editing attributes
  const handleEditAttribute = (attributeId) => {
    const attributeToEdit = attributes.find(attr => attr.id === attributeId);
    if (attributeToEdit) {
      setEditingAttribute(attributeToEdit);
      setShowAttributeForm(true);
      setShowContextForm(false);
    } else {
      setError("Attribute not found for editing.");
    }
  };

  // Function to handle saving attributes (both add and edit)
  const handleSaveAttribute = useCallback(async (attributeToSave) => {
    if (!userInfo || !userInfo.token) {
      setError("Authentication token missing. Please log out and log in again.");
      return;
    }
    try {
      await callApi(
        () => attributeToSave.id
          ? axiosInstance.put(`/users/me/attributes/${attributeToSave.id}`, attributeToSave)
          : axiosInstance.post('/users/me/attributes', attributeToSave),
        attributeToSave.id
          ? `Attribute "${attributeToSave.name}" updated successfully!`
          : `Attribute "${attributeToSave.name}" added successfully!`,
        `Failed to save attribute.`
      );

      await fetchDashboardData();
      setShowAttributeForm(false);
      setEditingAttribute(null);
    } catch (err) {
      console.error("Error saving attribute:", err);
    }
  }, [userInfo, callApi, fetchDashboardData, setError]);

  // Function to handle cancelling the attribute form
  const handleCancelAttributeForm = () => {
    setShowAttributeForm(false);
    setEditingAttribute(null);
    setError('');
  };

  // Function to handle deleting attributes
  const handleDeleteAttribute = useCallback(async (attributeId) => {
    if (!window.confirm("Are you sure you want to delete this attribute? This cannot be undone.")) {
      return;
    }
    if (!userInfo || !userInfo.token) {
      setError("Authentication token missing. Please log out and log in again.");
      return;
    }
    try {
      await callApi(
        () => axiosInstance.delete(`/users/me/attributes/${attributeId}`),
        "Attribute deleted successfully!",
        "Failed to delete attribute."
      );
      await fetchDashboardData();
    } catch (err) {
      console.error("Error deleting attribute:", err);
    }
  }, [userInfo, callApi, fetchDashboardData, setError]);

  // Render loading state
  if (loading) {
    return <p>Loading your dashboard...</p>;
  }

  // Render error messages if any
  if (error) {
    return <p className="error-message">{error}</p>;
  }

  // Render content
  return (
    <div className="dashboard-container">
      <h2>Your Identity Dashboard</h2>
      {message && <p className="info-message">{message}</p>}

      <div className="dashboard-section">
        <h3>Your Contexts</h3>
        {showContextForm && (
          <ContextForm
            context={editingContext}
            onSave={handleSaveContext}
            onCancel={handleCancelContextForm}
            userId={userInfo.userId}
          />
        )}
        {!showContextForm && !showAttributeForm && (
          <>
            <ul className="item-list">
              {contexts.length > 0 ? (
                contexts.map((context) => (
                  <li key={context.id}>
                    <span>
                      <strong>{context.name}</strong>: {context.description}
                    </span>
                    <span className="item-actions">
                      <button onClick={() => handleEditContext(context.id)} className="edit-button">Edit</button>
                      <button onClick={() => handleDeleteContext(context.id)} className="delete-button">Delete</button>
                    </span>
                  </li>
                ))
              ) : (
                <p>No contexts defined yet.</p>
              )}
            </ul>
            <button onClick={handleAddContext} className="add-button">Add New Context</button>
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h3>Your Attributes</h3>
        {showAttributeForm && (
          <AttributeForm
            attribute={editingAttribute}
            onSave={handleSaveAttribute}
            onCancel={handleCancelAttributeForm}
            contexts={contexts}
          />
        )}
        {!showAttributeForm && !showContextForm && (
          <>
            <ul className="item-list">
              {attributes.length > 0 ? (
                attributes.map((attr) => (
                  <li key={attr.id}>
                    <span>
                      <strong>{attr.name}</strong>: {attr.value} (Public: {attr.public ? 'Yes' : 'No'})
                      {attr.contextIds && attr.contextIds.length > 0 && (
                        <span style={{marginLeft: '10px', fontSize: '0.9em', color: '#718096'}}>
                              (Contexts: {attr.contextIds.map(id => contexts.find(ctx => ctx.id === id)?.name || id).join(', ')})
                          </span>
                      )}
                    </span>
                    <span className="item-actions">
                      <button onClick={() => handleEditAttribute(attr.id)} className="edit-button">Edit</button>
                      <button onClick={() => handleDeleteAttribute(attr.id)} className="delete-button">Delete</button>
                    </span>
                  </li>
                ))
              ) : (
                <p>No attributes defined yet.</p>
              )}
            </ul>
            <button onClick={handleAddAttribute} className="add-button">Add New Attribute</button>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;