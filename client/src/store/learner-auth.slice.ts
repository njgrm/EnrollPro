import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setLoggingOut } from "@/shared/lib/logoutState";

export interface LearnerUser {
  id: number;
  lrn: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  schoolName: string;
  schoolAcronym: string;
  gradeLevelName: string | null;
  sectionName: string | null;
}

interface LearnerAuthState {
  user: LearnerUser | null;
  token: string | null;
  requiresPasswordReset: boolean;
  sessionExpired: boolean;
  isHydrated: boolean;
  isLoggingOut: boolean;
  setAuth: (user: LearnerUser, token?: string | null) => void;
  setRequiresPasswordReset: (value: boolean) => void;
  clearAuth: () => void;
  setIsLoggingOut: (isLoggingOut: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  setHydrated: () => void;
}

export const useLearnerAuthStore = create<LearnerAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      requiresPasswordReset: false,
      sessionExpired: false,
      isHydrated: false,
      isLoggingOut: false,
      setAuth: (user, token) => {
        setLoggingOut(false);
        set({ user, token, requiresPasswordReset: false, sessionExpired: false, isLoggingOut: false });
      },
      setRequiresPasswordReset: (value) => set({ requiresPasswordReset: value }),
      clearAuth: () => {
        setLoggingOut(true);
        set({ user: null, token: null, requiresPasswordReset: false, isLoggingOut: true });
      },
      setIsLoggingOut: (isLoggingOut) => {
        setLoggingOut(isLoggingOut);
        set({ isLoggingOut });
      },
      setSessionExpired: (expired) => set({ sessionExpired: expired }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "learner-auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        requiresPasswordReset: state.requiresPasswordReset,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
