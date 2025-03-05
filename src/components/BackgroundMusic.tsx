import React, { useState, useEffect, useRef } from "react";
import { useAtomValue, useAtom } from "jotai";
import { getSelectedCapAtom, volumeAtom } from "../atoms/capsAtoms";

interface BackgroundMusicProps {
  initialVolume?: number;
}

// Define playlists
const PLAYLISTS = {
  lofi: [
    "./audio/lofi/lofi-background.mp3",
    "./audio/lofi/good-night-lofi-cozy-chill-music-160166.mp3",
    "./audio/lofi/lofi-piano-beat-305563.mp3",
  ],
  techno: ["./audio/techno/techno-1.mp3", "./audio/techno/techno-2.mp3"],
  // Add more playlists here in the future
};

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
  initialVolume = 0.3,
}) => {
  const selectedCap = useAtomValue(getSelectedCapAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [showInteractionMessage, setShowInteractionMessage] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playStateRef = useRef(false); // Reference to track play state across effects
  const userInteractedRef = useRef(false); // Track if user has already interacted
  const isChangingSongRef = useRef(false); // Track if we're in the process of changing songs
  const currentPlaylistRef = useRef<string>("lofi"); // Track current playlist

  // Initialize playlist on component mount
  useEffect(() => {
    // Default to lofi playlist if no selected cap
    const defaultPlaylist = shuffleArray(PLAYLISTS.lofi);
    setPlaylist(defaultPlaylist);
  }, []);

  // Update playlist when selected cap changes
  useEffect(() => {
    if (!selectedCap) return;

    // Ensure we have a playlist name, defaulting to "lofi" if not present
    const playlistName = selectedCap.playlist || "lofi";
    const playlistSongs =
      PLAYLISTS[playlistName as keyof typeof PLAYLISTS] || PLAYLISTS.lofi;

    // Only change playlist if it's different from the current one
    if (playlistName !== currentPlaylistRef.current) {
      currentPlaylistRef.current = playlistName;

      // Create randomized playlist
      const randomizedPlaylist = shuffleArray(playlistSongs);
      setPlaylist(randomizedPlaylist);

      // Reset song index
      setCurrentSongIndex(0);

      // If audio is already playing, load and play the first song from the new playlist
      if (isPlaying && audioRef.current) {
        isChangingSongRef.current = true;
        audioRef.current.pause();

        setTimeout(() => {
          if (audioRef.current && randomizedPlaylist.length > 0) {
            audioRef.current.src = randomizedPlaylist[0];
            audioRef.current
              .play()
              .then(() => {
                isChangingSongRef.current = false;
              })
              .catch((error) => {
                isChangingSongRef.current = false;
              });
          } else {
            isChangingSongRef.current = false;
          }
        }, 50);
      }
    }
  }, [selectedCap]);

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

  // Initialize audio element when playlist changes
  useEffect(() => {
    if (playlist.length === 0) return;

    // Remember the current play state before cleaning up
    const wasPlaying = playStateRef.current;

    // Clean up any existing audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    // Create a new audio element
    const audio = new Audio(playlist[currentSongIndex]);

    // Set volume from atom without logging
    audio.volume = volume;

    // Set up error handling
    audio.addEventListener("error", (e) => {
      setIsPlaying(false);
    });

    // Add event listeners to track audio state
    audio.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);

      // If it was playing before, start playing the new song automatically
      if (wasPlaying) {
        audio
          .play()
          .then(() => {
            // Playback resumed successfully
          })
          .catch((error) => {
            console.error("Failed to resume playback:", error);
          });
      }
    });

    // Handle song ending - play next song in playlist
    const handleSongEnd = () => {
      playNextSong();
    };

    // Handle play/pause events to keep our state in sync with native audio events
    const handlePlay = () => {
      playStateRef.current = true;
      setIsPlaying(true); // Always update state when audio plays
    };

    const handlePause = () => {
      playStateRef.current = false;
      setIsPlaying(false); // Always update state when audio pauses
    };

    audio.addEventListener("ended", handleSongEnd);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Store the audio element
    audioRef.current = audio;

    return () => {
      // Clean up event listeners and timers
      if (audioRef.current) {
        audioRef.current.removeEventListener("canplaythrough", () => {});
        audioRef.current.removeEventListener("ended", handleSongEnd);
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("pause", handlePause);
        audioRef.current.removeEventListener("error", () => {});
      }
    };
  }, [playlist, currentSongIndex]); // Remove volume from dependencies

  // Handle volume changes separately
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update playStateRef when isPlaying changes
  useEffect(() => {
    playStateRef.current = isPlaying;

    // Ensure audio element's playing state matches our state
    if (audioRef.current) {
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch((error) => {
          console.error("Failed to sync play state:", error);
          setIsPlaying(false); // Revert state if play fails
        });
      } else if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle user interaction for autoplay
  useEffect(() => {
    if (playlist.length === 0) return;

    const handleFirstInteraction = (e: MouseEvent | TouchEvent) => {
      if (userInteractedRef.current) return;

      userInteractedRef.current = true;
      setShowInteractionMessage(false);

      // Remove event listeners after first interaction
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    // Add event listeners for first interaction
    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      // Clean up event listeners
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [playlist]);

  // Handle toggle play/pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .then(() => {
          // Play successful
        })
        .catch((error) => {
          console.error("Play failed:", error);
        });
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    // Also directly set the audio volume to ensure it updates
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle previous button click
  const handlePreviousClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    playPreviousSong();
  };

  // Handle next button click
  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    playNextSong();
  };

  // Play the next song in the playlist
  const playNextSong = () => {
    if (playlist.length === 0 || isChangingSongRef.current) return;

    // Set flag to prevent multiple rapid changes
    isChangingSongRef.current = true;

    // Calculate next song index (loop back to beginning if at end)
    const nextIndex = (currentSongIndex + 1) % playlist.length;

    // Update current song index - this will trigger the useEffect that manages the audio element
    setCurrentSongIndex(nextIndex);

    // Reset the changing flag immediately to allow auto-play in canplaythrough
    isChangingSongRef.current = false;
  };

  // Play the previous song in the playlist
  const playPreviousSong = () => {
    if (playlist.length === 0 || isChangingSongRef.current) return;

    // Set flag to prevent multiple rapid changes
    isChangingSongRef.current = true;

    // Calculate previous song index (loop to end if at beginning)
    const prevIndex =
      (currentSongIndex - 1 + playlist.length) % playlist.length;

    // Update current song index - this will trigger the useEffect that manages the audio element
    setCurrentSongIndex(prevIndex);

    // Reset the changing flag immediately to allow auto-play in canplaythrough
    isChangingSongRef.current = false;
  };

  // Get current playlist name for display
  const getCurrentPlaylistName = () => {
    if (!selectedCap) return "Lofi";
    // Ensure we have a playlist name, defaulting to "lofi" if not present
    const playlistName = selectedCap.playlist || "lofi";
    return playlistName.charAt(0).toUpperCase() + playlistName.slice(1);
  };

  return (
    <div className="music-player">
      <div className="music-controls">
        <div className="playlist-info">
          <span className="playlist-name">{getCurrentPlaylistName()}</span>
        </div>

        <div className="player-buttons">
          <button
            className="player-button previous-button"
            onClick={handlePreviousClick}
            aria-label="Previous song"
          >
            ⏮
          </button>
          <button
            className="player-button play-button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            className="player-button next-button"
            onClick={handleNextClick}
            aria-label="Next song"
          >
            ⏭
          </button>
        </div>

        <div className="volume-control">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
};

export default BackgroundMusic;
