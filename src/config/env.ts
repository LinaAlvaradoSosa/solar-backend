import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  EMAIL_TRANSPORT: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  HOT_LEAD_EMAIL_TO: z.string().email(),
  HOT_LEAD_EMAIL_FROM: z.string().email(),
  CALENDAR_TRANSPORT: z.enum(['mock', 'google']).default('mock'),
  CALENDAR_TIME_ZONE: z.string().default('America/Denver'),
  CALENDAR_WORKDAY_START_HOUR: z.coerce.number().int().min(0).max(23).default(9),
  CALENDAR_WORKDAY_END_HOUR: z.coerce.number().int().min(1).max(24).default(17),
  CALENDAR_SLOT_DURATION_MINUTES: z.coerce.number().int().positive().default(15),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional()
});

export const env = envSchema.parse(process.env);
