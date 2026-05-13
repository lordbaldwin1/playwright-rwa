import { test as base } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { getTestUser } from "../helpers/auth";
import { User } from "models";
import { SignUpPage } from "../pages/SignUpPage";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";

type Fixtures = {
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  homePage: HomePage;
  bankAccountsPage: BankAccountsPage;
  testUser: User;
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
  testUser: async ({ request }, use) => {
    const user = await getTestUser(request);
    await use(user);
  },
});

export { expect } from "@playwright/test";
