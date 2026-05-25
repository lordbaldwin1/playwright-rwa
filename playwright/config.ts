export const config = {
  FRONTEND_URL: `http://localhost:${envOrThrow("PORT")}`,
  BACKEND_URL: `http://localhost:${envOrThrow("VITE_BACKEND_PORT")}`,
  BACKEND_HEALTH_URL: `http://localhost:${envOrThrow("VITE_BACKEND_PORT")}/graphql`,
  DEFAULT_PASSWORD: envOrThrow("SEED_DEFAULT_USER_PASSWORD") || "",
  SEEDED_USERS: Number(envOrThrow("SEED_USERBASE_SIZE")),
  /** Notifications per seeded user (users[0..2]) in database-seed.json */
  SEEDED_NOTIFICATION_COUNT: 8,
  /** After a like or comment, one notification is added */
  NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION: 9,
  PAGINATION_PAGE_SIZE: Number(envOrThrow("PAGINATION_PAGE_SIZE")),
  API_AUTH_FILE_PATH: envOrThrow("API_AUTH_FILE_PATH"),
};

export function envOrThrow(key: string) {
  if (!process.env[key]) {
    throw new Error(`ENV variable ${key} missing from .env`);
  }
  return process.env[key];
}
