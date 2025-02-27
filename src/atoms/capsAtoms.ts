import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface Cap {
  id: string;
  name: string;
  letter: string;
  color: string;
  letterColor: string;
}

export interface CapsState {
  selectedCapId: string;
  caps: Record<string, Cap>;
}

const initialState: CapsState = {
  selectedCapId: "1",
  caps: {
    "1": {
      id: "1",
      name: "Developer",
      letter: "D",
      color: "#2E4A9E",
      letterColor: "white",
    },
    "2": {
      id: "2",
      name: "Marketer",
      letter: "M",
      color: "#D6811F",
      letterColor: "white",
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
  return currentState.caps[currentState.selectedCapId];
});

export const getAllCapsAtom = atom((get) => {
  const currentState = get(capsAtom);
  return Object.values(currentState.caps);
});
