import { test as base, expect } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { getWorkerScopedUsers, loginWithXState } from "../helpers/auth";
import { User } from "models";
import { SignUpPage } from "../pages/SignUpPage";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { Navigation } from "../components/Navigation";
import type { WorkerScopedUsers } from "../helpers/auth";
import { randomUUID } from "crypto";
import { config } from "../config";

type Fixtures = {
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  homePage: HomePage;
  bankAccountsPage: BankAccountsPage;
  newTransactionPage: NewTransactionPage;
  navigation: Navigation;
  workerUsers: WorkerScopedUsers;
  testUser: User;
  testContact: User;
  loggedInTestUser: User;
  uniqueLoggedInUser: User;
};

export const test = base.extend<Fixtures>({
  signInPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await use(signInPage);
  },
  signUpPage: async ({ page }, use) => {
    const signUpPage = new SignUpPage(page);
    await use(signUpPage);
  },
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  bankAccountsPage: async ({ page }, use) => {
    const bankAccountsPage = new BankAccountsPage(page);
    await use(bankAccountsPage);
  },
  newTransactionPage: async ({ page }, use) => {
    const newTransactionPage = new NewTransactionPage(page);
    await use(newTransactionPage);
  },
  navigation: async ({ page }, use) => {
    const navigation = new Navigation(page);
    await use(navigation);
  },
  workerUsers: async ({ request }, use, testInfo) => {
    const pair = await getWorkerScopedUsers(request, testInfo.workerIndex);
    await use(pair);
  },
  testUser: async ({ workerUsers }, use) => {
    await use(workerUsers.testUser);
  },
  testContact: async ({ workerUsers }, use) => {
    await use(workerUsers.testContact);
  },
  loggedInTestUser: async ({ page, testUser }, use) => {
    await loginWithXState(page, testUser.username, process.env.TEST_PASSWORD);
    await use(testUser);
  },
  uniqueLoggedInUser: async ({ page, request }, use) => {
    const uniqueUsername = `user${randomUUID()}`;
    const user: Partial<User> = {
      firstName: "test",
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

    // create bank account so we can skip onboarding dialog
    // /bankAccounts route requires auth, so we login via API
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

    // still need to login with browser
    await loginWithXState(page, newUser.username, config.DEFAULT_PASSWORD);
    await use(newUser);
  },
});

export { expect } from "@playwright/test";
