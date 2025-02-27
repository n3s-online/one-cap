import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import BaseballCap from "./components/BaseballCap";

interface AppProps {
  title: string;
}

const App: React.FC<AppProps> = ({ title }) => {
  return (
    <div className="app">
      <h1>{title}</h1>
      <div className="cap-container">
        <div className="cap-wrapper">
          <BaseballCap color="blue" letter="A" letterColor="black" />
        </div>
        <div className="cap-wrapper">
          <BaseballCap color="red" letter="B" letterColor="white" />
        </div>
      </div>
    </div>
  );
};

// React 18 way of rendering
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App title="Baseball Cap Showcase" />);
}
