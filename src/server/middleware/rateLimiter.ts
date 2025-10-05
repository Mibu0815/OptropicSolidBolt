/**
 * Rate Limiting Middleware
 * ------------------------
 * Protects API endpoints from abuse by limiting request rates per IP
 */

import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again in 1 minute.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Rate limit exceeded. Please slow down your requests.",
  standardHeaders: true,
  legacyHeaders: false,
});
