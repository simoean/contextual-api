import React, { useState, useEffect } from 'react';

/**
 * ContextForm component for adding or editing contexts.
 * This component allows users to create or modify contexts with fields for name and description.
 *
 * @param context - The context object to edit, or null for a new context.
 * @param onSave - Callback function to handle saving the context.
 * @param onCancel - Callback function to handle canceling the form.
 * @param userId - The ID of the user, used for consistency with backend expectations.
 * @returns {JSX.Element}
 */
function ContextForm({ context, onSave, onCancel, userId }) {

  // State to manage form fields and error messages
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Effect to populate form fields when editing an existing context.
   */
  useEffect(() => {
    if (context) {
      setName(context.name);
      setDescription(context.description);
    } else {
      // Clear form if adding new
      setName('');
      setDescription('');
    }
    setErrorMessage('');
  }, [context]);

  /**
   * Handle form submission
   * This function validates the input and constructs the context object to be saved.
   *
   * @param event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Context name cannot be empty.");
      return;
    }

    // Construct the context object to be saved
    const contextToSave = {
      id: context ? context.id : null,
      userId: userId,
      name: name.trim(),
      description: description.trim(),
    };

    onSave(contextToSave);
  };

  /**
   * Render the form for adding or editing a context.
   */
  return (
    <div className="dashboard-form-container">
      <h4>{context ? 'Edit Context' : 'Add New Context'}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contextName">Name:</label>
          <input
            type="text"
            id="contextName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contextDescription">Description:</label>
          <textarea
            id="contextDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="form-input"
          ></textarea>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="form-actions">
          <button type="submit" className="add-button">Save</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default ContextForm;