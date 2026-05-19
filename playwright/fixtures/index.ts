import { test as base } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { createUniqueUser, getWorkerScopedUsers, loginWithXState } from "../helpers/auth";
import { User } from "models";
import { SignUpPage } from "../pages/SignUpPage";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { Navigation } from "../components/Navigation";
import type { WorkerScopedUsers } from "../helpers/auth";
import { config } from "../config";
import { TransactionDetailPage } from "../pages/TransactionDetailPage";

type Fixtures = {
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  homePage: HomePage;
  bankAccountsPage: BankAccountsPage;
  newTransactionPage: NewTransactionPage;
  transactionDetailPage: TransactionDetailPage;
  navigation: Navigation;
  workerUsers: WorkerScopedUsers;
  testUser: User;
  testContact: User;
  loggedInTestUser: User;
  uniqueLoggedInUser: User;
  uniqueContact: User;
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
  transactionDetailPage: async ({ page }, use) => {
    const transactionDetailPage = new TransactionDetailPage(page);
    await use(transactionDetailPage);
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
