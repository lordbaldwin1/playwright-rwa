import { test as base } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { getTestUser } from "../helpers/auth";
import { User } from "models";
import { SignUpPage } from "../pages/SignUpPage";

type Fixtures = {
  signInPage: SignInPage;
  signUpPage: SignUpPage;
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
  testUser: async ({ request }, use) => {
    const user = await getTestUser(request);
    await use(user);
  },
});

export { expect } from "@playwright/test";
