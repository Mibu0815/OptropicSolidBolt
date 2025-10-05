import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";

export default async function handler(event: any) {
  const request = event.request || event;

  if (!request) {
    return new Response("No request", { status: 400 });
  }

  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    createContext() {
      return { req: request };
    },
    onError({ error, path }) {
      console.error(`tRPC error on '${path}':`, error);
    },
  });
}
