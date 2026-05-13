import { APIRequestContext, expect } from "@playwright/test";
import { BACKEND_URL } from "../config";

export async function reseedDatabase(request: APIRequestContext) {
  const res = await request.post(`${BACKEND_URL}/testData/seed`);
  expect(res.status()).toBeTruthy();
}
