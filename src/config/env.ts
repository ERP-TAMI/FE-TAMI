import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().or(z.literal("/api")).default("/api"),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  VITE_APP_NAME: z.string().min(1).default("TAMI ERP"),
});

export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
});

export type AppEnv = typeof env;
