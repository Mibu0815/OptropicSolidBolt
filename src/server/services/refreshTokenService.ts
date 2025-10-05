/**
 * Refresh Token Service
 * ---------------------
 * Manages refresh token generation, validation, and revocation
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { env } from "../env";
import { logger } from "../utils/logger";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY_HOURS = 1;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate a new refresh token (raw value + hashed storage)
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash refresh token before storage
 */
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Verify refresh token against stored hash
 */
async function verifyTokenHash(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Generate JWT access token
 */
function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: `${ACCESS_TOKEN_EXPIRY_HOURS}h`,
  });
}

/**
 * Create refresh token pair (access + refresh)
 */
export async function createTokenPair(userId: number): Promise<TokenPair> {
  const refreshToken = generateRefreshToken();
  const tokenHash = await hashToken(refreshToken);
  const accessToken = generateAccessToken(userId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  logger.info({ userId }, "Created refresh token");

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_HOURS * 3600,
  };
}

/**
 * Validate and refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const tokens = await db.refreshToken.findMany({
    where: {
      revoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      },
    },
  });

  for (const tokenRecord of tokens) {
    const isValid = await verifyTokenHash(refreshToken, tokenRecord.tokenHash);

    if (isValid) {
      if (!tokenRecord.user.isActive) {
        logger.warn(
          { userId: tokenRecord.userId },
          "Inactive user attempted token refresh"
        );
        return null;
      }

      const accessToken = generateAccessToken(tokenRecord.userId);

      logger.info({ userId: tokenRecord.userId }, "Refreshed access token");

      return {
        accessToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_HOURS * 3600,
      };
    }
  }

  logger.warn("Invalid refresh token attempt");
  return null;
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(
  refreshToken: string,
  userId: number
): Promise<boolean> {
  const tokens = await db.refreshToken.findMany({
    where: {
      userId,
      revoked: false,
    },
  });

  for (const tokenRecord of tokens) {
    const isValid = await verifyTokenHash(refreshToken, tokenRecord.tokenHash);

    if (isValid) {
      await db.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });

      logger.info({ userId, tokenId: tokenRecord.id }, "Revoked refresh token");
      return true;
    }
  }

  return false;
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: number): Promise<number> {
  const result = await db.refreshToken.updateMany({
    where: {
      userId,
      revoked: false,
    },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });

  logger.info(
    { userId, count: result.count },
    "Revoked all user refresh tokens"
  );

  return result.count;
}

/**
 * Cleanup expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db.refreshToken.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          revoked: true,
          revokedAt: {
            lt: thirtyDaysAgo,
          },
        },
      ],
    },
  });

  logger.info({ count: result.count }, "Cleaned up expired refresh tokens");

  return result.count;
}
