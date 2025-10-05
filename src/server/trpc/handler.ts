import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";
import { corsConfig } from "../middleware/cors";
import { logger, logError } from "../utils/logger";

const corsHeaders = {
  "Access-Control-Allow-Origin": corsConfig.origin[0] || "*",
  "Access-Control-Allow-Methods": corsConfig.methods.join(", "),
  "Access-Control-Allow-Headers": corsConfig.allowedHeaders.join(", "),
  "Access-Control-Allow-Credentials": "true",
};

export default async function handler(event: any) {
  const request = event.request || event;

  if (!request) {
    return new Response("No request", { status: 400 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext() {
        return { req: request };
      },
      onError({ error, path }) {
        logError(error, { path });
      },
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logError(error, { handler: "tRPC" });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}
