import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(24).optional(),
  APP_URL: z.string().url().optional(),
  OTP_PROVIDER: z.string().default("mock"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  INTERAKT_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);

export function requireEnv(name: keyof typeof env) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
