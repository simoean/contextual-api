import React, { useState, useEffect } from 'react';

function ContextForm({ context, onSave, onCancel, userId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form fields if editing an existing context
  useEffect(() => {
    if (context) {
      setName(context.name);
      setDescription(context.description);
    } else {
      // Clear form if adding new
      setName('');
      setDescription('');
    }
    setErrorMessage(''); // Clear errors on context change
  }, [context]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Context name cannot be empty.");
      return;
    }

    // Construct the context object to be saved
    const contextToSave = {
      id: context ? context.id : null, // Use existing ID if editing, otherwise null for new
      userId: userId, // Pass userId for consistency, though backend will get from auth
      name: name.trim(),
      description: description.trim(),
    };

    onSave(contextToSave); // Call the parent's save handler
  };

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