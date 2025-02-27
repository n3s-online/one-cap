import React from "react";

interface DeleteCapButtonProps {
  capId: string;
  onDeleteClick: (e: React.MouseEvent, capId: string) => void;
}

const DeleteCapButton: React.FC<DeleteCapButtonProps> = ({
  capId,
  onDeleteClick,
}) => {
  return (
    <button
      className="delete-button"
      onClick={(e) => onDeleteClick(e, capId)}
      aria-label="Delete cap"
    >
      ×
    </button>
  );
};

export default DeleteCapButton;
