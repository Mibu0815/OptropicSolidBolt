/**
 * Key Service Tests
 * -----------------
 * Unit tests for cryptographic key management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { signData, verifySignature } from "../../server/services/keyService";
import crypto from "crypto";

describe("KeyService", () => {
  describe("signData and verifySignature", () => {
    let publicKey: string;
    let privateKey: string;

    beforeEach(() => {
      const keyPair = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      });

      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    });

    it("should sign data with private key", () => {
      const data = "test-data";
      const signature = signData(data, privateKey);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe("string");
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should verify signature with public key", () => {
      const data = "test-data";
      const signature = signData(data, privateKey);

      const isValid = verifySignature(data, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it("should fail verification with wrong data", () => {
      const data = "test-data";
      const signature = signData(data, privateKey);

      const isValid = verifySignature("wrong-data", signature, publicKey);

      expect(isValid).toBe(false);
    });

    it("should fail verification with tampered signature", () => {
      const data = "test-data";
      const signature = signData(data, privateKey);
      const tamperedSignature = signature.slice(0, -5) + "XXXXX";

      const isValid = verifySignature(data, tamperedSignature, publicKey);

      expect(isValid).toBe(false);
    });

    it("should handle different data formats", () => {
      const data = JSON.stringify({ id: 123, name: "test" });
      const signature = signData(data, privateKey);

      const isValid = verifySignature(data, signature, publicKey);

      expect(isValid).toBe(true);
    });
  });
});
