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
    HOT_LEAD_EMAIL_FROM: z.string().email()
});
export const env = envSchema.parse(process.env);
