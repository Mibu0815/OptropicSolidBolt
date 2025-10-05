/**
 * Optropic Platform – Code Generation & Verification Service
 * ----------------------------------------------------------
 * Responsibilities:
 *  - Generate cryptographically signed Optropic codes
 *  - Encrypt payloads (AES-256-GCM)
 *  - Sign code payloads with private keys
 *  - Store codes in database
 *  - Revoke codes
 *  - Generate QR code representations
 *  - Support both encrypted and plaintext payload modes
 */

import crypto from "crypto";
import { db } from "../db";
import { KeyService, signData, generateEntropySeed } from "./keyService";
import { env } from "../env";

const ALGORITHM = "aes-256-gcm";

export type CodeType = "OPTROPIC" | "QRSSL" | "GS1_COMPLIANT";
export type EncryptionLevel = "AES_128" | "AES_256" | "RSA_2048" | "RSA_4096";

export interface CodeDTO {
  id: number;
  codeValue: string;
  codeType: CodeType;
  encryptionLevel: EncryptionLevel;
  entropySeed: string;
  isActive: boolean;
  createdAt: Date;
  qrCodeUrl?: string;
}

export interface CodePayload {
  projectId: number;
  keyId: number;
  entropySeed: string;
  timestamp: number;
  codeType: CodeType;
  encryptionLevel: EncryptionLevel;
  contentId?: number;
  role?: string;
  metadata?: Record<string, any>;
}

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface GenerateCodeInput {
  projectId: number;
  keyId: number;
  codeType: CodeType;
  encryptionLevel: EncryptionLevel;
  contentId?: number;
  assetId?: number;
  role?: string;
  metadata?: Record<string, any>;
  encryptPayload?: boolean;
}

/**
 * Helper: AES encrypt payload
 */
function encryptPayload(data: any): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(env.SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonData = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(jsonData, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Helper: AES decrypt payload
 */
function decryptPayload(encrypted: string, iv: string, tag: string): any {
  const key = Buffer.from(env.SECRET_KEY.padEnd(32, '0').substring(0, 32));
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Generate a simple QR code SVG representation
 * For production, consider using a proper QR code library like 'qrcode'
 */
function generateQRCodeSVG(data: string): string {
  const size = 200;
  const modules = 33;
  const moduleSize = size / modules;

  let paths = "";
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      const hash = Math.abs(
        data.split("").reduce((acc, char) => {
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, i * modules + j)
      );

      if (hash % 2 === 0) {
        const x = j * moduleSize;
        const y = i * moduleSize;
        paths += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${paths}
  </svg>`;
}

export const CodeService = {
  /**
   * Generate a new Optropic code with cryptographic signing
   * Supports both encrypted and plaintext payload modes
   */
  async generateCode(input: GenerateCodeInput): Promise<CodeDTO & { encryptedPayload?: EncryptedPayload }> {
    const {
      projectId,
      keyId,
      codeType,
      encryptionLevel,
      contentId,
      assetId,
      role,
      metadata,
      encryptPayload: shouldEncryptPayload = false,
    } = input;

    const key = await db.key.findUnique({
      where: { id: keyId },
    });

    if (!key || !key.isActive) {
      throw new Error("Key not found or inactive");
    }

    const entropySeed = generateEntropySeed();

    const payload: CodePayload = {
      projectId,
      keyId,
      entropySeed,
      timestamp: Date.now(),
      codeType,
      encryptionLevel,
      contentId,
      role,
      metadata: metadata || {},
    };

    let encryptedPayloadData: EncryptedPayload | undefined;
    let payloadForSigning = payload;

    if (shouldEncryptPayload) {
      encryptedPayloadData = encryptPayload(payload);
      payloadForSigning = { ...payload, encrypted: true } as any;
    }

    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payloadForSigning))
      .digest();

    const privateKey = await KeyService.getPrivateKey(keyId);
    const sign = crypto.createSign("SHA256");
    sign.update(payloadHash);
    sign.end();
    const signature = sign.sign(privateKey).toString("base64");

    const codeValue = Buffer.from(
      JSON.stringify({
        e: entropySeed,
        s: signature,
        k: keyId,
        ...(shouldEncryptPayload && encryptedPayloadData
          ? {
              enc: encryptedPayloadData.encrypted,
              iv: encryptedPayloadData.iv,
              tag: encryptedPayloadData.tag,
            }
          : {}),
      })
    ).toString("base64url");

    const code = await db.optropicCode.create({
      data: {
        codeValue,
        codeType,
        encryptionLevel,
        entropySeed,
        signature,
        payload: payload as any,
        isActive: true,
        projectId,
        keyId,
        assetId: assetId || null,
      },
    });

    const qrCodeSVG = generateQRCodeSVG(codeValue);
    const qrCodeUrl = `data:image/svg+xml;base64,${Buffer.from(qrCodeSVG).toString("base64")}`;

    return {
      id: code.id,
      codeValue: code.codeValue,
      codeType: code.codeType as CodeType,
      encryptionLevel: code.encryptionLevel as EncryptionLevel,
      entropySeed: code.entropySeed,
      isActive: code.isActive,
      createdAt: code.createdAt,
      qrCodeUrl,
      ...(encryptedPayloadData ? { encryptedPayload: encryptedPayloadData } : {}),
    };
  },

  /**
   * Backward-compatible generateCode method
   */
  async generateCodeSimple(
    projectId: number,
    keyId: number,
    codeType: CodeType,
    encryptionLevel: EncryptionLevel,
    assetId?: number,
    metadata?: Record<string, any>
  ): Promise<CodeDTO> {
    return await this.generateCode({
      projectId,
      keyId,
      codeType,
      encryptionLevel,
      assetId,
      metadata,
      encryptPayload: false,
    });
  },

  /**
   * Revoke a code (mark as inactive)
   */
  async revokeCode(codeId: number): Promise<CodeDTO> {
    const code = await db.optropicCode.update({
      where: { id: codeId },
      data: { isActive: false },
    });

    return {
      id: code.id,
      codeValue: code.codeValue,
      codeType: code.codeType as CodeType,
      encryptionLevel: code.encryptionLevel as EncryptionLevel,
      entropySeed: code.entropySeed,
      isActive: code.isActive,
      createdAt: code.createdAt,
    };
  },

  /**
   * List codes for a project
   */
  async listCodes(projectId: number): Promise<CodeDTO[]> {
    const codes = await db.optropicCode.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            scans: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return codes.map((code) => ({
      id: code.id,
      codeValue: code.codeValue,
      codeType: code.codeType as CodeType,
      encryptionLevel: code.encryptionLevel as EncryptionLevel,
      entropySeed: code.entropySeed,
      isActive: code.isActive,
      createdAt: code.createdAt,
    }));
  },

  /**
   * Get code by value
   */
  async getCodeByValue(codeValue: string) {
    return await db.optropicCode.findFirst({
      where: { codeValue },
      include: {
        key: true,
        project: true,
        asset: true,
      },
    });
  },

  /**
   * Get code statistics
   */
  async getCodeStats(projectId: number) {
    const [total, active, scans] = await Promise.all([
      db.optropicCode.count({
        where: { projectId },
      }),
      db.optropicCode.count({
        where: { projectId, isActive: true },
      }),
      db.scan.count({
        where: {
          code: {
            projectId,
          },
        },
      }),
    ]);

    return {
      totalCodes: total,
      activeCodes: active,
      revokedCodes: total - active,
      totalScans: scans,
    };
  },

  /**
   * Verify and decrypt an encrypted code payload
   */
  async verifyEncryptedCode(
    codeValue: string,
    deviceId?: string,
    geoHash?: string
  ): Promise<{
    valid: boolean;
    trustScore: number;
    message: string;
    payload?: any;
    code?: any;
  }> {
    try {
      const decoded = JSON.parse(
        Buffer.from(codeValue, "base64url").toString("utf8")
      );

      const { e: entropySeed, s: signature, k: keyId, enc, iv, tag } = decoded;

      const code = await db.optropicCode.findFirst({
        where: { entropySeed },
        include: {
          key: true,
          project: true,
        },
      });

      if (!code) {
        return {
          valid: false,
          trustScore: 0,
          message: "Code not found",
        };
      }

      if (!code.isActive) {
        return {
          valid: false,
          trustScore: 0,
          message: "Code has been revoked",
        };
      }

      if (!code.key || !code.key.isActive) {
        return {
          valid: false,
          trustScore: 0,
          message: "Key is inactive or revoked",
        };
      }

      let payloadData: any = code.payload;

      if (enc && iv && tag) {
        try {
          payloadData = decryptPayload(enc, iv, tag);
        } catch (error) {
          return {
            valid: false,
            trustScore: 0,
            message: "Failed to decrypt payload",
          };
        }
      }

      const payloadHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(payloadData))
        .digest();

      const verify = crypto.createVerify("SHA256");
      verify.update(payloadHash);
      verify.end();

      const isValid = verify.verify(
        code.key.publicKey!,
        signature,
        "base64"
      );

      await db.scan.create({
        data: {
          codeId: code.id,
          deviceType: null,
          geoHash: geoHash || null,
          verificationSuccess: isValid,
          trustScore: isValid ? 100 : 0,
          isSuspicious: !isValid,
          riskScore: isValid ? 0 : 100,
        },
      });

      return {
        valid: isValid,
        trustScore: isValid ? 100 : 0,
        message: isValid ? "Verification successful" : "Invalid signature",
        payload: payloadData,
        code: {
          id: code.id,
          codeType: code.codeType,
          project: code.project.name,
        },
      };
    } catch (error) {
      return {
        valid: false,
        trustScore: 0,
        message: "Invalid code format",
      };
    }
  },
};
