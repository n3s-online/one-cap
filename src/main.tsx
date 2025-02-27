import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import "./style.css";
import BaseballCap from "./components/BaseballCap";
import {
  capsAtom,
  getAllCapsAtom,
  getSelectedCapAtom,
  addCapAtom,
  removeCapAtom,
} from "./atoms/capsAtoms";

const App: React.FC = () => {
  const selectedCap = useAtomValue(getSelectedCapAtom);
  const allCaps = useAtomValue(getAllCapsAtom);
  const [capsState, setCapsState] = useAtom(capsAtom);
  const addCap = useSetAtom(addCapAtom);
  const removeCap = useSetAtom(removeCapAtom);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [newCap, setNewCap] = useState({
    name: "",
    letter: "",
    color: "#000000",
    letterColor: "#ffffff",
  });

  // Check if there's only one cap left
  const isLastCap = Object.keys(capsState.caps).length <= 1;

  const handleCapSelect = (capId: string) => {
    setCapsState({
      ...capsState,
      selectedCapId: capId,
    });
  };

  const handleAddCapClick = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate a unique ID
    const newId = Date.now().toString();

    // Add the new cap
    addCap({
      id: newId,
      ...newCap,
    });

    // Reset form and hide it
    setNewCap({
      name: "",
      letter: "",
      color: "#000000",
      letterColor: "#ffffff",
    });
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setNewCap({
      name: "",
      letter: "",
      color: "#000000",
      letterColor: "#ffffff",
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, capId: string) => {
    e.stopPropagation(); // Prevent cap selection when clicking delete
    setShowDeleteConfirm(capId);
  };

  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      // If this is the last cap, don't allow deletion
      if (isLastCap) {
        alert("Cannot delete the last cap. At least one cap must remain.");
        setShowDeleteConfirm(null);
        return;
      }

      // If deleting the currently selected cap, select another one first
      if (showDeleteConfirm === capsState.selectedCapId) {
        const remainingCaps = Object.keys(capsState.caps).filter(
          (id) => id !== showDeleteConfirm
        );
        if (remainingCaps.length > 0) {
          setCapsState({
            ...capsState,
            selectedCapId: remainingCaps[0],
          });
        }
      }

      // Remove the cap
      removeCap(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="app-container">
      <div className="cap-display">
        <BaseballCap
          color={selectedCap.color}
          letter={selectedCap.letter}
          letterColor={selectedCap.letterColor}
        />
      </div>

      <div className="caps-grid">
        {allCaps.map((cap) => (
          <button
            key={cap.id}
            className={`cap-button ${
              cap.id === capsState.selectedCapId ? "selected" : ""
            }`}
            onClick={() => handleCapSelect(cap.id)}
            style={{ backgroundColor: cap.color }}
          >
            <span className="cap-letter" style={{ color: cap.letterColor }}>
              {cap.letter}
            </span>
            <span className="cap-name">{cap.name}</span>
            {/* Only show delete button on selected cap and when there's more than one cap */}
            {cap.id === capsState.selectedCapId && !isLastCap && (
              <button
                className="delete-button"
                onClick={(e) => handleDeleteClick(e, cap.id)}
                aria-label={`Delete ${cap.name}`}
              >
                ×
              </button>
            )}
          </button>
        ))}

        {/* Add new cap button */}
        <button
          className="cap-button add-cap-button"
          onClick={handleAddCapClick}
        >
          <span className="cap-letter">+</span>
          <span className="cap-name">Add Cap</span>
        </button>
      </div>

      {/* New Cap Form */}
      {showForm && (
        <div className="cap-form-overlay">
          <div className="cap-form-container">
            <h2>Add New Cap</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="capName">Cap Name:</label>
                <input
                  type="text"
                  id="capName"
                  value={newCap.name}
                  onChange={(e) =>
                    setNewCap({ ...newCap, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="capLetter">Letter:</label>
                <input
                  type="text"
                  id="capLetter"
                  value={newCap.letter}
                  onChange={(e) =>
                    setNewCap({
                      ...newCap,
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
                  value={newCap.color}
                  onChange={(e) =>
                    setNewCap({ ...newCap, color: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="letterColor">Letter Color:</label>
                <input
                  type="color"
                  id="letterColor"
                  value={newCap.letterColor}
                  onChange={(e) =>
                    setNewCap({ ...newCap, letterColor: e.target.value })
                  }
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleFormCancel}>
                  Cancel
                </button>
                <button type="submit">Add Cap</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="cap-form-overlay">
          <div className="cap-form-container delete-confirm">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this cap?</p>
            <div className="form-actions">
              <button type="button" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-button"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
