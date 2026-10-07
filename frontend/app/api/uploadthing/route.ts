import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

const token = (process.env.UPLOADTHING_TOKEN || "").replace(/^["']|["']$/g, "").trim();

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: token || undefined,
  },
});