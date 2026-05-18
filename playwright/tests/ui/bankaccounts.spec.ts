import { expect, test } from "../../fixtures";

test.describe("bank accounts e2e tests", () => {
  test("creates a new bank account", async ({ loggedInTestUser: _user, homePage }) => {
    const workerIdx = test.info().workerIndex;
    const bankName = `The Best Bank W${workerIdx}`;

    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(bankAccountsPage.bankAccountListItems.first()).toBeVisible();

    await bankAccountsPage.createNewBankAccount();

    await bankAccountsPage.fillBankAccountForm({
      bankName,
      routingNumber: "123456789",
      accountNumber: "987654321",
    });
    await expect(bankAccountsPage.bankAccountSaveButton).toBeEnabled();
    
    await bankAccountsPage.saveBankAccount();
    await expect(bankAccountsPage.bankAccountListItems).not.toHaveCount(1);
    
    const bankAccount = await bankAccountsPage.findBankAccount(bankName);
    await expect(bankAccount).toBeVisible();
  });

  test("should display bank account form errors", async ({ loggedInTestUser: _user, homePage }) => {
    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(bankAccountsPage.header).toBeVisible();
    await bankAccountsPage.createNewBankAccount();

    // min 5 bankName, min 9 routing/account number
    await bankAccountsPage.fillBankAccountForm({
      bankName: "the",
      routingNumber: "123",
      accountNumber: "123",
    });
    await expect(bankAccountsPage.bankNameError).toHaveText("Must contain at least 5 characters");
    await expect(bankAccountsPage.routingNumberError).toHaveText("Must contain a valid routing number");
    await expect(bankAccountsPage.accountNumberError).toHaveText("Must contain at least 9 digits");

    // valid inputs
    await bankAccountsPage.fillBankAccountForm({
      bankName: "The Super Best",
      routingNumber: "123456789",
      accountNumber: "123456789",
    });
    await expect(bankAccountsPage.bankNameError).not.toBeVisible();
    await expect(bankAccountsPage.routingNumberError).not.toBeVisible();
    await expect(bankAccountsPage.accountNumberError).not.toBeVisible();

    // valid name, max 12 routing/account numbers
    await bankAccountsPage.fillBankAccountForm({
      bankName: "The Super Duper Best",
      routingNumber: "1234567890123",
      accountNumber: "1234567890123",
    });
    await expect(bankAccountsPage.bankNameError).not.toBeVisible();
    await expect(bankAccountsPage.routingNumberError).toHaveText("Must contain a valid routing number");
    await expect(bankAccountsPage.accountNumberError).toHaveText("Must contain no more than 12 digits");

    await expect(bankAccountsPage.bankAccountSaveButton).toBeDisabled();
  });

  test("soft deletes a bank account", async ({ loggedInTestUser: _user, homePage }) => {
    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(bankAccountsPage.bankAccountListItems.first()).toBeVisible();

    await bankAccountsPage.createNewBankAccount();
    await bankAccountsPage.fillBankAccountForm({
      bankName: "Epic Bank Slay",
      accountNumber: "123456789",
      routingNumber: "123456789",
    });
    await expect(bankAccountsPage.bankAccountSaveButton).toBeEnabled();

    await bankAccountsPage.saveBankAccount();
    await expect(bankAccountsPage.bankAccountList).toBeVisible();

    const deleted = await bankAccountsPage.deleteBankAccount("Epic Bank Slay");
    await expect(deleted).toContainText("Deleted");
  });

  test("NUX renders an empty bank account list state with onboarding modal", async ({
    loggedInTestUser: _user,
    homePage,
    page,
    signUpPage,
  }) => {
    // sign user out
    await homePage.nav.signOut();

    // create new user and sign in
    await signUpPage.goto();
    await expect(signUpPage.header).toBeVisible();
    await signUpPage.fillForm({
      firstName: "zargin",
      lastname: "testing",
      username: "zargintester12",
      password: "s3cret",
      confirmPassword: "s3cret",
    });
    const signInPage = await signUpPage.submitForm();
    await expect(signInPage.header).toBeVisible();
    await signInPage.fillForm("zargintester12", "s3cret");
    await signInPage.submitForm();
    await expect(homePage.userOnboardingDialog).toBeVisible();

    await page.goto("/bankaccounts");
    await expect(page.getByTestId(/bankaccount-list-item/)).toHaveCount(0);
    await expect(page.getByTestId("user-onboarding-dialog")).toBeVisible();
    await expect(page.getByTestId("empty-list-header")).toContainText("No Bank Accounts");
  })
});
