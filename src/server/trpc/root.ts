import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { login } from "./procedures/login";
import { logout } from "./procedures/logout";
import { refreshToken } from "./procedures/refreshToken";
import { getCurrentUser } from "./procedures/getCurrentUser";
import { getProjects } from "./procedures/getProjects";
import { createProject } from "./procedures/createProject";
import { generateConfigPack } from "./procedures/generateConfigPack";
import { getTemplates } from "./procedures/getTemplates";
import { getRoleArchetypes } from "./procedures/getRoleArchetypes";
import { getTenantRoleMappings } from "./procedures/getTenantRoleMappings";
import { updateTenantRoleMapping } from "./procedures/updateTenantRoleMapping";
import { createTenantRoleMapping } from "./procedures/createTenantRoleMapping";

import { keysRouter } from "./routers/keysRouter";
import { codesRouter } from "./routers/codesRouter";
import { analyticsRouter } from "./routers/analyticsRouter";
import { notificationsRouter } from "./routers/notificationsRouter";

export const appRouter = createTRPCRouter({
  // Authentication
  login,
  logout,
  refreshToken,
  getCurrentUser,

  // Project Management
  getProjects,
  createProject,

  // Configuration
  generateConfigPack,
  getTemplates,

  // Role Management
  getRoleArchetypes,
  getTenantRoleMappings,
  createTenantRoleMapping,
  updateTenantRoleMapping,

  // Nested routers for organized API
  keys: keysRouter,
  codes: codesRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
