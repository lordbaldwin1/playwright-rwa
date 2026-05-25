import { expect, test } from "../../fixtures/ui";
import {
  findCompletedTransactionForUser,
  findTransactionRequestForUser,
} from "../../helpers/api/transactions";

test.describe("transaction view e2e tests", () => {
  test("transactions navigation tabs are hidden on a transaction view page", async ({
    loggedInTestUser: _user,
    homePage,
  }) => {
    const tdPage = await homePage.goToFirstTransaction();
    await expect(homePage.transactionTabs).not.toBeVisible();
    await expect(tdPage.header).toBeVisible();
  });

  test("likes a transaction", async ({ loggedInTestUser: _user, homePage }) => {
    const tdPage = await homePage.goToFirstTransaction();
    await tdPage.likeTransaction();
    await expect(tdPage.likeCount).toHaveText("1 ");
    await expect(tdPage.likeButton).toBeDisabled();
  });

  test("comments on a transaction", async ({ loggedInTestUser: _user, homePage }) => {
    const comments = ["Thank you!", "Appreciate it."];
    const tdPage = await homePage.goToFirstTransaction();
    await expect(tdPage.commentInput).toBeVisible();

    for (let index = 0; index < comments.length; index++) {
      const comment = comments[index];
      await tdPage.addComment(comment);
      await expect(tdPage.comments.nth(index)).toContainText(comment);
    }

    await expect(tdPage.comments).toHaveCount(comments.length);
  });

  test("accepts a transaction request", async ({
    loggedInTestUser: user,
    request,
    page,
    transactionDetailPage: tdPage,
  }) => {
    const tx = await findTransactionRequestForUser(request, user.id);
    await tdPage.goto(tx.id);

    const promise = page.waitForResponse(
      (res) => res.url().includes("/transactions") && res.request().method() === "PATCH"
    );
    await tdPage.acceptTransaction();
    const res = await promise;
    expect(res.status()).toBe(204);
    await expect(tdPage.acceptButton).not.toBeVisible();
    await expect(tdPage.header).toBeVisible();
  });

  test("rejects a transaction request", async ({
    loggedInTestUser: user,
    page,
    request,
    transactionDetailPage: tdPage,
  }) => {
    const tx = await findTransactionRequestForUser(request, user.id);
    await tdPage.goto(tx.id);

    const promise = page.waitForResponse(
      (res) => res.url().includes("/transactions") && res.request().method() === "PATCH"
    );
    await tdPage.rejectTransaction();
    const res = await promise;
    expect(res.status()).toBe(204);

    await expect(tdPage.rejectButton).not.toBeVisible();
    await expect(tdPage.header).toBeVisible();
  });

  test("does not display accept/reject buttons on completed request", async ({
    loggedInTestUser: user,
    request,
    page,
    transactionDetailPage: tdPage,
  }) => {
    const tx = await findCompletedTransactionForUser(request, user.id);
    await tdPage.goto(tx.id);

    await expect(tdPage.header).toBeVisible();
    await expect(tdPage.acceptButton).not.toBeVisible();
    await expect(tdPage.rejectButton).not.toBeVisible();
    await expect(page.getByTestId("nav-top-notifications-count")).toBeVisible();
  });
});
