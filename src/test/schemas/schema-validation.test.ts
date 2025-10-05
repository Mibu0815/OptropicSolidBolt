import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  AuthLoginSchema,
  AuthTokenResponseSchema,
  CreateProjectSchema,
  AnalyticsOverviewSchema,
  GenerateKeySchema,
  NotificationSchema,
  KeyTypeSchema,
  NotificationTypeSchema,
} from "@optropic/shared";

describe("Shared Schema Validation", () => {
  describe("Auth Schemas", () => {
    it("should validate correct login input", () => {
      const validLogin = {
        email: "test@example.com",
        password: "password123",
      };

      const result = AuthLoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidLogin = {
        email: "not-an-email",
        password: "password123",
      };

      const result = AuthLoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it("should validate auth token response", () => {
      const validResponse = {
        user: {
          id: 1,
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          role: "USER" as const,
          archetype: null,
          tenantId: null,
        },
        token: "jwt.token.here",
        refreshToken: "refresh.token.here",
        expiresIn: 3600,
      };

      const result = AuthTokenResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("Project Schemas", () => {
    it("should validate create project input", () => {
      const validInput = {
        token: "jwt.token.here",
        name: "Test Project",
        description: "A test project",
      };

      const result = CreateProjectSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty project name", () => {
      const invalidInput = {
        token: "jwt.token.here",
        name: "",
        description: "A test project",
      };

      const result = CreateProjectSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("Analytics Schemas", () => {
    it("should validate analytics overview", () => {
      const validOverview = {
        activeProjects: 10,
        activeKeys: 50,
        scansThisMonth: 1000,
        totalCodes: 500,
        totalScans: 5000,
        successRate: 95.5,
        averageTrustScore: 85.3,
      };

      const result = AnalyticsOverviewSchema.safeParse(validOverview);
      expect(result.success).toBe(true);
    });
  });

  describe("Key Schemas", () => {
    it("should validate all key types", () => {
      const keyTypes = ["ENCRYPTION", "SIGNING", "NFC_PAIRING", "RFID_PAIRING"];

      keyTypes.forEach((type) => {
        const result = KeyTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid key type", () => {
      const result = KeyTypeSchema.safeParse("INVALID_TYPE");
      expect(result.success).toBe(false);
    });

    it("should validate generate key input", () => {
      const validInput = {
        projectId: 1,
        keyName: "Test Key",
        keyType: "ENCRYPTION" as const,
        expiresAt: "2025-12-31T23:59:59Z",
      };

      const result = GenerateKeySchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("Notification Schemas", () => {
    it("should validate all notification types", () => {
      const types = [
        "KEY_EXPIRING",
        "KEY_EXPIRED",
        "KEY_REVOKED",
        "ANOMALY_DETECTED",
        "PROJECT_CREATED",
        "SCAN_THRESHOLD_REACHED",
        "SYSTEM_ALERT",
      ];

      types.forEach((type) => {
        const result = NotificationTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should validate notification", () => {
      const validNotification = {
        id: 1,
        userId: 1,
        type: "KEY_EXPIRING" as const,
        title: "Key Expiring Soon",
        message: "Your encryption key will expire in 7 days",
        link: "/keys/123",
        isRead: false,
        metadata: { keyId: 123 },
        createdAt: new Date(),
      };

      const result = NotificationSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
    });
  });

  describe("Schema Type Safety", () => {
    it("should provide correct TypeScript types", () => {
      const login: z.infer<typeof AuthLoginSchema> = {
        email: "test@example.com",
        password: "password123",
      };

      expect(login.email).toBe("test@example.com");
      expect(login.password).toBe("password123");
    });
  });
});
