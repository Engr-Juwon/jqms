import { create } from "zustand";

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
  totalSteps: 12,

  startTour: () => {
    set({ isActive: true, currentStep: 0 });
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
    localStorage.setItem(TOUR_DONE_KEY, "true");
    set({ isActive: false, currentStep: 0 });
  },

  completeTour: () => {
    localStorage.setItem(TOUR_DONE_KEY, "true");
    set({ isActive: false, currentStep: 0 });
  },

  checkAutoStart: () => {
    const done = localStorage.getItem(TOUR_DONE_KEY);
    if (!done) {
      // Delay slightly so layout/sidebar are fully mounted
      setTimeout(() => {
        set({ isActive: true, currentStep: 0 });
      }, 1500);
    }
  },
}));
