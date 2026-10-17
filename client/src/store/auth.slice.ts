import { useSettingsStore } from './settings.slice';
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@enrollpro/shared";
import { setLoggingOut } from "@/shared/lib/logoutState";

export type AuthRole = Role;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  employeeId: string | null;
  accountName: string | null;
  roles: AuthRole[];
  ancillaryRoles: string[];
  photoPath?: string | null;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  sessionExpired: boolean;
  isHydrated: boolean;
  isLoggingOut: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionExpired: false,
      isHydrated: false,
      isLoggingOut: false,
      setAuth: (user) => {
        setLoggingOut(false);
        set({ user, sessionExpired: false, isLoggingOut: false });
      },
      clearAuth: () => {
        setLoggingOut(true);
        useSettingsStore.getState().resetUiPreferences();
        set({ user: null, isLoggingOut: true });
      },
      setIsLoggingOut: (isLoggingOut) => {
        setLoggingOut(isLoggingOut);
        set({ isLoggingOut });
      },
      setSessionExpired: (expired) => set({ sessionExpired: expired }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      // Do not persist sessionExpired or isLoggingOut — they are transient UI flags
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
