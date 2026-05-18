import { dinero, toDecimal, USD } from "dinero.js";
import { expect, test } from "../../fixtures";
import { config } from "../../config";

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
    await expect(homePage.transactions).not.toHaveCount(0);

    await homePage.goToPersonalTab();
    await expect(homePage.personalTab).toContainClass("Mui-selected");
    await expect(homePage.transactionList).toBeVisible();

    const transaction = homePage.findTransactionByDescription(payment.description);
    await expect(transaction).toBeVisible();
    await expect(transaction).toContainText(payment.amount);
    await expect(transaction).toContainText(payment.description);
  });

  test("navigates to the new transaction form, selects a user and submits a transaction request", async ({
    loggedInTestUser: _testUser,
    navigation,
    testContact,
  }) => {
    const request = {
      amount: "95",
      description: "Fancy Hotel 🏨",
    };
    const newTransactionPage = await navigation.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(request);
    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    const homePage = await navigation.goToHome();
    await expect(homePage.transactions).not.toHaveCount(0);

    await homePage.goToPersonalTab();
    await expect(homePage.personalTab).toContainClass("Mui-selected");
    await expect(homePage.transactions).not.toHaveCount(0);

    const transaction = homePage.findTransactionByDescription(request.description);
    await expect(transaction).toContainText(request.amount);
    await expect(transaction).toContainText(request.description);
  });

  test("displays new transaction errors", async ({
    loggedInTestUser: testUser,
    navigation,
    testContact,
  }) => {
    const invalidPayment = {
      amount: "",
      description: "",
    };

    const newTransactionPage = await navigation.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);

    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(invalidPayment);
    await expect(newTransactionPage.amountError).toHaveText("Please enter a valid amount");
    await expect(newTransactionPage.descriptionError).toHaveText("Please enter a note");
    await expect(newTransactionPage.requestButton).toBeDisabled();
    await expect(newTransactionPage.paymentButton).toBeDisabled();
  });

  test("submits a transaction payment and verifies the deposit for the receiver", async ({
    loggedInTestUser: testUser,
    navigation,
    testContact,
  }) => {
    // make transaction on one user, log in to contact, ensure transaction appears in their personal?
    const payment = {
      amount: "20",
      description: "Super awesome sandwich",
    };
    const startUserBalance = await navigation.userBalance.innerText();
    const startContactBalance = String(testContact.balance / 100);

    const newTransactionPage = await navigation.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);
    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(payment);
    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toBeVisible();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");
    await expect(navigation.userBalance).not.toHaveText(startUserBalance);

    // switch user
    const signInPage = await navigation.signOut();
    await expect(signInPage.header).toBeVisible();

    await signInPage.fillForm(testContact.username, config.DEFAULT_PASSWORD);
    const homePage = await signInPage.submitForm();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.goToPersonalTab();
    await expect(homePage.transactions).not.toHaveCount(0);
    const transaction = homePage.findTransactionByDescription(payment.description);
    await expect(transaction).toContainText(payment.amount);
    await expect(transaction).toContainText(payment.description);
    await expect(navigation.userBalance).not.toContainText(startContactBalance);
  });

  test("submits a transaction request and accepts the request for the receiver", async ({
    loggedInTestUser: testUser,
    navigation,
    testContact,
  }) => {
    // create transaction request, switch user, accept it on other user
    const request = {
      amount: "50",
      description: "accept this bro!",
    };
    const newTransactionPage = await navigation.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(testContact.username);
    await expect(newTransactionPage.userListItems).not.toHaveCount(0);
    
    await newTransactionPage.selectUserFromList(testContact.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(request);
    await expect(newTransactionPage.requestButton).toBeEnabled();

    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    const signInPage = await navigation.signOut();
    await expect(signInPage.header).toBeVisible();
    
    await signInPage.fillForm(testContact.username, config.DEFAULT_PASSWORD);
    await expect(signInPage.signInButton).toBeEnabled();

    const homePage = await signInPage.submitForm();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.goToPersonalTab();
    await expect(homePage.transactionList).toBeVisible();

    await homePage.goToTransaction(request.description);
    await expect(homePage.transactionAcceptButton).toBeEnabled();

    await homePage.acceptTransaction();

    await navigation.signOut();
    await expect(signInPage.header).toBeVisible();

    await signInPage.fillForm(testUser.username, config.DEFAULT_PASSWORD);
    await expect(signInPage.signInButton).toBeEnabled();

    await signInPage.submitForm();
    await expect(navigation.userBalance).toBeVisible();

    const updatedAccountBalance = toDecimal(
      dinero({ amount: testUser.balance + Number(request.amount) * 100, currency: USD }),
      ({ value }) => Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" })
    );

    await expect(navigation.userBalance).toContainText(updatedAccountBalance);
  });
});
