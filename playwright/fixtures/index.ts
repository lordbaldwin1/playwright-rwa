import { test as base } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { createUniqueUser, getThreeUsers, loginWithXState } from "../helpers/auth";
import { User } from "models";
import { SignUpPage } from "../pages/SignUpPage";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import type { TestUsers } from "../helpers/auth";
import { config } from "../config";
import { TransactionDetailPage } from "../pages/TransactionDetailPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { UserSettingsPage } from "../pages/UserSettingsPage";
import { reseedDatabase } from "../helpers/database";

type Fixtures = {
  _reseedDatabase: void;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  homePage: HomePage;
  bankAccountsPage: BankAccountsPage;
  newTransactionPage: NewTransactionPage;
  transactionDetailPage: TransactionDetailPage;
  notificationsPage: NotificationsPage;
  userSettingsPage: UserSettingsPage;
  threeTestUsers: TestUsers;
  testUser: User;
  testContact: User;
  testUserC: User;
  loggedInTestUser: User;
  loggedInTestUserC: User;
  uniqueLoggedInUser: User;
  uniqueContact: User;
};

export const test = base.extend<Fixtures>({
  _reseedDatabase: [
    async ({ request }, use) => {
      await reseedDatabase(request);
      await use();
    },
    { auto: true },
  ],
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
  transactionDetailPage: async ({ page }, use) => {
    const transactionDetailPage = new TransactionDetailPage(page);
    await use(transactionDetailPage);
  },
  notificationsPage: async ({ page }, use) => {
    const notificationsPage = new NotificationsPage(page);
    await use(notificationsPage);
  },
  userSettingsPage: async ({ page }, use) => {
    const userSettingsPage = new UserSettingsPage(page);
    await use(userSettingsPage);
  },
  threeTestUsers: async ({ request }, use) => {
    const users = await getThreeUsers(request);
    await use(users);
  },
  testUser: async ({ threeTestUsers }, use) => {
    await use(threeTestUsers.userA);
  },
  testContact: async ({ threeTestUsers }, use) => {
    await use(threeTestUsers.userB);
  },
  testUserC: async ({ threeTestUsers }, use) => {
    await use(threeTestUsers.userC);
  },
  loggedInTestUser: async ({ page, testUser }, use) => {
    await loginWithXState(page, testUser.username, process.env.TEST_PASSWORD);
    await use(testUser);
  },
  uniqueLoggedInUser: async ({ page, request }, use) => {
    const newUser = await createUniqueUser(request);
    await loginWithXState(page, newUser.username, config.DEFAULT_PASSWORD);
    await use(newUser);
  },
  uniqueContact: async ({ request }, use) => {
    const contact = await createUniqueUser(request, "contact");
    await use(contact);
  },
});

export { expect } from "@playwright/test";
