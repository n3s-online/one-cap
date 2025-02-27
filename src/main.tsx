import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import BaseballCap from "./components/BaseballCap";

const App: React.FC = () => {
  return (
    <div className="app-fullscreen">
      <BaseballCap color="#0066ff" letter="A" letterColor="white" />
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
