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
} from "./atoms/capsAtoms";

const App: React.FC = () => {
  const selectedCap = useAtomValue(getSelectedCapAtom);
  const allCaps = useAtomValue(getAllCapsAtom);
  const [capsState, setCapsState] = useAtom(capsAtom);
  const addCap = useSetAtom(addCapAtom);
  const [showForm, setShowForm] = useState(false);
  const [newCap, setNewCap] = useState({
    name: "",
    letter: "",
    color: "#000000",
    letterColor: "#ffffff",
  });

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
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
