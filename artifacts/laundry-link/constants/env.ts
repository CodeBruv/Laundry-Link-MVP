
const isDev: boolean =
  typeof __DEV__ !== "undefined" ? (__DEV__ as boolean) : false;

type AppEnv = "development" | "staging" | "production";

function readEnv(key: string): string {
  return (process.env[key] ?? "").trim();
}

const PLACEHOLDER_PATTERNS = [
  "your_",
  "placeholder",
  "changeme",
  "example.supabase",
  "xxx",
  "todo",
];

function isPlaceholder(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

export const ENV = {
  SUPABASE_URL: readEnv("EXPO_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  PAYSTACK_PUBLIC_KEY: readEnv("EXPO_PUBLIC_PAYSTACK_KEY"),
  API_URL: readEnv("EXPO_PUBLIC_API_URL"),
  APP_ENV: (readEnv("EXPO_PUBLIC_APP_ENV") || "development") as AppEnv,
  ADMIN_PASSPHRASE: readEnv("EXPO_PUBLIC_ADMIN_PASSPHRASE"),
  IS_DEV: isDev,
} as const;

export const IS_SUPABASE_CONFIGURED =
  !isPlaceholder(ENV.SUPABASE_URL) && !isPlaceholder(ENV.SUPABASE_ANON_KEY);

export const IS_PAYSTACK_CONFIGURED = !isPlaceholder(ENV.PAYSTACK_PUBLIC_KEY);
export const IS_API_CONFIGURED = !isPlaceholder(ENV.API_URL);

export const IS_PRODUCTION = ENV.APP_ENV === "production";
export const IS_DEVELOPMENT = ENV.APP_ENV === "development" || isDev;

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!IS_SUPABASE_CONFIGURED) {
    errors.push(
      "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — app will run in demo mode.",
    );
  }

  if (!IS_PAYSTACK_CONFIGURED) {
    warnings.push(
      "EXPO_PUBLIC_PAYSTACK_KEY not set — payment flow is bank-transfer simulation only.",
    );
  }

  if (!IS_API_CONFIGURED) {
    warnings.push(
      "EXPO_PUBLIC_API_URL not set — webhooks, push dispatch, and server features are unavailable.",
    );
  }

  if (IS_PRODUCTION) {
    if (!IS_SUPABASE_CONFIGURED || !IS_PAYSTACK_CONFIGURED || !IS_API_CONFIGURED) {
      errors.push(
        "One or more required env vars are missing for PRODUCTION. Set EXPO_PUBLIC_APP_ENV=production only when all secrets are in place.",
      );
    }
    if (!ENV.ADMIN_PASSPHRASE || isPlaceholder(ENV.ADMIN_PASSPHRASE)) {
      errors.push(
        "EXPO_PUBLIC_ADMIN_PASSPHRASE is not set. Super admin unlock will be disabled.",
      );
    }
  }

  errors.forEach((msg) => console.error(`[PurePress ENV] ✗ ${msg}`));
  warnings.forEach((msg) => {
    if (IS_DEVELOPMENT) console.warn(`[PurePress ENV] ⚠ ${msg}`);
  });
}
