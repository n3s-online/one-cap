import React from "react";

const FeedbackButton: React.FC = () => {
  return (
    <a
      href="https://insigh.to/b/one-cap"
      target="_blank"
      rel="noopener noreferrer"
      className="feedback-button"
    >
      <span className="feedback-icon">👍</span>
      <span className="feedback-text">Feedback</span>
    </a>
  );
};

export default FeedbackButton;
