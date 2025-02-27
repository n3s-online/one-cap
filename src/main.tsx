import React from "react";
import { createRoot } from "react-dom/client";
import { useAtom, useAtomValue } from "jotai";
import "./style.css";
import BaseballCap from "./components/BaseballCap";
import {
  capsAtom,
  getAllCapsAtom,
  getSelectedCapAtom,
} from "./atoms/capsAtoms";

const App: React.FC = () => {
  const selectedCap = useAtomValue(getSelectedCapAtom);
  const allCaps = useAtomValue(getAllCapsAtom);
  const [capsState, setCapsState] = useAtom(capsAtom);

  const handleCapSelect = (capId: string) => {
    setCapsState({
      ...capsState,
      selectedCapId: capId,
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
      </div>
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
