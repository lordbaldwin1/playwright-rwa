export const FRONTEND_URL = `http://localhost:${process.env.PORT}`;
export const BACKEND_URL = `http://localhost:${process.env.VITE_BACKEND_PORT}`;
export const BACKEND_HEALTH_URL = `http://localhost:${process.env.VITE_BACKEND_PORT}/graphql`;
export const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_USER_PASSWORD || "";
