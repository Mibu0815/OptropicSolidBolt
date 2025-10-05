/**
 * Optropic Platform – Verification Service
 * ----------------------------------------
 * Responsibilities:
 *  - Verify scanned codes
 *  - Validate signatures
 *  - Calculate trust scores
 *  - Log scan events
 *  - Detect suspicious activity
 */

import { db } from "../db";
import { verifySignature } from "./keyService";
import { CodeService } from "./codeService";
import { NotificationService } from "./notificationService";
import { logger, logError } from "../utils/logger";

export interface VerificationRequest {
  codeValue: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: "MOBILE" | "DESKTOP" | "TABLET" | "IOT_DEVICE" | "SCANNER";
  geoHash?: string;
  country?: string;
  city?: string;
  region?: string;
}

export interface VerificationResult {
  success: boolean;
  trustScore: number;
  message: string;
  isSuspicious: boolean;
  code?: {
    id: number;
    codeType: string;
    encryptionLevel: string;
    createdAt: Date;
  };
  project?: {
    id: number;
    name: string;
  };
}

/**
 * Calculate trust score based on various factors
 */
function calculateTrustScore(code: any): number {
  let score = 100;

  const ageInDays =
    (Date.now() - new Date(code.createdAt).getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays > 365) {
    score -= 20;
  } else if (ageInDays > 180) {
    score -= 10;
  }

  if (code.key?.expiresAt && new Date(code.key.expiresAt) < new Date()) {
    score -= 30;
  }

  if (
    code.encryptionLevel === "AES_128" ||
    code.encryptionLevel === "RSA_2048"
  ) {
    score -= 10;
  }

  if (!code.key?.isActive) {
    score -= 50;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Log scan event to database
 */
async function logScan(data: {
  codeId?: number;
  verificationSuccess: boolean;
  trustScore: number;
  isSuspicious: boolean;
  riskScore: number;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: "MOBILE" | "DESKTOP" | "TABLET" | "IOT_DEVICE" | "SCANNER";
  geoHash?: string;
  country?: string;
  city?: string;
  region?: string;
}) {
  if (!data.codeId) {
    return;
  }

  await db.scan.create({
    data: {
      codeId: data.codeId,
      verificationSuccess: data.verificationSuccess,
      trustScore: data.trustScore,
      isSuspicious: data.isSuspicious,
      riskScore: data.riskScore,
      failureReason: data.failureReason,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: data.deviceType,
      geoHash: data.geoHash,
      country: data.country,
      city: data.city,
      region: data.region,
    },
  });
}

export const VerificationService = {
  /**
   * Verify a scanned code
   */
  async verifyCode(
    request: VerificationRequest
  ): Promise<VerificationResult> {
    try {
      const decodedPayload = JSON.parse(
        Buffer.from(request.codeValue, "base64url").toString("utf8")
      );

      const { e: entropySeed, s: signature, k: keyId } = decodedPayload;

      const code = await db.optropicCode.findFirst({
        where: { entropySeed },
        include: {
          key: true,
          project: true,
        },
      });

      if (!code) {
        await logScan({
          verificationSuccess: false,
          failureReason: "Code not found",
          trustScore: 0,
          isSuspicious: true,
          riskScore: 100,
          ...request,
        });

        return {
          success: false,
          trustScore: 0,
          message: "Code not found",
          isSuspicious: true,
        };
      }

      if (!code.isActive) {
        await logScan({
          codeId: code.id,
          verificationSuccess: false,
          failureReason: "Code revoked",
          trustScore: 0,
          isSuspicious: true,
          riskScore: 90,
          ...request,
        });

        NotificationService.triggerRevokedCodeUsage(
          code.id,
          code.project.userId
        ).catch((err) =>
          logError(err, { codeId: code.id, userId: code.project.userId })
        );

        return {
          success: false,
          trustScore: 0,
          message: "Code has been revoked",
          isSuspicious: true,
        };
      }

      if (!code.key || !code.key.isActive) {
        await logScan({
          codeId: code.id,
          verificationSuccess: false,
          failureReason: "Key inactive or revoked",
          trustScore: 0,
          isSuspicious: true,
          riskScore: 95,
          ...request,
        });

        return {
          success: false,
          trustScore: 0,
          message: "Key is inactive or revoked",
          isSuspicious: true,
        };
      }

      const payloadString = JSON.stringify(code.payload);
      const isValid = verifySignature(
        payloadString,
        signature,
        code.key.publicKey!
      );

      if (!isValid) {
        await logScan({
          codeId: code.id,
          verificationSuccess: false,
          failureReason: "Invalid signature",
          trustScore: 0,
          isSuspicious: true,
          riskScore: 100,
          ...request,
        });

        return {
          success: false,
          trustScore: 0,
          message: "Invalid signature",
          isSuspicious: true,
        };
      }

      const trustScore = calculateTrustScore(code);

      await logScan({
        codeId: code.id,
        verificationSuccess: true,
        trustScore,
        isSuspicious: trustScore < 50,
        riskScore: 100 - trustScore,
        ...request,
      });

      return {
        success: true,
        trustScore,
        message: "Code verified successfully",
        isSuspicious: false,
        code: {
          id: code.id,
          codeType: code.codeType,
          encryptionLevel: code.encryptionLevel,
          createdAt: code.createdAt,
        },
        project: {
          id: code.project.id,
          name: code.project.name,
        },
      };
    } catch (error) {
      await logScan({
        verificationSuccess: false,
        failureReason: "Invalid code format",
        trustScore: 0,
        isSuspicious: true,
        riskScore: 100,
        ...request,
      });

      return {
        success: false,
        trustScore: 0,
        message: "Invalid code format",
        isSuspicious: true,
      };
    }
  },

  /**
   * Get scan history for a project
   */
  async getScanHistory(
    projectId: number,
    limit: number = 100,
    offset: number = 0
  ) {
    const scans = await db.scan.findMany({
      where: {
        code: {
          projectId,
        },
      },
      include: {
        code: {
          select: {
            id: true,
            codeValue: true,
            codeType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await db.scan.count({
      where: {
        code: {
          projectId,
        },
      },
    });

    return {
      scans: scans.map((scan) => ({
        id: scan.id,
        code: scan.code,
        verificationSuccess: scan.verificationSuccess,
        trustScore: scan.trustScore,
        isSuspicious: scan.isSuspicious,
        riskScore: scan.riskScore,
        failureReason: scan.failureReason,
        deviceType: scan.deviceType,
        country: scan.country,
        city: scan.city,
        region: scan.region,
        createdAt: scan.createdAt,
      })),
      total,
      limit,
      offset,
    };
  },

  /**
   * Get scan statistics for a project
   */
  async getScanStats(projectId: number) {
    const [total, successful, suspicious, avgTrustScore] = await Promise.all([
      db.scan.count({
        where: {
          code: {
            projectId,
          },
        },
      }),
      db.scan.count({
        where: {
          code: {
            projectId,
          },
          verificationSuccess: true,
        },
      }),
      db.scan.count({
        where: {
          code: {
            projectId,
          },
          isSuspicious: true,
        },
      }),
      db.scan.aggregate({
        where: {
          code: {
            projectId,
          },
          trustScore: {
            not: null,
          },
        },
        _avg: {
          trustScore: true,
        },
      }),
    ]);

    return {
      totalScans: total,
      successfulScans: successful,
      failedScans: total - successful,
      suspiciousScans: suspicious,
      averageTrustScore: avgTrustScore._avg.trustScore || 0,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
    };
  },

  /**
   * Detect suspicious patterns
   */
  async detectSuspiciousActivity(projectId: number, timeWindowHours = 24) {
    const timeThreshold = new Date(
      Date.now() - timeWindowHours * 60 * 60 * 1000
    );

    const suspiciousScans = await db.scan.findMany({
      where: {
        code: {
          projectId,
        },
        createdAt: {
          gte: timeThreshold,
        },
        OR: [
          { isSuspicious: true },
          { verificationSuccess: false },
          { trustScore: { lt: 50 } },
        ],
      },
      include: {
        code: {
          select: {
            id: true,
            codeValue: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const ipFrequency: Record<string, number> = {};
    suspiciousScans.forEach((scan) => {
      if (scan.ipAddress) {
        ipFrequency[scan.ipAddress] = (ipFrequency[scan.ipAddress] || 0) + 1;
      }
    });

    const suspiciousIPs = Object.entries(ipFrequency)
      .filter(([_, count]) => count > 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalSuspicious: suspiciousScans.length,
      recentScans: suspiciousScans.slice(0, 20),
      suspiciousIPs,
      timeWindow: `${timeWindowHours}h`,
    };
  },
};
