import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  currentStep: number;
  openedBlocks: Record<number, string[]>;
  completedSteps: Record<number, boolean>;
  simulationHasRun: boolean;
  
  setCurrentStep: (stepId: number) => void;
  markBlockOpened: (stepId: number, blockId: string) => void;
  markStepCompleted: (stepId: number) => void;
  setSimulationHasRun: (hasRun: boolean) => void;
  canNavigateNext: (stepId: number, totalBlocks: number) => boolean;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      openedBlocks: {},
      completedSteps: {},
      simulationHasRun: false,

      setCurrentStep: (stepId: number) => set({ currentStep: stepId }),

      markBlockOpened: (stepId: number, blockId: string) => {
        const currentOpened = get().openedBlocks[stepId] || [];
        if (!currentOpened.includes(blockId)) {
          set({
            openedBlocks: {
              ...get().openedBlocks,
              [stepId]: [...currentOpened, blockId],
            },
          });
        }
      },

      markStepCompleted: (stepId: number) => {
        set({
          completedSteps: {
            ...get().completedSteps,
            [stepId]: true,
          },
        });
      },

      setSimulationHasRun: (hasRun: boolean) => set({ simulationHasRun: hasRun }),

      canNavigateNext: (stepId: number, totalBlocks: number) => {
        const opened = get().openedBlocks[stepId] || [];
        const allBlocksOpened = opened.length >= totalBlocks;
        if (stepId === 11) {
          return allBlocksOpened && get().simulationHasRun;
        }
        return allBlocksOpened;
      },

      resetProgress: () => set({
        currentStep: 1,
        openedBlocks: {},
        completedSteps: {},
        simulationHasRun: false,
      }),
    }),
    {
      name: 'salestorm-progress',
    }
  )
);
