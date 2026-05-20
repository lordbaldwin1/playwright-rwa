import { config } from "../../config";
import { expect, test } from "../../fixtures";
import { loginWithXState } from "../../helpers/auth";
import { findTransaction, getTransactions } from "../../helpers/api/transactions";

test.describe("notifications e2e tests", () => {
  test("should lower notification count as notifications are dismissed", async ({
    loggedInTestUser: _testUser,
    notificationsPage,
  }) => {
    await notificationsPage.goto("/notifications");
    await expect(notificationsPage.notificationsList).toBeVisible();
    await expect(notificationsPage.notifications).toHaveCount(config.SEEDED_NOTIFICATION_COUNT);
    await expect(notificationsPage.nav.notificationsCount).toHaveText(
      String(config.SEEDED_NOTIFICATION_COUNT)
    );

    await notificationsPage.dismissFirstNotification();

    const countAfterDismiss = config.SEEDED_NOTIFICATION_COUNT - 1;
    await expect(notificationsPage.notifications).toHaveCount(countAfterDismiss);
    await expect(notificationsPage.nav.notificationsCount).toHaveText(String(countAfterDismiss));
  });

  test("User A likes a transaction of User B; User B gets notification that User A liked transaction", async ({
    loggedInTestUser: userA,
    testContact: userB,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = findTransaction(transactions, { senderId: userB.id });
    if (!transaction) {
      throw new Error("failed to find valid transaction for test");
    }

    await expect(transactionDetailPage.nav.notificationsCount).toHaveText(
      String(config.SEEDED_NOTIFICATION_COUNT)
    );

    await transactionDetailPage.goto(transaction.id);

    await expect(transactionDetailPage.likeCount).toHaveText("0");
    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();
    await expect(transactionDetailPage.likeCount).toHaveText("1");

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    const userBNotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userBNotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userBNotificationsPage.notifications.first()).toContainText(userA.firstName);
    await expect(userBNotificationsPage.notifications.first()).toContainText("liked");
  });

  test("User C likes a transaction between User A and User B; User A and User B get notifications that User C liked transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = findTransaction(transactions, {
      senderId: userB.id,
      receiverId: userA.id,
    });
    if (!transaction) {
      throw new Error("Failed to find suitable transaction, did seeding db fail?");
    }

    await transactionDetailPage.goto(transaction.id);

    await expect(transactionDetailPage.likeCount).toHaveText("0");
    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();
    await expect(transactionDetailPage.likeCount).toHaveText("1");

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);

    const userANotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userANotificationsPage.notifications.first()).toContainText(userC.firstName);
    await expect(userANotificationsPage.notifications.first()).toContainText("liked");

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userANotificationsPage.notifications.first()).toContainText(userC.firstName);
    await expect(userANotificationsPage.notifications.first()).toContainText("liked");
  });

  test("User A comments on a transaction of User B; User B gets notification that User A commented on their transaction", async ({
    loggedInTestUser: userA,
    testContact: userB,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = findTransaction(transactions, { senderId: userB.id });
    if (!transaction) {
      throw new Error("Failed to find suitable transaction");
    }

    await transactionDetailPage.goto(transaction.id);
    await transactionDetailPage.addComment("Thank You");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    const userBNotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userBNotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userBNotificationsPage.notifications.first()).toContainText(userA.firstName);
    await expect(userBNotificationsPage.notifications.first()).toContainText("commented");
  });

  test("User C comments on a transaction between User A and User B; User A and B get notifications that User C commented on their transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = findTransaction(transactions, {
      senderId: userB.id,
      receiverId: userA.id,
    });
    if (!transaction) {
      throw new Error("failed to find suitable transaction");
    }

    await transactionDetailPage.goto(transaction.id);
    await transactionDetailPage.addComment("Thank You");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);

    const userANotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userANotificationsPage.notifications.first()).toContainText(userC.firstName);
    await expect(userANotificationsPage.notifications.first()).toContainText("commented");

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notifications).toHaveCount(
      config.NOTIFICATION_COUNT_AFTER_SOCIAL_ACTION
    );
    await expect(userANotificationsPage.notifications.first()).toContainText(userC.firstName);
    await expect(userANotificationsPage.notifications.first()).toContainText("commented");
  });

  test("User A sends a payment to User B", async ({
    loggedInTestUser: _userA,
    testContact: userB,
    newTransactionPage,
    page,
  }) => {
    const payment = {
      amount: "30",
      description: "🍕Pizza",
    };

    await newTransactionPage.goto("/transaction/new");
    await newTransactionPage.searchUser(userB.username);
    await newTransactionPage.selectUserFromList(userB.username);
    await newTransactionPage.fillForm(payment);
    await newTransactionPage.submitPayment();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    const userBNotificationsPage = await newTransactionPage.nav.goToNotifications();
    await expect(userBNotificationsPage.notifications.first()).toContainText(userB.firstName);
    await expect(userBNotificationsPage.notifications.first()).toContainText("received payment");
  });

  test("User A sends a payment request to User C", async ({
    loggedInTestUser: userA,
    uniqueContact: userC,
    newTransactionPage,
    page,
  }) => {
    const request = {
      amount: "300",
      description: "🛫🛬 Airfare",
    };

    await newTransactionPage.goto("/transaction/new");
    await newTransactionPage.searchUser(userC.username);
    await newTransactionPage.selectUserFromList(userC.username);
    await newTransactionPage.fillForm(request);
    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.signOut();
    await loginWithXState(page, userC.username, config.DEFAULT_PASSWORD);

    const userCNotificationsPage = await newTransactionPage.nav.goToNotifications();
    await expect(userCNotificationsPage.getNotification(`${userA.firstName}`)).toContainText(
      "requested payment"
    );
  });

  test("renders an empty notifications state", async ({
    loggedInTestUser: _user,
    notificationsPage,
    page,
  }) => {
    await page.route("**/notifications", async (route) => {
      await route.fulfill({ json: { results: [] } });
    });

    await notificationsPage.nav.goToNotifications();
    await expect(page).toHaveURL(/\/notifications/);
    await expect(notificationsPage.notificationsList).toHaveCount(0);
    await expect(notificationsPage.emptyListHeader).toHaveText("No Notifications");
  });
});
