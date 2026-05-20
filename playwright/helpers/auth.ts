import { APIRequestContext, expect, Page } from "@playwright/test";
import { randomUUID } from "crypto";
import { config } from "../config";
import { User } from "models";

export type TestUsers = {
  userA: User;
  userB: User;
  userC: User;
};

type WindowWithAuthTestHooks = Window & {
  Cypress?: object;
  authService?: { send: (type: string, payload?: Record<string, string>) => void };
};

export async function getTestUser(request: APIRequestContext) {
  const res = await request.get(`${config.BACKEND_URL}/testData/users`);
  expect(res.ok()).toBeTruthy();
  const users = (await res.json()).results as User[];
  const testUser = users.find((u) => u.username === "Heath93");
  if (!testUser) {
    throw new Error("Heath93 username not present in database, failed to seed");
  }
  return testUser;
}

export async function getThreeUsers(request: APIRequestContext) {
  const res = await request.get(`${config.BACKEND_URL}/testData/users`);
  expect(res.ok()).toBeTruthy();

  const users = (await res.json()).results as User[];

  if (users.length < 2) {
    throw new Error("Need at least 2 seeded users — did global setup seed run?");
  }

  const userA = users[0];
  const userB = users[1];
  const userC = users[2];

  if (!userA|| !userB || !userC) {
    throw new Error(`failed to get users from testData`);
  }

  return { userA, userB, userC };
}

export async function getWorkerScopedUsers(request: APIRequestContext, workerIndex: number) {
  const res = await request.get(`${config.BACKEND_URL}/testData/users`);
  expect(res.ok()).toBeTruthy();

  const users = (await res.json()).results as User[];

  if (users.length < 3) {
    throw new Error("Need at least 3 seeded users — did global setup seed run?");
  }

  // Align with Cypress: userA = users[0], userB = users[1], userC = users[2]
  const testUser = users[workerIndex % config.SEEDED_USERS];
  const testContact = users[(workerIndex + 1) % config.SEEDED_USERS];
  const testUserC = users[(workerIndex + 2) % config.SEEDED_USERS];

  if (!testUser || !testContact || !testUserC) {
    throw new Error(`seeded users missing for workerIndex ${workerIndex}`);
  }

  return { testUser, testContact, testUserC };
}

export async function createUniqueUser(
  request: APIRequestContext,
  usernamePrefix = "user"
): Promise<User> {
  const uniqueUsername = `${usernamePrefix}${randomUUID()}`;
  const user: Partial<User> = {
    firstName: uniqueUsername,
    lastName: "tester",
    username: uniqueUsername,
    password: config.DEFAULT_PASSWORD,
    email: `${uniqueUsername}@example.com`,
    phoneNumber: "555-123-4567",
    balance: 10000,
    avatar: "https://api.dicebear.com/9.x/pixel-art/svg?seed=Jane",
  };

  const userRes = await request.post(`${config.BACKEND_URL}/users`, {
    headers: { "Content-Type": "application/json" },
    data: user,
  });
  expect(userRes.ok()).toBeTruthy();
  const { user: newUser } = (await userRes.json()) as { user: User };

  const loginRes = await request.post(`${config.BACKEND_URL}/login`, {
    headers: { "Content-Type": "application/json" },
    data: { username: newUser.username, password: config.DEFAULT_PASSWORD },
  });
  expect(loginRes.ok()).toBeTruthy();

  const bankRes = await request.post(`${config.BACKEND_URL}/bankAccounts`, {
    headers: { "Content-Type": "application/json" },
    data: {
      bankName: "Test Bank",
      accountNumber: "123456789",
      routingNumber: "123456789",
    },
  });
  expect(bankRes.ok()).toBeTruthy();

  return newUser;
}

/**
 * POST /login on the API host and store `connect.sid` on the browser context.
 *
 * This app still treats you as logged out until the XState auth machine reaches
 * `authorized` (see App.tsx). Use {@link loginAsUserWithClientState} for UI tests,
 * or trigger a real sign-in flow after this call.
 */
export async function apiLoginUser(username: string, password: string = "s3cret", page: Page) {
  const res = await page.request.post(`${config.BACKEND_URL}/login`, {
    data: {
      username: username,
      password: config.DEFAULT_PASSWORD ?? password,
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
  password: string = config.DEFAULT_PASSWORD ?? "s3cret"
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
  password: string = config.DEFAULT_PASSWORD ?? "s3cret"
) {
  await apiLoginUser(username, password, page);
  await syncClientAuthAfterSessionCookie(page, username, password);
  await expect(page.getByTestId("sidenav-user-balance")).toBeVisible();
}
