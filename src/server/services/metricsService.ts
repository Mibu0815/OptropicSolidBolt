/**
 * Metrics Service - Prometheus Integration
 * -----------------------------------------
 * Collects and exposes application metrics for monitoring
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

const register = new Registry();

collectDefaultMetrics({
  register,
  prefix: "optropic_",
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

export const httpRequestDuration = new Histogram({
  name: "optropic_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: "optropic_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const trpcCallDuration = new Histogram({
  name: "optropic_trpc_call_duration_seconds",
  help: "Duration of tRPC calls in seconds",
  labelNames: ["procedure", "status"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const trpcCallTotal = new Counter({
  name: "optropic_trpc_calls_total",
  help: "Total number of tRPC calls",
  labelNames: ["procedure", "status"],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: "optropic_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: "optropic_db_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "table"],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: "optropic_active_connections",
  help: "Number of active connections",
  registers: [register],
});

export const errorTotal = new Counter({
  name: "optropic_errors_total",
  help: "Total number of errors",
  labelNames: ["type", "severity"],
  registers: [register],
});

export const authAttempts = new Counter({
  name: "optropic_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["status"],
  registers: [register],
});

export const codeScans = new Counter({
  name: "optropic_code_scans_total",
  help: "Total number of code scans",
  labelNames: ["status", "code_type"],
  registers: [register],
});

export const keyOperations = new Counter({
  name: "optropic_key_operations_total",
  help: "Total number of key operations",
  labelNames: ["operation", "key_type"],
  registers: [register],
});

export const cacheHitRate = new Counter({
  name: "optropic_cache_operations_total",
  help: "Total cache operations",
  labelNames: ["result"],
  registers: [register],
});

export function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register };
