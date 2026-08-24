import { create } from 'zustand';

interface UiState {
  debugMode: boolean;
  toggleDebugMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  debugMode: false,
  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
}));
