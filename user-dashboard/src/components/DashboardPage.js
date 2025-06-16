import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ContextForm from './ContextForm';
import AttributeForm from './AttributeForm'; // Import the new AttributeForm

function DashboardPage({ userInfo }) {
  const [contexts, setContexts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // State for Context editing
  const [showContextForm, setShowContextForm] = useState(false);
  const [editingContext, setEditingContext] = useState(null);

  // State for Attribute editing
  const [showAttributeForm, setShowAttributeForm] = useState(false); // New state
  const [editingAttribute, setEditingAttribute] = useState(null); // New state


  const getAuthHeader = () => {
    const base64Credentials = btoa(`${userInfo.username}:password`);
    return {
      'Authorization': `Basic ${base64Credentials}`
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (!userInfo || !userInfo.username || !userInfo.userId) {
        setError("User information missing to fetch data.");
        setLoading(false);
        return;
      }

      const contextsResponse = await axios.get(
        'http://localhost:8080/api/users/me/contexts',
        { headers: getAuthHeader() }
      );
      setContexts(contextsResponse.data);

      const attributesResponse = await axios.get(
        'http://localhost:8080/api/users/me/attributes',
        { headers: getAuthHeader() }
      );
      setAttributes(attributesResponse.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setContexts([]);
      setAttributes([]);
      if (err.response && err.response.status === 401) {
        setError('Session expired or unauthorized. Please log out and log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo && userInfo.username && userInfo.userId) {
      fetchDashboardData();
    }
  }, [userInfo]);

  // --- Context CRUD Handlers ---
  const handleAddContext = () => {
    setEditingContext(null);
    setShowContextForm(true);
    setShowAttributeForm(false); // Hide attribute form if active
  };

  const handleEditContext = (contextId) => {
    const contextToEdit = contexts.find(ctx => ctx.id === contextId);
    if (contextToEdit) {
      setEditingContext(contextToEdit);
      setShowContextForm(true);
      setShowAttributeForm(false); // Hide attribute form if active
    } else {
      setError("Context not found for editing.");
    }
  };

  const handleSaveContext = async (contextToSave) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      let response;
      if (contextToSave.id) {
        response = await axios.put(
          `http://localhost:8080/api/users/me/contexts/${contextToSave.id}`,
          contextToSave,
          { headers: getAuthHeader() }
        );
        setMessage(`Context "${response.data.name}" updated successfully!`);
      } else {
        response = await axios.post(
          'http://localhost:8080/api/users/me/contexts',
          contextToSave,
          { headers: getAuthHeader() }
        );
        setMessage(`Context "${response.data.name}" added successfully!`);
      }

      fetchDashboardData();
      setShowContextForm(false);
      setEditingContext(null);

    } catch (err) {
      console.error('Error saving context:', err);
      setError(`Failed to save context: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContextForm = () => {
    setShowContextForm(false);
    setEditingContext(null);
    setError('');
  };

  const handleDeleteContext = async (contextId) => {
    if (!window.confirm("Are you sure you want to delete this context? This cannot be undone and will remove context references from attributes.")) {
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.delete(
        `http://localhost:8080/api/users/me/contexts/${contextId}`,
        { headers: getAuthHeader() }
      );
      setMessage("Context deleted successfully!");
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting context:', err);
      setError(`Failed to delete context: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Attribute CRUD Handlers ---
  const handleAddAttribute = () => {
    setEditingAttribute(null); // Clear existing attribute data for "Add" mode
    setShowAttributeForm(true);
    setShowContextForm(false); // Hide context form if active
  };

  const handleEditAttribute = (attributeId) => {
    const attributeToEdit = attributes.find(attr => attr.id === attributeId);
    if (attributeToEdit) {
      setEditingAttribute(attributeToEdit);
      setShowAttributeForm(true);
      setShowContextForm(false); // Hide context form if active
    } else {
      setError("Attribute not found for editing.");
    }
  };

  const handleSaveAttribute = async (attributeToSave) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      let response;
      if (attributeToSave.id) { // Existing attribute, so PUT (update)
        response = await axios.put(
          `http://localhost:8080/api/users/me/attributes/${attributeToSave.id}`,
          attributeToSave,
          { headers: getAuthHeader() }
        );
        setMessage(`Attribute "${response.data.name}" updated successfully!`);
      } else { // New attribute, so POST (add)
        response = await axios.post(
          'http://localhost:8080/api/users/me/attributes',
          attributeToSave,
          { headers: getAuthHeader() }
        );
        setMessage(`Attribute "${response.data.name}" added successfully!`);
      }

      fetchDashboardData(); // Refresh the list after save
      setShowAttributeForm(false); // Hide the form
      setEditingAttribute(null); // Clear editing state

    } catch (err) {
      console.error('Error saving attribute:', err);
      setError(`Failed to save attribute: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAttributeForm = () => {
    setShowAttributeForm(false);
    setEditingAttribute(null);
    setError('');
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (!window.confirm("Are you sure you want to delete this attribute? This cannot be undone.")) {
      return; // User cancelled
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.delete(
        `http://localhost:8080/api/users/me/attributes/${attributeId}`,
        { headers: getAuthHeader() }
      );
      setMessage("Attribute deleted successfully!");
      fetchDashboardData(); // Refresh attributes after deletion
    } catch (err) {
      console.error('Error deleting attribute:', err);
      setError(`Failed to delete attribute: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <p>Loading your dashboard...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

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
        {!showContextForm && !showAttributeForm && ( // Only show list if no form is active
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
        {showAttributeForm && ( // Show attribute form
          <AttributeForm
            attribute={editingAttribute}
            onSave={handleSaveAttribute}
            onCancel={handleCancelAttributeForm}
            contexts={contexts} // Pass contexts for selection
          />
        )}
        {!showAttributeForm && !showContextForm && ( // Only show list if no form is active
          <>
            <ul className="item-list">
              {attributes.length > 0 ? (
                attributes.map((attr) => (
                  <li key={attr.id}>
                    <span>
                      <strong>{attr.name}</strong>: {attr.value} (Public: {attr.public ? 'Yes' : 'No'})
                      {attr.contextIds && attr.contextIds.length > 0 && (
                        <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#718096' }}>
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