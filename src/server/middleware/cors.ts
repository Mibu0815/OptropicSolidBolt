/**
 * CORS Configuration
 * ------------------
 * Configures Cross-Origin Resource Sharing for the API
 */

import cors from "cors";
import { env } from "../env";

const isDevelopment = env.NODE_ENV === "development";

const allowedOrigins = isDevelopment
  ? [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ]
  : [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});

export const corsConfig = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
