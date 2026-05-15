import { expect, test } from "../../fixtures";
import { getTestUser, loginWithXState } from "../../helpers/auth";
import { reseedDatabase } from "../../helpers/database";
import { SignUpFormData } from "../../pages/SignUpPage";

test.describe("user auth e2e tests", () => {  
  test("should land on home after API login and XState sync", async ({ page, request }) => {
    const user = await getTestUser(request);
    await loginWithXState(page, user.username);
    await expect(page).toHaveURL("/");
  });

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
    const workerIdx = test.info().workerIndex;
    const newUser: SignUpFormData = {
      firstName: "Alice",
      lastname: "Smith",
      username: `ansel${workerIdx}`,
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
    await expect(homePage.listSkeleton).toBeHidden();
    await expect(homePage.nav.notificationsCount).toBeVisible();
    await homePage.goNextOnboardingScreen();

    await expect(homePage.userOnboardingDialogTitle).toContainText("Create Bank Account");

    await homePage.fillBankDetails({
      bankName: "The Best Bank",
      accountNumber: "123456789",
      routingNumber: "987654321",
    });
    await homePage.submitBankDetails();

    await expect(homePage.userOnboardingDialogTitle).toContainText("Finished");
    await expect(homePage.userOnboardingDialogContent).toContainText("You're all set!");
    await homePage.goNextOnboardingScreen();

    await expect(homePage.transactionList).toBeVisible();

    if (homePage.isMobile()) {
      await homePage.nav.openSideNav();
    }
    await homePage.nav.signOut();
    await expect(signInPage.header).toBeVisible();
  });

  test("should display login errors", async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.fillForm("user", "tester123");
    await signInPage.fillForm("", "123");

    await expect(signInPage.usernameError).toBeVisible();
    await expect(signInPage.usernameError).toHaveText("Username is required");

    await expect(signInPage.passwordError).toBeVisible();
    await expect(signInPage.passwordError).toHaveText(
      "Password must contain at least 4 characters"
    );

    await expect(signInPage.signInButton).toBeDisabled();
  });

  test("should display signup errors", async ({ signUpPage }) => {
    await signUpPage.goto();
    await signUpPage.fillForm({
      firstName: "john",
      lastname: "deadlock",
      username: "thebrahms",
      password: "s3cret",
      confirmPassword: "s3cret",
    });
    await signUpPage.fillForm({
      firstName: "",
      lastname: "",
      username: "",
      password: "",
      confirmPassword: "paige",
    });

    await expect(signUpPage.firstNameError).toBeVisible();
    await expect(signUpPage.firstNameError).toHaveText("First Name is required");

    await expect(signUpPage.lastNameError).toBeVisible();
    await expect(signUpPage.lastNameError).toHaveText("Last Name is required");

    await expect(signUpPage.usernameError).toBeVisible();
    await expect(signUpPage.usernameError).toHaveText("Username is required");

    await expect(signUpPage.passwordError).toBeVisible();
    await expect(signUpPage.passwordError).toHaveText("Enter your password");

    await expect(signUpPage.confirmPasswordError).toBeVisible();
    await expect(signUpPage.confirmPasswordError).toHaveText("Password does not match");
  });
});
