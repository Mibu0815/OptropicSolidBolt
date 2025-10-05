/**
 * Optropic Platform – Key Management Service
 * ------------------------------------------
 * Responsibilities:
 *  - Generate ECC (P-256) keypairs
 *  - Encrypt private keys (AES-256-GCM)
 *  - Store & retrieve keys via Prisma
 *  - Rotate / revoke lifecycle management
 *  - Return only safe public data to frontend
 */

import crypto from "crypto";
import { db } from "../db";
import { env } from "../env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type KeyType = "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";

export interface KeyDTO {
  id: number;
  keyName: string;
  type: KeyType;
  publicKey: string;
  algorithm: string;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate ECC (P-256) keypair
 */
function generateECCKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
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

  return { publicKey, privateKey };
}

/**
 * Encrypt private key using AES-256-GCM
 */
function encryptPrivateKey(privateKey: string): string {
  const key = Buffer.from(env.SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt private key (only used internally, never exposed)
 */
function decryptPrivateKey(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }

  const iv = Buffer.from(parts[0]!, "hex");
  const authTag = Buffer.from(parts[1]!, "hex");
  const encrypted = parts[2]!;

  const key = Buffer.from(env.SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decryptedBuffer = decipher.update(encrypted, "hex", "utf8");
  const finalBuffer = decipher.final("utf8");

  return decryptedBuffer + finalBuffer;
}

/**
 * Sign data with private key
 */
export function signData(data: string, privateKey: string): string {
  const sign = crypto.createSign("SHA256");
  sign.update(data);
  sign.end();

  return sign.sign(privateKey, "base64");
}

/**
 * Verify signature with public key
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(data);
    verify.end();

    return verify.verify(publicKey, signature, "base64");
  } catch (error) {
    return false;
  }
}

/**
 * Generate entropy seed for Optropic codes
 */
export function generateEntropySeed(): string {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");

  return `${uuid}-${timestamp}-${random}`;
}

export const KeyService = {
  /**
   * Generate a new ECC (P-256) keypair and store in DB
   */
  async generateKey(
    projectId: number,
    keyName: string,
    type: KeyType,
    expiresAt?: Date
  ): Promise<KeyDTO> {
    const { publicKey, privateKey } = generateECCKeyPair();
    const encryptedPrivateKey = encryptPrivateKey(privateKey);

    const key = await db.key.create({
      data: {
        keyName,
        keyType: type,
        publicKey,
        encryptedPrivateKey,
        algorithm: "prime256v1",
        isActive: true,
        expiresAt: expiresAt || null,
        projectId,
      },
    });

    return {
      id: key.id,
      keyName: key.keyName,
      type: key.keyType as KeyType,
      publicKey: key.publicKey!,
      algorithm: key.algorithm,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  },

  /**
   * Rotate an existing key (generate new pair, mark old as rotated)
   */
  async rotateKey(keyId: number): Promise<KeyDTO> {
    const oldKey = await db.key.findUnique({
      where: { id: keyId },
    });

    if (!oldKey) {
      throw new Error("Key not found");
    }

    await db.key.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    const { publicKey, privateKey } = generateECCKeyPair();
    const encryptedPrivateKey = encryptPrivateKey(privateKey);

    const newKey = await db.key.create({
      data: {
        keyName: `${oldKey.keyName} (Rotated)`,
        keyType: oldKey.keyType,
        publicKey,
        encryptedPrivateKey,
        algorithm: oldKey.algorithm,
        isActive: true,
        expiresAt: oldKey.expiresAt,
        projectId: oldKey.projectId,
        pairedKeyId: oldKey.pairedKeyId,
      },
    });

    return {
      id: newKey.id,
      keyName: newKey.keyName,
      type: newKey.keyType as KeyType,
      publicKey: newKey.publicKey!,
      algorithm: newKey.algorithm,
      isActive: newKey.isActive,
      expiresAt: newKey.expiresAt,
      createdAt: newKey.createdAt,
    };
  },

  /**
   * Revoke a key permanently (cannot be reactivated)
   */
  async revokeKey(keyId: number): Promise<KeyDTO> {
    const key = await db.key.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    return {
      id: key.id,
      keyName: key.keyName,
      type: key.keyType as KeyType,
      publicKey: key.publicKey!,
      algorithm: key.algorithm,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  },

  /**
   * List all keys for a project
   */
  async listKeys(projectId: number): Promise<KeyDTO[]> {
    const keys = await db.key.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return keys.map((key) => ({
      id: key.id,
      keyName: key.keyName,
      type: key.keyType as KeyType,
      publicKey: key.publicKey!,
      algorithm: key.algorithm,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  },

  /**
   * Internal method: Retrieve decrypted private key (for signing)
   * Never exposed to public API.
   */
  async getPrivateKey(keyId: number): Promise<string> {
    const key = await db.key.findUnique({
      where: { id: keyId },
    });

    if (!key) {
      throw new Error("Key not found");
    }

    return decryptPrivateKey(key.encryptedPrivateKey);
  },

  /**
   * Check if key is expired
   */
  isKeyExpired(key: KeyDTO): boolean {
    if (!key.expiresAt) return false;
    return new Date(key.expiresAt) < new Date();
  },

  /**
   * Get active keys only
   */
  async getActiveKeys(projectId: number): Promise<KeyDTO[]> {
    const keys = await this.listKeys(projectId);
    return keys.filter((key) => key.isActive && !this.isKeyExpired(key));
  },
};
