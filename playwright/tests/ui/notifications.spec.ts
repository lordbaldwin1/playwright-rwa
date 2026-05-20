import { config } from "../../config";
import { expect, test } from "../../fixtures";
import { getNotificationCount } from "../../helpers/api/notifications";
import { loginWithXState } from "../../helpers/auth";
import { getTransactions } from "../../helpers/api/transactions";

test.describe("notifications e2e tests", () => {
  test("should lower notification count as notificatiosn are dismisses", async ({
    loggedInTestUser: testUser,
    notificationsPage,
    request,
  }) => {
    await notificationsPage.goto("/notifications");
    await expect(notificationsPage.notificationsList).toBeVisible();

    const initialNotificationCount = await getNotificationCount(
      request,
      testUser.username,
      config.DEFAULT_PASSWORD
    );

    await notificationsPage.dismissAllNotifications();
    expect(await notificationsPage.notifications.count()).toBeLessThan(initialNotificationCount);
    expect(Number(await notificationsPage.nav.notificationsCount.innerText())).toBeLessThan(
      initialNotificationCount
    );
  });

  test("User A likes a transaction of User B; User B gets notification that User A liked transaction", async ({
    uniqueLoggedInUser: userA,
    testContact: userB,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = transactions.find((t) => t.senderId === userB.id);
    if (!transaction) {
      throw new Error("failed to find valid transaction for test");
    }

    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    await transactionDetailPage.goto(transaction.id);

    const initialLikeCount = Number(await transactionDetailPage.likeCount.innerText());

    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();
    expect(Number(await transactionDetailPage.likeCount.innerText())).toBeGreaterThan(
      initialLikeCount
    );

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(transactionDetailPage.nav.notificationsCount).toBeVisible();

    const userBNotificationsPage = await transactionDetailPage.nav.goToNotifications();

    await expect(
      userBNotificationsPage.getNotification(
        `${userA.firstName} ${userA.lastName} liked a transaction`
      )
    ).toBeVisible();
  });

  test("User C likes a transaction between User A and User B; User A and User B get notifications that User C liked transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = transactions.find(
      (t) => t.senderId === userA.id && t.receiverId === userB.id
    );
    if (!transaction) {
      throw new Error("Failed to find suitable transaction, did seeding db fail?");
    }

    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    await transactionDetailPage.goto(transaction.id);

    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);
    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    const userANotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notificationsList).toBeVisible();

    await expect(
      userANotificationsPage.notifications.getByText(
        `${userC.firstName} ${userC.lastName} liked a transaction`
      )
    ).toBeVisible();

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    await transactionDetailPage.nav.goToNotifications();
    await expect(userANotificationsPage.notificationsList).toBeVisible();

    await expect(
      userANotificationsPage.notifications.getByText(
        `${userC.firstName} ${userC.lastName} liked a transaction`
      )
    ).toBeVisible();
  });

  test("User A comments on a transaction of User B; User B gets notification that User A commented on their transaction", async ({
    loggedInTestUser: userA,
    testContact: userB,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = transactions.find((t) => t.senderId === userB.id);
    if (!transaction) {
      throw new Error("Failed to find suitable transaction");
    }

    await expect(transactionDetailPage.nav.userBalance).toBeVisible();
    await transactionDetailPage.goto(transaction.id);

    await transactionDetailPage.addComment("test comment");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);

    await expect(transactionDetailPage.nav.userBalance).toBeVisible();
    const userBNotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(userBNotificationsPage.notificationsList).toBeVisible();

    await expect(
      userBNotificationsPage.getNotification(
        `${userA.firstName} ${userA.lastName} commented on a transaction.`
      )
    ).toBeVisible();
  });

  test("User C comments on a transaction between User A and User B; User A and B get notifications that User C commented on their transaction", async ({
    testUser: userA,
    testContact: userB,
    uniqueLoggedInUser: userC,
    page,
    transactionDetailPage,
  }) => {
    const transactions = await getTransactions(page.request);
    const transaction = transactions.find(
      (t) => t.senderId === userA.id && t.receiverId === userB.id
    );
    if (!transaction) {
      throw new Error("failed to find suitable transaction");
    }

    await expect(transactionDetailPage.nav.userBalance).toBeVisible();
    await transactionDetailPage.goto(transaction.id);
    await expect(transactionDetailPage.commentInput).toBeVisible();

    await transactionDetailPage.addComment("test comment");
    await expect(transactionDetailPage.comments).not.toHaveCount(0);

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userA.username, config.DEFAULT_PASSWORD);
    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    const userANotificationsPage = await transactionDetailPage.nav.goToNotifications();
    await expect(
      userANotificationsPage.getNotification(
        `${userC.firstName} ${userC.lastName} commented on a transaction.`
      )
    ).toBeVisible();

    await transactionDetailPage.nav.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(transactionDetailPage.nav.userBalance).toBeVisible();

    await transactionDetailPage.nav.goToNotifications();
    await expect(
      userANotificationsPage.getNotification(
        `${userC.firstName} ${userC.lastName} commented on a transaction.`
      )
    ).toBeVisible();
  });

  test("User A sends a payment to User B", async ({
    loggedInTestUser: _userA,
    uniqueContact: userB,
    newTransactionPage,
    page,
  }) => {
    const payment = {
      amount: "10",
      description: "notification test payment",
    };

    await expect(newTransactionPage.nav.userBalance).toBeVisible();

    await newTransactionPage.goto("/transaction/new");

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
    await expect(newTransactionPage.nav.userBalance).toBeVisible();

    const userBNotificationsPage = await newTransactionPage.nav.goToNotifications();
    await expect(userBNotificationsPage.notificationsList).toBeVisible();

    await expect(
      userBNotificationsPage.getNotification(
        `${userB.firstName} ${userB.lastName} received payment.`
      )
    ).toBeVisible();
  });

  test("User A sends a payment request to User C", async ({
    loggedInTestUser: userA,
    uniqueContact: userC,
    newTransactionPage,
    page,
  }) => {
    const request = {
      amount: "300",
      description: "Airfare request",
    };

    await expect(newTransactionPage.nav.userBalance).toBeVisible();

    await newTransactionPage.goto("/transaction/new");

    await newTransactionPage.searchUser(userC.username);
    await newTransactionPage.selectUserFromList(userC.username);
    await expect(newTransactionPage.amountInput).toBeVisible();

    await newTransactionPage.fillForm(request);
    await expect(newTransactionPage.requestButton).toBeEnabled();

    await newTransactionPage.submitRequest();
    await expect(newTransactionPage.successToast).toHaveText("Transaction Submitted!");

    await newTransactionPage.nav.signOut();
    await loginWithXState(page, userC.username, config.DEFAULT_PASSWORD);
    await expect(newTransactionPage.nav.userBalance).toBeVisible();

    const userCNotificationsPage = await newTransactionPage.nav.goToNotifications();
    await expect(userCNotificationsPage.notificationsList).toBeVisible();

    await expect(
      userCNotificationsPage.getNotification(
        `${userA.firstName} ${userA.lastName} requested payment.`
      )
    ).toBeVisible();
  });

  test("renders an empty notifications state", async ({
    uniqueLoggedInUser: _user,
    notificationsPage,
    page,
  }) => {
    await expect(notificationsPage.nav.userBalance).toBeVisible();

    await notificationsPage.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications/);
    await expect(notificationsPage.notificationsList).toHaveCount(0);
    await expect(notificationsPage.emptyListHeader).toHaveText("No Notifications");
  });
});
