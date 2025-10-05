/**
 * Metrics Endpoint
 * ----------------
 * Exposes Prometheus-compatible metrics
 */

import { getMetrics, getContentType } from "../services/metricsService";

export default async function handler(event: any) {
  try {
    const metrics = await getMetrics();
    const contentType = getContentType();

    return new Response(metrics, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating metrics:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
