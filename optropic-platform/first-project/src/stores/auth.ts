import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "ADMIN" | "MANAGER" | "OPERATOR"; // Keep for backward compatibility

export interface RoleArchetype {
  id: number;
  code: string;
  defaultLabel: string;
  description: string;
  isActive: boolean;
}

export interface TenantRoleMapping {
  id: number;
  tenantId: number;
  archetypeId: number;
  customLabel?: string;
  icon?: string;
  color?: string;
  isEnabled: boolean;
  archetype: RoleArchetype;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole; // Keep for backward compatibility
  archetype?: RoleArchetype;
  tenantRoleMapping?: TenantRoleMapping;
  tenantId?: number;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  // Helper functions for role checking
  hasRole: (roleCode: string) => boolean;
  isAdmin: () => boolean;
  canManage: () => boolean;
  getEffectiveRole: () => string;
  getRoleLabel: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user: AuthUser, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      updateUser: (user: AuthUser) => {
        set({ user });
      },
      
      // Helper functions for role checking
      hasRole: (roleCode: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Check new archetype system first
        if (user.archetype?.code === roleCode) return true;
        
        // Fallback to old role system for backward compatibility
        return user.role === roleCode;
      },
      
      isAdmin: () => {
        const { hasRole } = get();
        return hasRole("ADMIN");
      },
      
      canManage: () => {
        const { hasRole } = get();
        return hasRole("ADMIN") || hasRole("MANAGER");
      },
      
      getEffectiveRole: () => {
        const { user } = get();
        if (!user) return "UNKNOWN";
        
        // Prefer archetype system
        if (user.archetype?.code) return user.archetype.code;
        
        // Fallback to old role system
        return user.role;
      },
      
      getRoleLabel: () => {
        const { user } = get();
        if (!user) return "Unknown";
        
        // Check for custom label from tenant mapping
        if (user.tenantRoleMapping?.customLabel) {
          return user.tenantRoleMapping.customLabel;
        }
        
        // Use archetype default label
        if (user.archetype?.defaultLabel) {
          return user.archetype.defaultLabel;
        }
        
        // Fallback to old role system
        return user.role;
      },
    }),
    {
      name: "optropic-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
