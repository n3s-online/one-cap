import "./style.css";
import { BaseballCap } from "./components/BaseballCap";

console.log("Starting application..."); // Debug log

// Initialize the baseball cap
const baseballCap = new BaseballCap();

// Handle user input
const letterInput = document.getElementById("letterInput");
const colorInput = document.getElementById("colorInput");
const capColorInput = document.getElementById("capColorInput");

function updateText() {
  const letter = letterInput.value.toUpperCase();
  const color = colorInput.value;
  if (letter) {
    baseballCap.createText(letter, color);
  }
}

letterInput.addEventListener("input", updateText);
colorInput.addEventListener("input", updateText);
capColorInput.addEventListener("input", (e) => {
  baseballCap.setCapColor(e.target.value);
});

// Initial text
baseballCap.createText("A", "#ffffff");

console.log("Application initialized"); // Debug log
