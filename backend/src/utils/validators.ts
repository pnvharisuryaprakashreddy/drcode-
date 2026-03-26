import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.string().default("development"),
  FRONTEND_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().min(10).optional(),

  TELEGRAM_BOT_TOKEN: z.string().min(10).optional(),
  TELEGRAM_WEBHOOK_URL: z.string().min(10).optional(),

  UPLOAD_DIR: z.string().min(1).default("./uploads"),
  GENERATED_DIR: z.string().min(1).default("./generated"),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  FILE_CLEANUP_HOURS: z.coerce.number().int().positive().default(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment variables: ${message}`);
  }
  return parsed.data;
}

