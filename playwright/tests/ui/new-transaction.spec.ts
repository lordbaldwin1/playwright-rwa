import { dinero, toDecimal, USD } from "dinero.js";
import { expect, test } from "../../fixtures";

test.describe("new transaction e2e tests", () => {
  test("navigates to the new transaction form, selects a user and submits a transaction payment", async ({
    loggedInTestUser: testUser,
    testContact,
    navigation,
  }) => {
    const payment = {
      amount: "35",
      description: `Sushi dinner 🍣 ${test.info().testId}`,
    };

    const newTransactionPage = await navigation.goToNewTransaction();
    await expect(newTransactionPage.usersList).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(payment);
    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toBeVisible();

    const updatedAccountBalance = toDecimal(
      dinero({ amount: testUser.balance - parseInt(payment.amount) * 100, currency: USD }),
      ({ value }) => Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" })
    );
    await expect(navigation.userBalance).toHaveText(updatedAccountBalance);

    const homePage = await navigation.goToHome();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.nav.goToPersonalTab();
    await expect(homePage.transactionList).toBeVisible();

    const transaction = homePage.findTransactionByDescription(payment.description);
    await expect(transaction).toBeVisible();
    await expect(transaction).toContainText(payment.amount);
    await expect(transaction).toContainText(payment.description);
  });
});
