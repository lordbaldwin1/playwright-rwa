import { expect, test } from "../../fixtures";
import { getTestUser, loginWithXState } from "../../helpers/auth";
import { reseedDatabase } from "../../helpers/database";

test.describe("bank accounts e2e tests", () => {
  test.beforeEach(async ({ request, page }) => {
    await reseedDatabase(request);
    const user = await getTestUser(request);
    await loginWithXState(page, user.username, process.env.TEST_PASSWORD);
  });

  test("creates a new bank account", async ({ homePage, page }) => {
    const bankAccountsPage = await homePage.nav.goToBankAccounts();
    await expect(page).toHaveURL("/bankaccounts");

    await bankAccountsPage.createNewBankAccount();
    await expect(page).toHaveURL("/bankaccounts/new");
  
    await bankAccountsPage.fillBankAccountForm({
      bankName: "The Best Bank",
      routingNumber: "123456789",
      accountNumber: "987654321",
    });
    await bankAccountsPage.saveBankAccount();
    await expect(bankAccountsPage.bankAccountListItems).toHaveCount(2);
    await expect(bankAccountsPage.bankAccountListItems.nth(1)).toContainText("The Best Bank");
  });
});
