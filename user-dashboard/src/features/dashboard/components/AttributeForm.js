import React, { useState, useEffect } from 'react';

/**
 * AttributeForm component for adding or editing attributes.
 * This component allows users to create or modify attributes with fields for name, value,
 * public visibility, and associated contexts.
 *
 * @param attribute - The attribute object to edit, or null for a new attribute.
 * @param onSave - Callback function to handle saving the attribute.
 * @param onCancel - Callback function to handle canceling the form.
 * @param contexts - Array of context objects to select from, each with an id and name.
 * @returns {JSX.Element}
 */
function AttributeForm({ attribute, onSave, onCancel, contexts }) {

  // State to manage form fields and error messages
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(true);
  const [selectedContextIds, setSelectedContextIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Effect to populate form fields when editing an existing attribute.
   */
  useEffect(() => {
    if (attribute) {
      setName(attribute.name);
      setValue(attribute.value);
      setVisible(attribute.visible);
      setSelectedContextIds(attribute.contextIds || []);
    } else {
      // Clear form if adding new
      setName('');
      setValue('');
      setVisible(false);
      setSelectedContextIds([]);
    }
    setErrorMessage('');
  }, [attribute]);

  /**
   * Handle context checkbox change
   * This function updates the selected context IDs when a checkbox is toggled.
   *
   * @param contextId
   */
  const handleContextCheckboxChange = (contextId) => {
    setSelectedContextIds((prevSelected) => {
      if (prevSelected.includes(contextId)) {
        return prevSelected.filter((id) => id !== contextId);
      } else {
        return [...prevSelected, contextId];
      }
    });
  };

  /**
   * Handle form submission
   * This function validates the input and constructs the attribute object to be saved.
   *
   * @param event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !value.trim()) {
      setErrorMessage("Attribute name and value cannot be empty.");
      return;
    }

    const attributeToSave = {
      id: attribute ? attribute.id : null,
      name: name.trim(),
      value: value.trim(),
      visible: visible,
      contextIds: selectedContextIds
    };

    onSave(attributeToSave);
  };

  /**
   * Render the attribute form
   */
  return (
    <div className="dashboard-form-container">
      <h4>{attribute ? 'Edit Attribute' : 'Add New Attribute'}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="attributeName">Name:</label>
          <input
            type="text"
            id="attributeName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="attributeValue">Value:</label>
          <input
            type="text"
            id="attributeValue"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            type="checkbox"
            id="visible"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor="visible" style={{ display: 'inline-block', marginLeft: '8px' }}>Is Visible</label>
        </div>

        {/* Contexts Selection */}
        {contexts && contexts.length > 0 && (
          <div className="form-group">
            <label>Belongs to Contexts:</label>
            <div className="context-checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {contexts.map((ctx) => (
                <span key={ctx.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f4f8', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                  <input
                    type="checkbox"
                    id={`ctx-${ctx.id}`}
                    value={ctx.id}
                    checked={selectedContextIds.includes(ctx.id)}
                    onChange={() => handleContextCheckboxChange(ctx.id)}
                    className="form-checkbox"
                  />
                  <label htmlFor={`ctx-${ctx.id}`} style={{ display: 'inline', marginLeft: '5px', fontWeight: 'normal', color: '#4a5568' }}>
                    {ctx.name}
                  </label>
                </span>
              ))}
            </div>
          </div>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="form-actions">
          <button type="submit" className="add-button">Save</button>
          <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default AttributeForm;