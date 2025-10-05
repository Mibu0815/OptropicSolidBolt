import { TRPCError } from "@trpc/server";
import {
  API_VERSION,
  FRONTEND_MIN_VERSION,
  BACKEND_MIN_VERSION,
  validateVersionSync,
} from "@optropic/shared";
import { logger } from "../utils/logger";

export interface VersionHeaders {
  "x-frontend-version"?: string;
  "x-backend-version"?: string;
}

export function validateVersionHeaders(headers: VersionHeaders): void {
  const frontendVersion = headers["x-frontend-version"];
  const backendVersion = headers["x-backend-version"] || API_VERSION;

  if (!frontendVersion) {
    logger.warn("Missing frontend version header");
    return;
  }

  const validation = validateVersionSync(frontendVersion, backendVersion);

  if (!validation.isValid) {
    logger.error({
      msg: "Version mismatch detected",
      frontendVersion,
      backendVersion,
      requiredMin: FRONTEND_MIN_VERSION,
      validationMessage: validation.message,
    });

    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Frontend–Backend Version Sync Warning: ${validation.message}`,
    });
  }

  logger.debug({
    msg: "Version validation passed",
    frontendVersion,
    backendVersion,
  });
}

export function getVersionInfo() {
  return {
    apiVersion: API_VERSION,
    frontendMinVersion: FRONTEND_MIN_VERSION,
    backendMinVersion: BACKEND_MIN_VERSION,
  };
}
