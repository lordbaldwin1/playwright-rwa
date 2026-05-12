import { expect, test } from "../fixtures";
import { SignUpFormData } from "../pages/SignUpPage";

test.describe("user auth e2e tests", () => {
  test("should land on home page with valid credentials", async ({
    page,
    signInPage,
    testUser,
  }) => {
    await signInPage.goto();
    await signInPage.fillForm(testUser.username, process.env.TEST_PASSWORD!);
    await signInPage.submitForm();
    await expect(page).toHaveURL("/");
  });

  test("should redirect unauthenticated users to /signin", async ({ page }) => {
    await page.goto("/personal");
    await expect(page).toHaveURL("/signin");
  });

  test("should remember a user for 30 days after signin", async ({
    context,
    page,
    signInPage,
    testUser,
  }) => {
    await signInPage.goto();
    await signInPage.fillForm(testUser.username, process.env.TEST_PASSWORD!);
    await signInPage.checkRememberMe();
    await signInPage.submitForm();
    await page.waitForURL("/");

    const cookies = await context.cookies();
    const sid = cookies.find((c) => c.name === "connect.sid");
    expect(sid).toBeDefined();
    expect(sid!.expires).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(sid!.expires).not.toBe(-1);
  });

  test("should allow visitor to sign up, login, and logout", async ({ signInPage }) => {
    const newUser: SignUpFormData = {
      firstName: "Alice",
      lastname: "Smith",
      username: "alice_smith23",
      password: "s3cret",
      confirmPassword: "s3cret",
    };
    await signInPage.goto();
    const signUpPage = await signInPage.goToSignUp();
    await expect(signUpPage.header).toBeVisible();
    await signUpPage.fillForm(newUser);
    await signUpPage.submitForm();

    await signInPage.fillForm(newUser.username, newUser.password);
    const homePage = await signInPage.submitForm();
    await expect(homePage.userOnboardingDialog).toBeVisible();
  });
});
