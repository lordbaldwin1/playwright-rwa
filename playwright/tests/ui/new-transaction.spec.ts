import { dinero, toDecimal, USD } from "dinero.js";
import { expect, test } from "../../fixtures/ui";
import { config } from "../../config";

test.describe("new transaction e2e tests", () => {
  test("navigates to the new transaction form, selects a user and submits a transaction payment", async ({
    loggedInTestUser: testUser,
    testContact,
    newTransactionPage,
  }) => {
    const payment = {
      amount: "35",
      description: `Sushi dinner 🍣 ${test.info().testId}`,
    };

    await newTransactionPage.goto("/transaction/new");
    await expect(newTransactionPage.usersList).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeEditable();
    await expect(newTransactionPage.descriptionInput).toBeEditable();

    await newTransactionPage.fillForm(payment);
    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    const updatedAccountBalance = toDecimal(
      dinero({ amount: testUser.balance - parseInt(payment.amount) * 100, currency: USD }),
      ({ value }) => Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" })
    );

    await newTransactionPage.nav.withSideNav(
      async () => await expect(newTransactionPage.nav.userBalance).toHaveText(updatedAccountBalance)
    );

    const homePage = await newTransactionPage.nav.goToHome();
    await expect(homePage.transactionList).toBeVisible();
    await expect(homePage.transactions).not.toHaveCount(0);

    await homePage.goToMineTab();
    await expect(homePage.mineTab).toContainClass("Mui-selected");
    await expect(homePage.transactionList).toBeVisible();

    const transaction = homePage.findTransactionByDescription(payment.description);
    await expect(transaction).toContainText(payment.amount);
    await expect(transaction).toContainText(payment.description);
  });

  test("navigates to the new transaction form, selects a user and submits a transaction request", async ({
    loggedInTestUser: _testUser,
    testContact,
    newTransactionPage,
  }) => {
    const request = {
      amount: "95",
      description: "Fancy Hotel 🏨",
    };
    await newTransactionPage.goto("/transaction/new");

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeEditable();
    await expect(newTransactionPage.descriptionInput).toBeEditable();

    await newTransactionPage.fillForm(request);
    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    const homePage = await newTransactionPage.nav.goToHome();
    await expect(homePage.transactions).not.toHaveCount(0);

    await homePage.goToMineTab();
    await expect(homePage.mineTab).toContainClass("Mui-selected");
    await expect(homePage.transactions).not.toHaveCount(0);

    const transaction = homePage.findTransactionByDescription(request.description);
    await expect(transaction).toContainText(request.amount);
    await expect(transaction).toContainText(request.description);
  });

  test("displays new transaction errors", async ({
    loggedInTestUser: _testUser,
    testContact,
    newTransactionPage,
  }) => {
    const invalidPayment = {
      amount: "",
      description: "",
    };

    await newTransactionPage.goto("/transaction/new");

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeEditable();
    await expect(newTransactionPage.descriptionInput).toBeEditable();

    await newTransactionPage.fillForm(invalidPayment);
    await expect(newTransactionPage.amountError).toHaveText("Please enter a valid amount");
    await expect(newTransactionPage.descriptionError).toHaveText("Please enter a note");
    await expect(newTransactionPage.requestButton).toBeDisabled();
    await expect(newTransactionPage.paymentButton).toBeDisabled();
  });

  test("submits a transaction payment and verifies the deposit for the receiver", async ({
    loggedInTestUser: _testUser,
    testContact,
    newTransactionPage,
  }) => {
    const payment = {
      amount: "20",
      description: "Super awesome sandwich",
    };
    const startUserBalance = await newTransactionPage.nav.getUserBalance();
    const startContactBalance = String(testContact.balance / 100);

    await newTransactionPage.goto("/transaction/new");

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeEditable();
    await expect(newTransactionPage.descriptionInput).toBeEditable();

    await newTransactionPage.fillForm(payment);
    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.withSideNav(
      async () => await expect(newTransactionPage.nav.userBalance).not.toHaveText(startUserBalance)
    );

    const signInPage = await newTransactionPage.nav.signOut();
    await signInPage.fillForm(testContact.username, config.DEFAULT_PASSWORD);
    const homePage = await signInPage.submitForm();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.goToMineTab();
    await expect(homePage.transactions).not.toHaveCount(0);

    const transaction = homePage.findTransactionByDescription(payment.description);
    await expect(transaction).toContainText(payment.amount);
    await expect(transaction).toContainText(payment.description);
    await homePage.nav.withSideNav(
      async () => await expect(homePage.nav.userBalance).not.toContainText(startContactBalance)
    );
  });

  test("submits a transaction request and accepts the request for the receiver", async ({
    loggedInTestUser: testUser,
    testContact,
    newTransactionPage,
  }) => {
    const request = {
      amount: "50",
      description: "accept this bro!",
    };
    const startUserBalance = await newTransactionPage.nav.getUserBalance();

    await newTransactionPage.goto("/transaction/new");

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeEditable();
    await expect(newTransactionPage.descriptionInput).toBeEditable();

    await newTransactionPage.fillForm(request);
    await expect(newTransactionPage.requestButton).toBeEnabled();

    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    const signInPage = await newTransactionPage.nav.signOut();

    await signInPage.fillForm(testContact.username, config.DEFAULT_PASSWORD);
    await expect(signInPage.signInButton).toBeEnabled();

    const homePage = await signInPage.submitForm();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.goToMineTab();
    await expect(homePage.transactionList).toBeVisible();

    const tdPage = await homePage.goToTransaction(request.description);
    await expect(tdPage.acceptButton).toBeEnabled();

    await tdPage.acceptTransaction();
    await homePage.nav.signOut();
    await signInPage.fillForm(testUser.username, config.DEFAULT_PASSWORD);
    await expect(signInPage.signInButton).toBeEnabled();

    await signInPage.submitForm();
    await homePage.nav.withSideNav(
      async () => await expect(homePage.nav.userBalance).toBeVisible()
    );
    await homePage.nav.withSideNav(
      async () => await expect(homePage.nav.userBalance).not.toContainText(startUserBalance)
    );
  });
});
