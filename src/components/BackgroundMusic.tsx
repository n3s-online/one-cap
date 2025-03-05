import React, { useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { getSelectedCapAtom } from "../atoms/capsAtoms";

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
  const currentPlaylistRef = useRef<string>("lofi"); // Track current playlist

  // Initialize playlist on component mount
  useEffect(() => {
    // Default to lofi playlist if no selected cap
    const defaultPlaylist = shuffleArray(PLAYLISTS.lofi);
    setPlaylist(defaultPlaylist);
    console.log("Initialized default playlist:", defaultPlaylist);
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

      console.log(
        `Initialized randomized playlist for ${playlistName}:`,
        randomizedPlaylist
      );

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
                console.log("New playlist song playing successfully");
                isChangingSongRef.current = false;
              })
              .catch((error) => {
                console.error("Failed to play song from new playlist:", error);
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

    console.log("Initializing audio player with playlist:", playlist);

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
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

      // Handle play/pause events to keep our state in sync with native audio events
      const handlePlay = () => {
        console.log("Audio play event triggered");
        setIsPlaying(true); // Always update state when audio plays
      };

      const handlePause = () => {
        console.log("Audio pause event triggered");
        setIsPlaying(false); // Always update state when audio pauses
      };

      audio.addEventListener("ended", handleSongEnd);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
    } else {
      // Update existing audio element with new song
      audioRef.current.src = playlist[currentSongIndex];
      audioRef.current.volume = volume;

      // Re-add event listeners to ensure they're attached
      const handleSongEnd = () => {
        console.log("Song ended, playing next song");
        playNextSong();
      };

      const handlePlay = () => {
        console.log("Audio play event triggered");
        setIsPlaying(true);
      };

      const handlePause = () => {
        console.log("Audio pause event triggered");
        setIsPlaying(false);
      };

      // Remove any existing listeners first to avoid duplicates
      audioRef.current.removeEventListener("ended", handleSongEnd);
      audioRef.current.removeEventListener("play", handlePlay);
      audioRef.current.removeEventListener("pause", handlePause);

      // Add listeners
      audioRef.current.addEventListener("ended", handleSongEnd);
      audioRef.current.addEventListener("play", handlePlay);
      audioRef.current.addEventListener("pause", handlePause);
    }

    // Show play prompt after a delay if music hasn't started
    const promptTimer = setTimeout(() => {
      if (!playStateRef.current && audioLoaded) {
        setShowPlayPrompt(true);
      }
    }, 5000);

    return () => {
      // Clean up
      clearTimeout(promptTimer);
    };
  }, [playlist, volume]);

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        // Define the event handlers to remove
        const handleSongEnd = () => {
          console.log("Song ended, playing next song");
          playNextSong();
        };

        const handlePlay = () => {
          console.log("Audio play event triggered");
          setIsPlaying(true);
        };

        const handlePause = () => {
          console.log("Audio pause event triggered");
          setIsPlaying(false);
        };

        // Remove event listeners
        audioRef.current.removeEventListener("ended", handleSongEnd);
        audioRef.current.removeEventListener("play", handlePlay);
        audioRef.current.removeEventListener("pause", handlePause);

        // Pause and clean up audio
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

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
      if (userInteractedRef.current) return;

      console.log("First user interaction detected");
      userInteractedRef.current = true;
      setShowInteractionMessage(false);

      // Try to play audio if it's not already playing
      if (audioRef.current && !isPlaying) {
        audioRef.current
          .play()
          .then(() => {
            console.log("Audio started playing after user interaction");
            setIsPlaying(true);
            setShowPlayPrompt(false);
          })
          .catch((error) => {
            console.error("Failed to play audio after interaction:", error);
          });
      }

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
  }, [playlist, isPlaying]);

  // Toggle play/pause
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false); // Explicitly update the state
    } else {
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio started playing");
          setIsPlaying(true); // Explicitly update the state
          setShowPlayPrompt(false);
        })
        .catch((error) => {
          console.error("Failed to play audio:", error);
          setIsPlaying(false); // Ensure state is consistent on error
        });
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
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

  // Handle play prompt click
  const handlePlayPromptClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowPlayPrompt(false);

    if (audioRef.current && !isPlaying) {
      audioRef.current
        .play()
        .then(() => {
          console.log("Audio started playing from prompt");
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Failed to play audio from prompt:", error);
        });
    }
  };

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
              setIsPlaying(true); // Ensure state is updated
              isChangingSongRef.current = false;
            })
            .catch((error) => {
              console.error("Failed to play next song:", error);
              setIsPlaying(false); // Update state on error
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
              setIsPlaying(true); // Ensure state is updated
              isChangingSongRef.current = false;
            })
            .catch((error) => {
              console.error("Failed to play previous song:", error);
              setIsPlaying(false); // Update state on error
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

  // Get current playlist name for display
  const getCurrentPlaylistName = () => {
    if (!selectedCap) return "Lofi";
    // Ensure we have a playlist name, defaulting to "lofi" if not present
    const playlistName = selectedCap.playlist || "lofi";
    return playlistName.charAt(0).toUpperCase() + playlistName.slice(1);
  };

  return (
    <div className="music-player">
      {showPlayPrompt && (
        <div className="play-prompt" onClick={handlePlayPromptClick}>
          <span className="play-icon">▶</span>
          <span>Play Music</span>
        </div>
      )}

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
