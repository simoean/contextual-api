import React, {useEffect, useState, useCallback} from 'react';

import { useAuth } from '../../auth/context/AuthContext';
import { useIdentityStore } from "../store/identityStore";

import ContextForm from '../components/ContextForm';
import AttributeForm from '../components/AttributeForm';

import 'assets/styles/App-dashboard.css';

/**
 * Dashboard Page
 * This component renders the user's dashboard, displaying their contexts and attributes.
 *
 * @returns {JSX.Element}
 * @constructor
 */
const DashboardPage = () => {

  // State to manage authentication context
  const { userInfo, isAuthenticated, isLoading: authLoading, handleLogout } = useAuth();

  // State to manage identities
  const {
    contexts,
    attributes,
    isLoading: dataLoading,
    error: storeError,
    message: storeMessage,
    fetchIdentityData,
    addContext, updateContext, deleteContext,
    addAttribute, updateAttribute, deleteAttribute,
    clearError, clearMessage
  } = useIdentityStore();

  // State for Context editing
  const [showContextForm, setShowContextForm] = useState(false);
  const [editingContext, setEditingContext] = useState(null);

  // State for Attribute editing
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);

  // Fetch dashboard data when userInfo is available or authentication state changes
  useEffect(() => {
    if (!authLoading && isAuthenticated && userInfo?.token) {
      fetchIdentityData(userInfo); // Pass userInfo to the store action
    }
  }, [userInfo, isAuthenticated, authLoading, fetchIdentityData]);

  // Context handlers
  /**
   * Function to show the context form for adding a new context.
   *
   * @type {(function(): void)|*}
   */
  const handleAddContext = useCallback(() => {
    setEditingContext(null);
    setShowContextForm(true);
    setShowAttributeForm(false);
    clearError();
  }, [clearError]);

  /**
   * Function to show the context form for editing an existing context.
   *
   * @type {(function(*): void)|*}
   */
  const handleEditContext = useCallback((contextId) => {
    const contextToEdit = contexts.find(ctx => ctx.id === contextId);
    if (contextToEdit) {
      setEditingContext(contextToEdit);
      setShowContextForm(true);
      setShowAttributeForm(false);
      clearError();
    } else {
      // You could still use local error state for UI feedback if needed,
      // or set a temporary message here if store handles general errors.
      // For now, let the store handle API errors
    }
  }, [contexts, clearError]);

  /**
   * Function to handle cancelling the context form.
   *
   * @type {(function(): void)|*}
   */
  const handleCancelContextForm = useCallback(() => {
    setShowContextForm(false);
    setEditingContext(null);
    clearError();
  }, [clearError]);

  /**
   * Function to handle saving contexts (both add and edit).
   *
   * @type {(function(*): Promise<void>)|*}
   */
  const handleSaveContext = useCallback(async (contextToSave) => {
    try {
      await (editingContext ? updateContext(contextToSave, userInfo) : addContext(contextToSave, userInfo));
      setShowContextForm(false);
      setEditingContext(null);
    } catch (err) {
      console.error("Error saving context via store:", err);
    }
  }, [editingContext, addContext, updateContext, userInfo]);

  /**
   * Function to handle deleting contexts.
   *
   * @type {(function(*): Promise<void>)|*}
   */
  const handleDeleteContext = useCallback(async (contextId) => {
    try {
      await deleteContext(contextId, userInfo); // Pass userInfo
    } catch (err) {
      console.error("Error deleting context via store:", err);
    }
  }, [deleteContext, userInfo]);

  // Attribute handlers
  /**
   * Function to show the attribute form for adding a new attribute.
   *
   * @type {(function(): void)|*}
   */
  const handleAddAttribute = useCallback(() => {
    setEditingAttribute(null);
    setShowAttributeForm(true);
    setShowContextForm(false);
    clearError();
  }, [clearError]);

  /**
   * Function to show the attribute form for editing an existing attribute.
   *
   * @type {(function(*): void)|*}
   */
  const handleEditAttribute = useCallback((attributeId) => {
    const attributeToEdit = attributes.find(attr => attr.id === attributeId);
    if (attributeToEdit) {
      setEditingAttribute(attributeToEdit);
      setShowAttributeForm(true);
      setShowContextForm(false);
      clearError();
    } else {
      // Similar to contexts, let store handle errors
    }
  }, [attributes, clearError]);

  /**
   * Function to handle cancelling the attribute form.
   *
   * @type {(function(): void)|*}
   */
  const handleCancelAttributeForm = useCallback(() => {
    setShowAttributeForm(false);
    setEditingAttribute(null);
    clearError();
  }, [clearError]);

  /**
   * Function to handle cancelling the attribute form.
   *
   * @type {(function(*): Promise<void>)|*}
   */
  const handleSaveAttribute = useCallback(async (attributeToSave) => {
    try {
      await (editingAttribute ? updateAttribute(attributeToSave, userInfo) : addAttribute(attributeToSave, userInfo));
      setShowAttributeForm(false);
      setEditingAttribute(null);
    } catch (err) {
      console.error("Error saving attribute via store:", err);
    }
  }, [editingAttribute, addAttribute, updateAttribute, userInfo]);

  /**
   * Function to handle deleting attributes.
   *
   * @type {(function(*): Promise<void>)|*}
   */
  const handleDeleteAttribute = useCallback(async (attributeId) => {
    try {
      await deleteAttribute(attributeId, userInfo);
    } catch (err) {
      console.error("Error deleting attribute via store:", err);
    }
  }, [deleteAttribute, userInfo]);

  // If the authentication is still loading, show a loading message
  if (authLoading) {
    return <p>Authenticating dashboard...</p>;
  }

  // If not authenticated or userInfo is missing, show an error message
  if (!isAuthenticated || !userInfo?.token) {
    return <p className="error-message">Authentication required. Please log in.</p>;
  }

  // If data is still loading, show a loading message
  if (dataLoading) {
    return <p>Loading your dashboard data...</p>;
  }

  // If there's an error in the store, show the error message
  if (storeError) {
    return (
      <div className="error-message">
        <p>{storeError}</p>
        <button onClick={clearError}>Clear Error</button>
      </div>
    );
  }

  // Render content
  return (
    <div className="dashboard-container">
      <h2>Your Identity Dashboard</h2>
      {storeMessage && (
        <p className="info-message">
          {storeMessage}
          <button onClick={clearMessage}>Clear Message</button>
        </p>
      )}

      <button onClick={handleLogout} className="logout-button">Logout</button>

      <div className="dashboard-section">
        <h3>Your Contexts</h3>
        {showContextForm && (
          <ContextForm
            context={editingContext}
            onSave={handleSaveContext}
            onCancel={handleCancelContextForm}
            userId={userInfo?.userId}
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
                      <strong>{attr.name}</strong>: {attr.value} (Visible: {attr.visible ? 'Yes' : 'No'})
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