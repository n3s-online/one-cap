import React, { useState, useEffect, useRef } from "react";

interface BackgroundMusicProps {
  audioSrc?: string;
  initialVolume?: number;
}

// List of available lofi songs
const LOFI_SONGS = [
  "./audio/lofi/lofi-background.mp3",
  "./audio/lofi/good-night-lofi-cozy-chill-music-160166.mp3",
  "./audio/lofi/lofi-piano-beat-305563.mp3",
];

// Shuffle array function
const shuffleArray = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  audioSrc,
  initialVolume = 0.3,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [showInteractionMessage, setShowInteractionMessage] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playStateRef = useRef(false); // Reference to track play state across effects
  const userInteractedRef = useRef(false); // Track if user has already interacted
  const isChangingSongRef = useRef(false); // Track if we're in the process of changing songs

  // Initialize playlist on component mount
  useEffect(() => {
    // Create randomized playlist
    const randomizedPlaylist = shuffleArray(LOFI_SONGS);
    setPlaylist(randomizedPlaylist);

    console.log("Initialized randomized playlist:", randomizedPlaylist);
  }, []);

  // Extract song title from file path - kept for utility but not used for display
  const getSongTitle = (path: string): string => {
    // Extract filename without extension
    const filename = path.split("/").pop() || "";
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");

    // Convert to title case with spaces
    return nameWithoutExtension
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Initialize audio element only once
  useEffect(() => {
    if (playlist.length === 0) return;

    console.log("Initializing audio player");

    // Create audio element
    const audio = new Audio(playlist[currentSongIndex]);
    audio.volume = volume;
    audioRef.current = audio;

    // Add event listeners to track audio state
    audio.addEventListener("canplaythrough", () => {
      console.log("Audio can play through");
      setAudioLoaded(true);
    });

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
    });

    // Handle song ending - play next song in playlist
    const handleSongEnd = () => {
      console.log("Song ended, playing next song");
      playNextSong();
    };

    audio.addEventListener("ended", handleSongEnd);

    // Show play prompt after a delay if music hasn't started
    const promptTimer = setTimeout(() => {
      if (!playStateRef.current && audioLoaded) {
        setShowPlayPrompt(true);
      }
    }, 5000);

    return () => {
      // Clean up
      clearTimeout(promptTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("ended", handleSongEnd);
        audioRef.current = null;
      }
    };
  }, [playlist, currentSongIndex]);

  // Update playStateRef when isPlaying changes
  useEffect(() => {
    playStateRef.current = isPlaying;
  }, [isPlaying]);

  // Play the next song in the playlist
  const playNextSong = () => {
    if (playlist.length === 0 || isChangingSongRef.current) return;

    // Set flag to prevent multiple rapid changes
    isChangingSongRef.current = true;

    // Calculate next song index (loop back to beginning if at end)
    const nextIndex = (currentSongIndex + 1) % playlist.length;

    console.log(`Changing to next song: ${nextIndex} of ${playlist.length}`);

    // If currently playing, pause first to avoid AbortError
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }

    // Update current song index
    setCurrentSongIndex(nextIndex);

    // Load and play the next song with a small delay to ensure proper state update
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = playlist[nextIndex];

        if (isPlaying) {
          audioRef.current
            .play()
            .then(() => {
              console.log("Next song playing successfully");
              isChangingSongRef.current = false;
            })
            .catch((error) => {
              console.error("Failed to play next song:", error);
              isChangingSongRef.current = false;
            });
        } else {
          isChangingSongRef.current = false;
        }
      } else {
        isChangingSongRef.current = false;
      }
    }, 50);
  };

  // Play the previous song in the playlist
  const playPreviousSong = () => {
    if (playlist.length === 0 || isChangingSongRef.current) return;

    // Set flag to prevent multiple rapid changes
    isChangingSongRef.current = true;

    // Calculate previous song index (loop to end if at beginning)
    const prevIndex =
      (currentSongIndex - 1 + playlist.length) % playlist.length;

    console.log(
      `Changing to previous song: ${prevIndex} of ${playlist.length}`
    );

    // If currently playing, pause first to avoid AbortError
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }

    // Update current song index
    setCurrentSongIndex(prevIndex);

    // Load and play the previous song with a small delay to ensure proper state update
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = playlist[prevIndex];

        if (isPlaying) {
          audioRef.current
            .play()
            .then(() => {
              console.log("Previous song playing successfully");
              isChangingSongRef.current = false;
            })
            .catch((error) => {
              console.error("Failed to play previous song:", error);
              isChangingSongRef.current = false;
            });
        } else {
          isChangingSongRef.current = false;
        }
      } else {
        isChangingSongRef.current = false;
      }
    }, 50);
  };

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle user interaction for autoplay
  useEffect(() => {
    if (playlist.length === 0) return;

    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      // Skip if user has already interacted with the music controls
      if (userInteractedRef.current) return;

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
            userInteractedRef.current = true; // Mark that user has interacted
          })
          .catch((error) => {
            console.error("Audio playback failed after interaction:", error);
            // Show play prompt if autoplay fails
            setShowPlayPrompt(true);
          });
      }
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [isPlaying, playlist]);

  const togglePlay = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the document click handler from firing
    e.stopPropagation();

    // Mark that user has interacted with music controls
    userInteractedRef.current = true;

    console.log("Toggle play button clicked, current state:", isPlaying);

    if (!audioRef.current) return;

    if (isPlaying) {
      // If currently playing, pause the audio
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If currently paused, play the audio
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
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // Handle click on previous/next buttons with stopPropagation
  const handlePreviousClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    userInteractedRef.current = true;
    playPreviousSong();
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    userInteractedRef.current = true;
    playNextSong();
  };

  // Handle click on play prompt with stopPropagation
  const handlePlayPromptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    userInteractedRef.current = true;
    togglePlay(e);
  };

  return (
    <div className="background-music-container">
      {showInteractionMessage && (
        <div className="music-interaction-message">
          Click anywhere to enable lofi music
        </div>
      )}

      {showPlayPrompt && (
        <button onClick={handlePlayPromptClick} className="music-play-prompt">
          🎵 Play Lofi Music
        </button>
      )}

      <div className="background-music-controls">
        <button
          onClick={handlePreviousClick}
          className="music-control-btn"
          aria-label="Previous song"
          disabled={!isPlaying}
        >
          ⏮️
        </button>
        <button
          onClick={togglePlay}
          className="music-toggle-btn"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? "🔊" : "🔈"}
        </button>
        <button
          onClick={handleNextClick}
          className="music-control-btn"
          aria-label="Next song"
          disabled={!isPlaying}
        >
          ⏭️
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
