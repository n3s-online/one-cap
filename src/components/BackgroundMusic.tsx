import React, { useState, useEffect, useRef } from "react";

interface BackgroundMusicProps {
  audioSrc?: string;
  initialVolume?: number;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  audioSrc,
  initialVolume = 0.3,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [showInteractionMessage, setShowInteractionMessage] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element only once
  useEffect(() => {
    console.log("Initializing audio");

    // Try to use the preloaded audio element from HTML
    const preloadedAudio = document.getElementById(
      "background-music"
    ) as HTMLAudioElement;

    if (preloadedAudio) {
      console.log("Using preloaded audio element");
      preloadedAudio.volume = volume;
      audioRef.current = preloadedAudio;

      // Add event listeners to track audio state
      preloadedAudio.addEventListener("canplaythrough", () => {
        console.log("Audio can play through");
        setAudioLoaded(true);
      });

      preloadedAudio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
      });

      // Check if already loaded
      if (preloadedAudio.readyState >= 3) {
        console.log("Audio already loaded");
        setAudioLoaded(true);
      }
    } else if (audioSrc) {
      // Fallback to creating a new audio element
      console.log("Creating new audio element with source:", audioSrc);
      const audio = new Audio(audioSrc);
      audio.loop = true;
      audio.volume = volume;

      // Add event listeners to track audio state
      audio.addEventListener("canplaythrough", () => {
        console.log("Audio can play through");
        setAudioLoaded(true);
      });

      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
      });

      audioRef.current = audio;
    }

    // Show play prompt after a delay if music hasn't started
    const promptTimer = setTimeout(() => {
      if (!isPlaying && audioLoaded) {
        setShowPlayPrompt(true);
      }
    }, 5000);

    return () => {
      // Clean up
      clearTimeout(promptTimer);
      if (
        audioRef.current &&
        audioRef.current !== document.getElementById("background-music")
      ) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle user interaction for autoplay
  useEffect(() => {
    const handleFirstInteraction = () => {
      console.log("User interaction detected");
      if (audioRef.current && !isPlaying) {
        console.log("Attempting to play audio after user interaction");
        audioRef.current
          .play()
          .then(() => {
            console.log("Audio playing successfully");
            setIsPlaying(true);
            setShowInteractionMessage(false);
            setShowPlayPrompt(false);
          })
          .catch((error) => {
            console.error("Audio playback failed after interaction:", error);
            // Show play prompt if autoplay fails
            setShowPlayPrompt(true);
          });
      }

      // We keep the listeners to allow for retrying if the first attempt fails
      if (isPlaying) {
        document.removeEventListener("click", handleFirstInteraction);
        document.removeEventListener("touchstart", handleFirstInteraction);
      }
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    console.log("Toggle play button clicked, current state:", isPlaying);
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log("Attempting to play audio from button click");
        audioRef.current
          .play()
          .then(() => {
            console.log("Audio playing successfully from button");
            setIsPlaying(true);
            setShowInteractionMessage(false);
            setShowPlayPrompt(false);
          })
          .catch((error) => {
            console.error("Audio playback failed from button:", error);
          });
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="background-music-container">
      {showInteractionMessage && (
        <div className="music-interaction-message">
          Click anywhere to enable lofi music
        </div>
      )}

      {showPlayPrompt && (
        <button onClick={togglePlay} className="music-play-prompt">
          🎵 Play Lofi Music
        </button>
      )}

      <div className="background-music-controls">
        <button
          onClick={togglePlay}
          className="music-toggle-btn"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? "🔊" : "🔈"}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume control"
        />
      </div>
    </div>
  );
};

export default BackgroundMusic;
