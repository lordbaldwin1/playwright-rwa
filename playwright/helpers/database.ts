import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../config";

export async function reseedDatabase(request: APIRequestContext) {
  const res = await request.post(`${config.BACKEND_URL}/testData/seed`);
  expect(res.status()).toBeTruthy();
}
