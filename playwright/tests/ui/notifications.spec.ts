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
});
