/**
 * Vitest Test Setup
 * -----------------
 * Global setup and mocks for testing
 */

import { beforeAll, afterAll, vi } from "vitest";
import "@testing-library/jest-dom";

beforeAll(() => {
  process.env.JWT_SECRET = "test-jwt-secret-for-testing-purposes-only-64bytes-xxxxxxxxxxxxxxxxxxxx";
  process.env.SECRET_KEY = "test-secret-key-for-testing-purposes-only-please-use-secure-random-values";
  process.env.NODE_ENV = "development";
  process.env.DATABASE_URL = "file:./test.db";
});

afterAll(() => {
  vi.clearAllMocks();
});

vi.mock("../server/env", () => ({
  env: {
    NODE_ENV: "development",
    JWT_SECRET: "test-jwt-secret",
    SECRET_KEY: "test-secret-key-for-encryption",
    BASE_URL: "http://localhost:3000",
    ADMIN_PASSWORD: "admin",
  },
}));

vi.mock("../server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    optropicCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    key: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../server/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  logError: vi.fn(),
  logRequest: vi.fn(),
  logResponse: vi.fn(),
}));

vi.mock("../server/utils/sentry", () => ({
  initSentry: vi.fn(),
  captureError: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  clearUser: vi.fn(),
}));
