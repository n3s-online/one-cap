import React, { useState } from "react";

interface CapFormData {
  name: string;
  letter: string;
  color: string;
  letterColor: string;
}

interface AddCapFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (capData: CapFormData) => void;
  initialData?: CapFormData;
}

const AddCapForm: React.FC<AddCapFormProps> = ({
  isOpen,
  onCancel,
  onSubmit,
  initialData = {
    name: "",
    letter: "",
    color: "#000000",
    letterColor: "#ffffff",
  },
}) => {
  const [formData, setFormData] = useState<CapFormData>(initialData);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="cap-form-overlay">
      <div className="cap-form-container">
        <h2>Add New Cap</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="capName">Cap Name:</label>
            <input
              type="text"
              id="capName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="capLetter">Letter:</label>
            <input
              type="text"
              id="capLetter"
              value={formData.letter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  letter: e.target.value.charAt(0).toUpperCase(),
                })
              }
              maxLength={1}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="capColor">Cap Color:</label>
            <input
              type="color"
              id="capColor"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="letterColor">Letter Color:</label>
            <input
              type="color"
              id="letterColor"
              value={formData.letterColor}
              onChange={(e) =>
                setFormData({ ...formData, letterColor: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit">Add Cap</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCapForm;
