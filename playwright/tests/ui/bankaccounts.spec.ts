import { expect, test } from "../../fixtures";
import { getTestUser, loginWithXState } from "../../helpers/auth";

test.describe("bank accounts e2e tests", () => {
  test.beforeEach(async ({ request, page }) => {
    const user = await getTestUser(request);
    await loginWithXState(page, user.username, process.env.TEST_PASSWORD);
  });

  test("creates a new bank account", async ({ homePage, page }) => {
    const workerIdx = test.info().workerIndex;
    const bankName = `The Best Bank W${workerIdx}`;

    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(page).toHaveURL("/bankaccounts");

    await bankAccountsPage.createNewBankAccount();
    await expect(page).toHaveURL("/bankaccounts/new");

    await bankAccountsPage.fillBankAccountForm({
      bankName,
      routingNumber: "123456789",
      accountNumber: "987654321",
    });
    await bankAccountsPage.saveBankAccount();
    await expect(bankAccountsPage.bankAccountListItems).not.toHaveCount(0);
    await expect(bankAccountsPage.bankAccountListItems.last()).toContainText(bankName);
  });

  test("should display bank account form errors", async ({ homePage }) => {
    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(bankAccountsPage.header).toBeVisible();
    await bankAccountsPage.createNewBankAccount();

    await bankAccountsPage.fillBankAccountForm({
      bankName: "the",
      routingNumber: "123",
      accountNumber: "123",
    });

    await expect(bankAccountsPage.bankNameError).toBeVisible();
    await expect(bankAccountsPage.routingNumberError).toBeVisible();
    await expect(bankAccountsPage.accountNumberError).toBeVisible();
  });
});
