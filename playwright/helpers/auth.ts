import { APIRequestContext, expect, Page } from "@playwright/test";
import { BACKEND_URL } from "../config";
import { User } from "models";

export type WorkerScopedUsers = {
  testUser: User;
  testContact: User;
};

type WindowWithAuthTestHooks = Window & {
  Cypress?: object;
  authService?: { send: (type: string, payload?: Record<string, string>) => void };
};

export async function getTestUser(request: APIRequestContext) {
  const res = await request.get(`${BACKEND_URL}/testData/users`);
  expect(res.status()).toBeTruthy();
  const users = (await res.json()).results as User[];
  const testUser = users.find((u) => u.username === "Heath93");
  if (!testUser) {
    throw new Error("Heath93 username not present in database, failed to seed");
  }
  return testUser;
}

export async function getWorkerScopedUsers(
  request: APIRequestContext,
  workerIndex: number,
): Promise<WorkerScopedUsers> {
  const res = await request.get(`${BACKEND_URL}/testData/users`);
  expect(res.ok()).toBeTruthy();

  const users = (await res.json()).results as User[];

  if (users.length < 2) {
    throw new Error("Need at least 2 seeded users — did global setup seed run?");
  }

  const payerCount = users.length - 1;
  const testUser = users[workerIndex % payerCount];
  const testContact = users[users.length - 1];

  return { testUser, testContact };
}

/**
 * POST /login on the API host and store `connect.sid` on the browser context.
 *
 * This app still treats you as logged out until the XState auth machine reaches
 * `authorized` (see App.tsx). Use {@link loginAsUserWithClientState} for UI tests,
 * or trigger a real sign-in flow after this call.
 */
export async function apiLoginUser(username: string, password: string = "s3cret", page: Page) {
  const res = await page.request.post(`${BACKEND_URL}/login`, {
    data: {
      username: username,
      password: process.env.TEST_PASSWORD ?? password,
    },
  });
  expect(res.ok()).toBeTruthy();
}

/**
 * Sets `window.Cypress` so App.tsx exposes `window.authService` (same hook Cypress uses),
 * then drives LOGIN so XState matches the session cookie.
 *
 * Call after {@link apiLoginUser} if you already established the cookie; otherwise this
 * performs a normal LOGIN (POST /login via the app) and is enough on its own.
 */
export async function syncClientAuthAfterSessionCookie(
  page: Page,
  username: string,
  password: string = process.env.TEST_PASSWORD ?? "s3cret"
) {
  await page.addInitScript(() => {
    const w = window as WindowWithAuthTestHooks;
    w.Cypress = w.Cypress ?? {};
  });

  await page.goto("/signin");

  await page.waitForFunction(
    () => typeof (window as WindowWithAuthTestHooks).authService?.send === "function",
    undefined,
    { timeout: 10_000 }
  );

  await page.evaluate(
    ({ username, password }) => {
      const w = window as WindowWithAuthTestHooks;
      w.authService!.send("LOGIN", { username, password });
    },
    { username, password }
  );

  await expect(page.getByTestId("list-skeleton")).toBeHidden({ timeout: 15_000 });
}

/** API session cookie + XState `authorized` (required for this SPA). */
export async function loginWithXState(
  page: Page,
  username: string,
  password: string = process.env.TEST_PASSWORD ?? "s3cret"
) {
  await apiLoginUser(username, password, page);
  await syncClientAuthAfterSessionCookie(page, username, password);
}
