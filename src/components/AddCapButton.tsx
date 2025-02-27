import React from "react";

interface AddCapButtonProps {
  onClick: () => void;
}

const AddCapButton: React.FC<AddCapButtonProps> = ({ onClick }) => {
  return (
    <button className="cap-button add-cap-button" onClick={onClick}>
      <span className="cap-letter">+</span>
      <span className="cap-name">Add Cap</span>
    </button>
  );
};

export default AddCapButton;
