import { Transaction } from "models";
import { config } from "../../config";
import { expect, test } from "../../fixtures";
import { loginWithXState } from "../../helpers/auth";


test.describe("notifications e2e tests", () => {
  test("User A likes a transaction of User B; User B gets notification that User A liked transaction", async ({
    loggedInTestUser: userA,
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
    
    await transactionDetailPage.gotoTransaction(transaction.id);
    await expect(transactionDetailPage.header).toBeVisible();
    
    const initialLikeCount = Number(await transactionDetailPage.likeCount.innerText());

    await transactionDetailPage.likeTransaction();
    await expect(transactionDetailPage.likeButton).toBeDisabled();
    expect(Number(await transactionDetailPage.likeCount.innerText())).toBeGreaterThan(initialLikeCount);

    // switch to User B
    await navigation.signOut();
    await loginWithXState(page, userB.username, config.DEFAULT_PASSWORD);
    await expect(navigation.notificationsCount).toBeVisible();
    
    const notificationsPage = await navigation.goToNotifications();
    await expect(notificationsPage.header).toBeVisible();
    const notification = await notificationsPage.findNotification(`${userA.firstName} ${userA.lastName} liked a transaction`);
    await expect(notification).toBeVisible();
  });
})