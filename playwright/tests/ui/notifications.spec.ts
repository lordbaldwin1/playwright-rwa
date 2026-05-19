import { Transaction } from "models";
import { config } from "../../config";
import { expect, test } from "../../fixtures";
import { loginWithXState } from "../../helpers/auth";

test.describe("notifications e2e tests", () => {
  test("should lower notification count as notificatiosn are dismisses", async ({
    loggedInTestUser: testUser,
    navigation,
    request,
  }) => {
    const notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    const initialNotificationCount = await notificationsPage.getNotificationCount(
      request,
      testUser.username,
      config.DEFAULT_PASSWORD
    );

    await notificationsPage.dismissAllNotifications();
    expect(await notificationsPage.notifications.count()).toBeLessThan(initialNotificationCount);
    expect(Number(await navigation.notificationsCount.innerText())).toBeLessThan(
      initialNotificationCount
    );
  });

  test("User A likes a transaction of User B; User B gets notification that User A liked transaction", async ({
    uniqueLoggedInUser: userA,
    testContact: userB,
    page,
    request,
    transactionDetailPage,
    navigation,
  }) => {
    const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
    const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
    const transaction = transactions.find((t) => t.senderId === userB.id);
    if (!transaction) {
      throw new Error("failed to find valid transaction for test");
    }

    await expect(navigation.userBalance).toBeVisible();

    await transactionDetailPage.gotoTransaction(transaction.id);
    await expect(transactionDetailPage.header).toBeVisible();

    const initialLikeCount = Number(await transactionDetailPage.likeCount.innerText());

    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();
    expect(Number(await transactionDetailPage.likeCount.innerText())).toBeGreaterThan(
      initialLikeCount
    );

    // switch to User B
    await navigation.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(navigation.notificationsCount).toBeVisible();

    const notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.header).toBeVisible();

    await expect(
      notificationsPage.getNotification(`${userA.firstName} ${userA.lastName} liked a transaction`)
    ).toBeVisible();
  });

  test("User C likes a transaction between User A and User B; User A and User B get notifications that User C liked transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    request,
    navigation,
    page,
    transactionDetailPage,
  }) => {
    const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
    expect(transRes.ok()).toBeTruthy();
    const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
    const transaction = transactions.find(
      (t) => t.senderId === userA.id && t.receiverId === userB.id
    );
    if (!transaction) {
      throw new Error("Failed to find suitable transaction, did seeding db fail?");
    }

    await expect(navigation.userBalance).toBeVisible();

    await transactionDetailPage.gotoTransaction(transaction.id);
    await expect(transactionDetailPage.header).toBeVisible();

    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();

    // switch to user A
    await navigation.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);
    await expect(navigation.userBalance).toBeVisible();

    let notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    await expect(
      notificationsPage.notifications.getByText(
        `${userC.firstName} ${userC.lastName} liked a transaction`
      )
    ).toBeVisible();

    // switch to user B
    await navigation.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(navigation.userBalance).toBeVisible();

    notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    await expect(
      notificationsPage.notifications.getByText(
        `${userC.firstName} ${userC.lastName} liked a transaction`
      )
    ).toBeVisible();
  });

  test("User A comments on a transaction of User B; User B gets notification that User A commented on their transaction", async ({
    loggedInTestUser: userA,
    testContact: userB,
    request,
    page,
    navigation,
    transactionDetailPage,
  }) => {
    const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
    expect(transRes.ok()).toBeTruthy();
    const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
    const transaction = transactions.find((t) => t.senderId === userB.id);
    if (!transaction) {
      throw new Error("Failed to find suitable transaction");
    }

    await expect(navigation.userBalance).toBeVisible();
    await transactionDetailPage.gotoTransaction(transaction.id);
    await expect(transactionDetailPage.header).toBeVisible();

    await transactionDetailPage.addComment("test comment");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    await navigation.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    await expect(navigation.userBalance).toBeVisible();
    const notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    await expect(notificationsPage.getNotification(`${userA.firstName} ${userA.lastName} commented on a transaction.`)).toBeVisible();
  });

  test("User C comments on a transaction between User A and User B; User A and B get notifications that User C commented on their transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    request,
    page,
    navigation,
    transactionDetailPage,
  }) => {
    const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
    expect(transRes.ok()).toBeTruthy();
    const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
    const transaction = transactions.find((t) => t.senderId === userA.id && t.receiverId === userB.id);
    if (!transaction) {
      throw new Error("failed to find suitable transaction");
    }

    await expect(navigation.userBalance).toBeVisible();
    await transactionDetailPage.gotoTransaction(transaction.id);
    await expect(transactionDetailPage.commentInput).toBeVisible();
    
    await transactionDetailPage.addComment("test comment");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    // switch to userA
    await navigation.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);
    await expect(navigation.userBalance).toBeVisible();

    let notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.getNotification(`${userC.firstName} ${userC.lastName} commented on a transaction.`)).toBeVisible();

    // switch to userB
    await navigation.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(navigation.userBalance).toBeVisible();

    notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.getNotification(`${userC.firstName} ${userC.lastName} commented on a transaction.`)).toBeVisible();
  });

  test("User A sends a payment to User B", async ({
    loggedInTestUser: _userA,
    uniqueContact: userB,
    homePage,
    page,
  }) => {
    const payment = {
      amount: "10",
      description: "notification test payment",
    };

    await expect(homePage.nav.userBalance).toBeVisible();

    const newTransactionPage = await homePage.nav.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(userB.username);
    await newTransactionPage.selectUserFromList(userB.username);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await expect(newTransactionPage.descriptionInput).toBeVisible();

    await newTransactionPage.fillForm(payment);
    await expect(newTransactionPage.paymentButton).toBeVisible();

    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(homePage.nav.userBalance).toBeVisible();

    const notificationsPage = await homePage.nav.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    await expect(notificationsPage.getNotification(`${userB.firstName} ${userB.lastName} received payment.`)).toBeVisible();
  });

  test("User A sends a payment request to User C", async ({
    loggedInTestUser: userA,
    uniqueContact: userC,
    homePage,
    page,
  }) => {
    const request = {
      amount: "300",
      description: "Airfare request",
    };

    await expect(homePage.nav.userBalance).toBeVisible();

    const newTransactionPage = await homePage.nav.goToNewTransaction();
    await expect(newTransactionPage.searchInput).toBeVisible();

    await newTransactionPage.searchUser(userC.username);
    await newTransactionPage.selectUserFromList(userC.username);
    await expect(newTransactionPage.amountInput).toBeVisible();

    await newTransactionPage.fillForm(request);
    await expect(newTransactionPage.requestButton).toBeEnabled();

    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.signOut();
    await loginWithXState(page, userC.username, config.DEFAULT_PASSWORD);
    await expect(homePage.nav.userBalance).toBeVisible();

    const notificationsPage = await homePage.nav.goToNotifications();
    await expect(notificationsPage.notificationsList).toBeVisible();

    await expect(
      notificationsPage.getNotification(`${userA.firstName} ${userA.lastName} requested payment.`)
    ).toBeVisible();
  });

  test("renders an empty notifications state", async ({
    uniqueLoggedInUser: _user,
    navigation,
    page,
  }) => {
    await expect(navigation.userBalance).toBeVisible();

    const notificationsPage = await navigation.goToNotifications();
    await expect(page).toHaveURL(/\/notifications/);
    await expect(notificationsPage.header).toBeVisible();
    await expect(notificationsPage.notificationsList).toHaveCount(0);
    await expect(notificationsPage.emptyListHeader).toHaveText("No Notifications");
  });
});
