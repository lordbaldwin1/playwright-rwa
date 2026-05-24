import { expect, test } from "../../fixtures";
import publicTransactions from "../../../cypress/fixtures/public-transactions.json";
import { Locator } from "@playwright/test";
import { TransactionRequestStatus, TransactionResponseItem, TransactionStatus } from "models";
import {
  formatAmount,
  isoStringToLocalMidnightEnd,
  isoStringToLocalMidnightStart,
} from "utils/transactionUtils";
import { config } from "../../config";
import { TransactionTabs } from "../../pages/HomePage";
import { getTransactions } from "../../helpers/api/transactions";
import { addDays, startOfDay } from "date-fns";

type FeedView = {
  tab: TransactionTabs;
  route: string;
};

const feedViews: FeedView[] = [
  {
    tab: "everyone",
    route: "/public",
  },
  {
    tab: "friends",
    route: "/contacts",
  },
  {
    tab: "mine",
    route: "",
  },
];

test.describe("transaction feed e2e tests", () => {
  test("toggles the navigation drawer", async ({ loggedInTestUser: _user, homePage }) => {
    if (homePage.nav.isMobile()) {
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
      await homePage.nav.toggleSideNav();
      await expect(homePage.nav.sideNavHome).toBeVisible();
      await homePage.nav.mobileCloseSideNav();
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
    } else {
      await expect(homePage.nav.sideNavHome).toBeVisible();
      await homePage.nav.toggleSideNav();
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
    }
  });

  test("renders transaction item variations in feed", async ({
    loggedInTestUser: _user,
    homePage,
    page,
  }) => {
    await page.route("**/transactions/public*", async (route) => {
      await route.fulfill({ json: publicTransactions });
    });

    const txPromise = page.waitForResponse(
      (res) => res.url().includes("/transactions/public") && res.request().method() === "GET"
    );
    await page.reload();
    await txPromise;

    const transactions = publicTransactions.results;

    async function getTransaction(item: Locator) {
      const dataTest = await item.getAttribute("data-test");
      const id = dataTest!.split("transaction-item-")[1];
      return transactions.find((t) => t.id === id)!;
    }

    test.step("paid transaction item", async () => {
      const paidItem = homePage.transactions.filter({ hasText: "paid" });
      const paidTx = await getTransaction(paidItem);
      const paidAmount = formatAmount(paidTx.amount);

      expect([TransactionStatus.pending, TransactionStatus.complete]).toContain(paidTx.status);
      expect(paidTx.requestStatus).toBe("");

      await expect(paidItem.getByTestId(/transaction-like-count/)).toHaveText(
        `${paidTx.likes.length}`
      );
      await expect(paidItem.getByTestId(/transaction-comment-count/)).toHaveText(
        `${paidTx.comments.length}`
      );
      await expect(paidItem.getByTestId(/transaction-sender-/)).toContainText(paidTx.senderName);
      await expect(paidItem.getByTestId(/transaction-receiver-/)).toContainText(
        paidTx.receiverName
      );
      await expect(paidItem.getByTestId(/transaction-amount-/)).toContainText(`-${paidAmount}`);
      await expect(paidItem.getByTestId(/transaction-amount-/)).toHaveCSS(
        "color",
        "rgb(255, 0, 0)"
      );
    });

    test.step("charged transaction item", async () => {
      const chargedItem = homePage.transactions.filter({ hasText: "charged" });
      const chargedTx = await getTransaction(chargedItem);
      const chargedAmount = formatAmount(chargedTx.amount);

      expect([TransactionStatus.complete]).toContain(chargedTx.status);
      expect(chargedTx.requestStatus).toBe("accepted");

      await expect(chargedItem.getByTestId(/transaction-like-count/)).toHaveText(
        `${chargedTx.likes.length}`
      );
      await expect(chargedItem.getByTestId(/transaction-comment-count/)).toHaveText(
        `${chargedTx.comments.length}`
      );
      await expect(chargedItem.getByTestId(/transaction-sender-/)).toContainText(
        chargedTx.senderName
      );
      await expect(chargedItem.getByTestId(/transaction-receiver-/)).toContainText(
        chargedTx.receiverName
      );
      await expect(chargedItem.getByTestId(/transaction-amount-/)).toContainText(
        `+${chargedAmount}`
      );
      await expect(chargedItem.getByTestId(/transaction-amount-/)).toHaveCSS(
        "color",
        "rgb(76, 175, 80)"
      );
    });

    test.step("requested transaction item", async () => {
      const requestedItem = homePage.transactions.filter({ hasText: "requested" });
      const requestedTx = await getTransaction(requestedItem);
      const requestedAmount = formatAmount(requestedTx.amount);

      expect([TransactionStatus.pending, TransactionStatus.complete]).toContain(requestedTx.status);
      expect([TransactionRequestStatus.pending, TransactionRequestStatus.rejected]).toContain(
        requestedTx.requestStatus
      );

      await expect(requestedItem.getByTestId(/transaction-like-count/)).toHaveText(
        `${requestedTx.likes.length}`
      );
      await expect(requestedItem.getByTestId(/transaction-comment-count/)).toHaveText(
        `${requestedTx.comments.length}`
      );
      await expect(requestedItem.getByTestId(/transaction-sender-/)).toContainText(
        requestedTx.senderName
      );
      await expect(requestedItem.getByTestId(/transaction-receiver-/)).toContainText(
        requestedTx.receiverName
      );
      await expect(requestedItem.getByTestId(/transaction-amount-/)).toContainText(
        `+${requestedAmount}`
      );
      await expect(requestedItem.getByTestId(/transaction-amount-/)).toHaveCSS(
        "color",
        "rgb(76, 175, 80)"
      );
    });
  });

  feedViews.forEach(async ({ tab, route }) => {
    test(`transaction feed ${tab} pagination`, async ({
      loggedInTestUser: _user,
      page,
      homePage,
    }) => {
      let txPromise = page.waitForResponse(
        (res) => res.url().includes(`/transactions${route}`) && res.request().method() === "GET"
      );

      await page.reload();
      await homePage.goToTab(tab);

      await expect(homePage.listSkeleton).not.toBeVisible();
      await expect(await homePage.getTab(tab)).toContainClass("Mui-selected");

      let res = await txPromise;
      let data = await res.json();
      expect(data.results).toHaveLength(config.PAGINATION_PAGE_SIZE);
      expect(data.pageData.page).toEqual(1);

      while (data.pageData.hasNextPages) {
        txPromise = page.waitForResponse(
          (res) => res.url().includes(`/transactions${route}`) && res.request().method() === "GET"
        );
        await homePage.scrollableGrid.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        res = await txPromise;
        data = await res.json();
        if (data.pageData.hasNextPages) {
          expect(data.results).toHaveLength(config.PAGINATION_PAGE_SIZE);
        }
      }
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.pageData.hasNextPages).toBe(false);
    });
  });

  test("filter transaction feeds by date range", async ({
    loggedInTestUser: _user,
    homePage,
    page,
    request,
  }) => {
    const transactions = (await getTransactions(request));
    const transaction = transactions[0];
    const dateRangeStart = isoStringToLocalMidnightStart(`${transaction.createdAt}`);
    const dateRangeEnd = isoStringToLocalMidnightEnd(
      addDays(startOfDay(transaction.createdAt), 1).toISOString()
    );

    await homePage.goto();
    await expect(homePage.transactionList).toBeVisible();
    
    const txPromise = page.waitForResponse(
      (res) => res.url().includes("/transactions") && res.request().method() === "GET"
    );

    await homePage.dateRangeFilter.pickDateRange(dateRangeStart, dateRangeEnd);
    const res = await txPromise;
    const data = await res.json();
    expect(homePage.transactions).toHaveCount(data.results.length);
  });
});
