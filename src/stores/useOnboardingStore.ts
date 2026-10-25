import { create } from "zustand";
import { TOUR_STEPS } from "@/lib/onboardingSteps";

const TOUR_DONE_KEY = "jqms_tour_done";

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  checkAutoStart: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isActive: false,
  currentStep: 0,
  totalSteps: TOUR_STEPS.length,

  startTour: () => {
    try {
      localStorage.removeItem(TOUR_DONE_KEY);
    } catch {
      // Ignore
    }
    set({ isActive: true, currentStep: 0, totalSteps: TOUR_STEPS.length });
  },

  nextStep: () => {
    const { currentStep, totalSteps, completeTour } = get();
    if (currentStep >= totalSteps - 1) {
      completeTour();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  skipTour: () => {
    try {
      localStorage.setItem(TOUR_DONE_KEY, "true");
    } catch {
      // Ignore
    }
    set({ isActive: false, currentStep: 0 });
  },

  completeTour: () => {
    try {
      localStorage.setItem(TOUR_DONE_KEY, "true");
    } catch {
      // Ignore
    }
    set({ isActive: false, currentStep: 0 });
  },

  checkAutoStart: () => {
    try {
      const done = localStorage.getItem(TOUR_DONE_KEY);
      if (!done) {
        // Delay slightly so layout/sidebar are fully mounted
        setTimeout(() => {
          set({ isActive: true, currentStep: 0, totalSteps: TOUR_STEPS.length });
        }, 1500);
      }
    } catch {
      // Ignore
    }
  },
}));
