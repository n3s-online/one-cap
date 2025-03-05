import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface Cap {
  id: string;
  name: string;
  letter: string;
  color: string;
  letterColor: string;
  playlist: string;
}

export interface CapsState {
  selectedCapId: string;
  caps: Record<string, Cap>;
}

// Create a more robust volume atom with a specific key for localStorage
export const volumeAtom = atomWithStorage<number>("baseball-cap-volume", 0.3, {
  getItem: (key, initialValue) => {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) return initialValue;
    try {
      const parsedValue = JSON.parse(storedValue);
      // Validate that the parsed value is a valid number between 0 and 1
      if (
        typeof parsedValue !== "number" ||
        isNaN(parsedValue) ||
        !isFinite(parsedValue)
      ) {
        return initialValue; // Return initialValue if not a valid number
      }
      // Ensure volume is between 0 and 1
      return Math.max(0, Math.min(1, parsedValue));
    } catch (e) {
      return initialValue; // Default if parsing fails
    }
  },
  setItem: (key, value) => {
    // Ensure we're storing a valid number
    let safeValue = value;
    if (
      typeof safeValue !== "number" ||
      isNaN(safeValue) ||
      !isFinite(safeValue)
    ) {
      safeValue = 0.3; // Use default if not a valid number
    }
    // Ensure volume is between 0 and 1
    safeValue = Math.max(0, Math.min(1, safeValue));
    localStorage.setItem(key, JSON.stringify(safeValue));
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
});

const initialState: CapsState = {
  selectedCapId: "1",
  caps: {
    "1": {
      id: "1",
      name: "Developer",
      letter: "D",
      color: "#2E4A9E",
      letterColor: "white",
      playlist: "lofi",
    },
    "2": {
      id: "2",
      name: "Marketer",
      letter: "M",
      color: "#D6811F",
      letterColor: "white",
      playlist: "techno",
    },
  },
};

// Create an atom that persists caps data in localStorage
export const capsAtom = atomWithStorage<CapsState>(
  "baseball-caps",
  initialState
);

// Helper atoms for specific operations
export const addCapAtom = atom(null, (get, set, newCap: Cap) => {
  const currentState = get(capsAtom);
  set(capsAtom, {
    selectedCapId: newCap.id,
    caps: { ...currentState.caps, [newCap.id]: newCap },
  });
});

export const removeCapAtom = atom(null, (get, set, capId: string) => {
  const currentState = get(capsAtom);
  set(capsAtom, {
    selectedCapId: currentState.selectedCapId,
    caps: Object.fromEntries(
      Object.entries(currentState.caps).filter(([id]) => id !== capId)
    ),
  });
});

export const updateCapAtom = atom(null, (get, set, updatedCap: Cap) => {
  const currentState = get(capsAtom);
  set(capsAtom, {
    selectedCapId: currentState.selectedCapId,
    caps: { ...currentState.caps, [updatedCap.id]: updatedCap },
  });
});

export const getSelectedCapAtom = atom((get) => {
  const currentState = get(capsAtom);
  const selectedCap = currentState.caps[currentState.selectedCapId];

  // Ensure the selected cap has a playlist property, defaulting to "lofi" if not
  if (selectedCap && !selectedCap.playlist) {
    return {
      ...selectedCap,
      playlist: "lofi",
    };
  }

  return selectedCap;
});

export const getAllCapsAtom = atom((get) => {
  const currentState = get(capsAtom);

  // Ensure all caps have a playlist property, defaulting to "lofi" if not
  return Object.values(currentState.caps).map((cap) => {
    if (!cap.playlist) {
      return {
        ...cap,
        playlist: "lofi",
      };
    }
    return cap;
  });
});
