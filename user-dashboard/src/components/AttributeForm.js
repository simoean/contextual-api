import React, { useState, useEffect } from 'react';

function AttributeForm({ attribute, onSave, onCancel, contexts }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedContextIds, setSelectedContextIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form fields if editing an existing attribute
  useEffect(() => {
    if (attribute) {
      setName(attribute.name);
      setValue(attribute.value);
      setIsPublic(attribute.public); // Note: JSON uses 'public', Java uses 'isPublic'
      setSelectedContextIds(attribute.contextIds || []); // Initialize with existing context IDs
    } else {
      // Clear form if adding new
      setName('');
      setValue('');
      setIsPublic(false);
      setSelectedContextIds([]);
    }
    setErrorMessage('');
  }, [attribute]);

  const handleContextCheckboxChange = (contextId) => {
    setSelectedContextIds((prevSelected) => {
      if (prevSelected.includes(contextId)) {
        return prevSelected.filter((id) => id !== contextId); // Remove if already selected
      } else {
        return [...prevSelected, contextId]; // Add if not selected
      }
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !value.trim()) {
      setErrorMessage("Attribute name and value cannot be empty.");
      return;
    }

    const attributeToSave = {
      id: attribute ? attribute.id : null, // Use existing ID if editing
      name: name.trim(),
      value: value.trim(),
      public: isPublic, // Ensure 'public' field name matches JSON/backend
      contextIds: selectedContextIds, // Send the array of selected context IDs
    };

    onSave(attributeToSave);
  };

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
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor="isPublic" style={{ display: 'inline-block', marginLeft: '8px' }}>Is Public</label>
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