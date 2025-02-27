import React from "react";

interface DeleteCapModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteCapModal: React.FC<DeleteCapModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="cap-form-overlay">
      <div className="cap-form-container delete-confirm">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this cap?</p>
        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="delete-confirm-button"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCapModal;
