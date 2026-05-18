export const config = {
  FRONTEND_URL: `http://localhost:${envOrThrow("PORT")}`,
  BACKEND_URL: `http://localhost:${envOrThrow("VITE_BACKEND_PORT")}`,
  BACKEND_HEALTH_URL: `http://localhost:${envOrThrow("VITE_BACKEND_PORT")}/graphql`,
  DEFAULT_PASSWORD: envOrThrow("SEED_DEFAULT_USER_PASSWORD") || "",
  SEEDED_USERS: Number(envOrThrow("SEED_USERBASE_SIZE")),
};

export function envOrThrow(key: string) {
  if (!process.env[key]) {
    throw new Error(`ENV variable ${key} missing from .env`);
  }
  return process.env[key];
}
