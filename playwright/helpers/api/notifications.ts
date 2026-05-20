import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../../config";

export async function getNotificationCount(
  request: APIRequestContext,
  username: string,
  password: string
) {
  const loginRes = await request.post(`${config.BACKEND_URL}/login`, {
    headers: { "Content-Type": "application/json" },
    data: { username, password },
  });
  expect(loginRes.ok()).toBeTruthy();

  const res = await request.get(`${config.BACKEND_URL}/notifications`);
  expect(res.ok()).toBeTruthy();

  const { results } = await res.json();
  return results.length;
}
