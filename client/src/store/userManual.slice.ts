import { create } from "zustand";

interface UserManualState {
  isOpen: boolean;
  openManual: () => void;
  closeManual: () => void;
  toggleManual: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useUserManualStore = create<UserManualState>((set) => ({
  isOpen: false,
  openManual: () => set({ isOpen: true }),
  closeManual: () => set({ isOpen: false }),
  toggleManual: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
}));
