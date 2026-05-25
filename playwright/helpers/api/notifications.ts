import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../../config";
import { NotificationType } from "models";

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

export async function getNotifications(request: APIRequestContext) {
  const res = await request.get(`${config.BACKEND_URL}/testdata/notifications`);
  expect(res.ok()).toBeTruthy();
  const { results: notifications } = await res.json() as { results: NotificationType[] };
  return notifications;
}
