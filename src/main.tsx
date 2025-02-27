import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import "./style.css";
import BaseballCap from "./components/BaseballCap";
import DeleteCapButton from "./components/DeleteCapButton";
import DeleteCapModal from "./components/DeleteCapModal";
import AddCapButton from "./components/AddCapButton";
import AddCapForm from "./components/AddCapForm";
import FeedbackButton from "./components/FeedbackButton";
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
  // Add a loading state to handle initial data loading
  const [isLoading, setIsLoading] = useState(true);

  // Check if there's only one cap left
  const isLastCap = Object.keys(capsState.caps).length <= 1;

  // Effect to handle initial loading
  useEffect(() => {
    // Set loading to false after a short delay to ensure localStorage data is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleCapSelect = (capId: string) => {
    setCapsState({
      ...capsState,
      selectedCapId: capId,
    });
  };

  const handleAddCapClick = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (capData: {
    name: string;
    letter: string;
    color: string;
    letterColor: string;
  }) => {
    // Generate a unique ID
    const newId = Date.now().toString();

    // Add the new cap
    addCap({
      id: newId,
      ...capData,
    });

    // Hide the form
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
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
      {/* Feedback Button */}
      <FeedbackButton />

      {/* Cap name text */}
      {!isLoading && selectedCap && (
        <div className="cap-title-text" style={{ color: selectedCap.color }}>
          right now i am wearing my{" "}
          <span className="cap-name-highlight">{selectedCap.name}</span> cap
        </div>
      )}

      <div className="cap-display">
        {!isLoading && selectedCap && (
          <BaseballCap
            color={selectedCap.color}
            letter={selectedCap.letter}
            letterColor={selectedCap.letterColor}
          />
        )}
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
              <DeleteCapButton
                capId={cap.id}
                onDeleteClick={handleDeleteClick}
              />
            )}
          </button>
        ))}

        {/* Add new cap button */}
        <AddCapButton onClick={handleAddCapClick} />

        {/* More Projects button styled like a cap button */}
        <a
          href="https://willness.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="cap-button more-projects-cap"
        >
          <span className="cap-letter">👨‍💻</span>
          <span className="cap-name">More Projects</span>
        </a>
      </div>

      {/* New Cap Form */}
      <AddCapForm
        isOpen={showForm}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCapModal
        isOpen={showDeleteConfirm !== null}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
