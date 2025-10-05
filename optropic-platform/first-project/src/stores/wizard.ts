import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UseCase = "AUTHENTICATION" | "MAINTENANCE" | "COMPLIANCE" | "ENGAGEMENT";
export type UserRoleType = "INSTALLER" | "INSPECTOR" | "MAINTAINER" | "MANAGER" | "PUBLIC";
export type ActionType = "VERIFY" | "LOG" | "INSPECT" | "VIEW_INFO";

export interface ProductItem {
  gtin?: string;
  batch?: string;
  serial?: string;
  name?: string;
}

export interface WizardData {
  // Step 1: Welcome (no data needed)
  // Step 2: Use Case
  useCase?: UseCase;
  // Step 3: Roles
  selectedRoles: UserRoleType[];
  // Step 4: Actions per Role
  roleActions: Record<UserRoleType, ActionType[]>;
  // Step 5: Product List
  productList: ProductItem[];
  productListText?: string; // For manual entry
  // Step 6: Config Generation (no additional data)
}

interface WizardStore {
  currentStep: number;
  wizardData: WizardData;
  setCurrentStep: (step: number) => void;
  updateWizardData: (data: Partial<WizardData>) => void;
  resetWizard: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const initialWizardData: WizardData = {
  selectedRoles: [],
  roleActions: {} as Record<UserRoleType, ActionType[]>,
  productList: [],
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      wizardData: initialWizardData,
      
      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },
      
      updateWizardData: (data: Partial<WizardData>) => {
        set(state => ({
          wizardData: { ...state.wizardData, ...data }
        }));
      },
      
      resetWizard: () => {
        set({
          currentStep: 1,
          wizardData: initialWizardData,
        });
      },
      
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 6) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },
    }),
    {
      name: "optropic-wizard",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
