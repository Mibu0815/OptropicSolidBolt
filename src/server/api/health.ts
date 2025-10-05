/**
 * Health Check Endpoint
 * ---------------------
 * Simple health check for monitoring systems
 */

import { db } from "../db";

export default async function handler(event: any) {
  try {
    await db.$queryRaw`SELECT 1`;

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      database: "connected",
    };

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const health = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(health), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
