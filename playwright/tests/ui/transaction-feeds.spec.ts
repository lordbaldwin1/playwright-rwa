import { expect, test } from "../../fixtures";
import publicTransactions from "../../../cypress/fixtures/public-transactions.json";
import { Locator, Page } from "@playwright/test";
import { TransactionRequestStatus, TransactionResponseItem, TransactionStatus } from "models";
import { getContactUserIdsForUser } from "../../helpers/database";
import {
  endOfDayUTC,
  formatAmount,
  isoStringToLocalDateFull,
  isoStringToLocalMidnightEnd,
  isoStringToLocalMidnightStart,
  localDateToIsoString,
} from "utils/transactionUtils";
import { config } from "../../config";
import { TransactionTabs } from "../../pages/HomePage";
import { addDays, isWithinInterval, startOfDay } from "date-fns";

type FeedView = {
  tab: TransactionTabs;
  transactionsPath: string;
};

const feedViews: FeedView[] = [
  { tab: "everyone", transactionsPath: "/transactions/public" },
  { tab: "friends", transactionsPath: "/transactions/contacts" },
  { tab: "mine", transactionsPath: "/transactions" },
];

const dollarAmountRange = {
  min: 200,
  max: 800,
};

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

  test.describe("renders and paginates all transaction feeds", () => {
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

        expect([TransactionStatus.pending, TransactionStatus.complete]).toContain(
          requestedTx.status
        );
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

    feedViews.forEach(({ tab, transactionsPath }) => {
      test(`paginates ${tab} transaction feed`, async ({
        loggedInTestUser: _user,
        page,
        homePage,
      }) => {
        let txPromise = waitForTransactionResponse(page, transactionsPath);

        await page.reload();
        await homePage.goToTab(tab);

        await expect(homePage.listSkeleton).not.toBeVisible();
        await expect(await homePage.getTab(tab)).toContainClass("Mui-selected");

        let res = await txPromise;
        let data = await res.json();
        expect(data.results).toHaveLength(config.PAGINATION_PAGE_SIZE);
        expect(data.pageData.page).toEqual(1);

        while (data.pageData.hasNextPages) {
          txPromise = waitForTransactionResponse(page, transactionsPath);
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
  });

  test.describe("filters transaction feeds by date range", () => {
    feedViews.forEach(({ tab, transactionsPath }) => {
      test(`filters ${tab} transaction feed by date range`, async ({
        loggedInTestUser: _user,
        homePage,
        page,
      }) => {
        const initialTxPromise = waitForTransactionResponse(page, transactionsPath);
        await page.reload();
        await homePage.goToTab(tab);
        await expect(homePage.transactionList).toBeVisible();

        const initialRes = await initialTxPromise;
        const initialData = (await initialRes.json()) as { results: TransactionResponseItem[] };
        const referenceTx = initialData.results[0];
        const dateRangeStart = isoStringToLocalMidnightStart(`${referenceTx.createdAt}`);
        const dateRangeEnd = isoStringToLocalMidnightEnd(
          addDays(startOfDay(referenceTx.createdAt), 1).toISOString()
        );

        const filtTxPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.dateRangeFilter.pickDateRange(dateRangeStart, dateRangeEnd);
        const res = await filtTxPromise;
        const data = (await res.json()) as { results: TransactionResponseItem[] };
        await expect(homePage.transactions).toHaveCount(data.results.length);
        for (const { createdAt } of data.results) {
          const createdAtDate = isoStringToLocalDateFull(`${createdAt}`);
          expect(
            isWithinInterval(createdAtDate, {
              start: dateRangeStart,
              end: dateRangeEnd,
            }),
            `transaction created date (${localDateToIsoString(createdAtDate)})
        is within ${localDateToIsoString(dateRangeStart)}
        and ${localDateToIsoString(dateRangeEnd)}`
          ).toBe(true);
        }

        const unfiltPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.clearDateRange();
        await expect(homePage.dateRangeFilter.openButton).toContainText("ALL");
        const unfiltRes = await unfiltPromise;
        const unfiltData = (await unfiltRes.json()) as { results: TransactionResponseItem[] };
        expect(unfiltData.results).toEqual(initialData.results);
      });
    });

    feedViews.forEach(({ tab, transactionsPath }) => {
      test(`does not show ${tab} transactions for out of range date limits`, async ({
        loggedInTestUser: _user,
        homePage,
        page,
      }) => {
        const dateRangeStart = startOfDay(new Date(2025, 7, 1));
        const dateRangeEnd = endOfDayUTC(addDays(dateRangeStart, 1));

        const initialTxPromise = waitForTransactionResponse(page, transactionsPath);
        await page.reload();
        await homePage.goToTab(tab);
        await initialTxPromise;

        const filtTxPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.dateRangeFilter.pickDateRange(dateRangeStart, dateRangeEnd);
        const filtRes = await filtTxPromise;
        const filtData = (await filtRes.json()) as { results: TransactionResponseItem[] };

        expect(filtData.results).toHaveLength(0);
        await expect(homePage.transactions).toHaveCount(0);
        await expect(homePage.emptyListHeader).toContainText("No Transactions");
        await expect(homePage.emptyListCreateButton).toHaveAttribute("href", "/transaction/new");
        await expect(homePage.emptyListCreateButton).toContainText("create a transaction", {
          ignoreCase: true,
        });
        await expect(homePage.emptyListCreateButton).toHaveCSS("text-transform", "uppercase");
      });
    });
  });

  test.describe("filters transaction feeds by amount range", () => {
    feedViews.forEach(({ tab, transactionsPath }) => {
      test(`filters ${tab} transaction feed by amount range`, async ({
        loggedInTestUser: _user,
        homePage,
        page,
      }) => {
        const initialTxPromise = waitForTransactionResponse(page, transactionsPath);
        await page.reload();
        await homePage.goToTab(tab);
        await expect(await homePage.getTab(tab)).toContainClass("Mui-selected");

        const initialRes = await initialTxPromise;
        const initialData = (await initialRes.json()) as { results: TransactionResponseItem[] };

        const filtTxPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.setAmountRange(dollarAmountRange.min, dollarAmountRange.max);
        await expect(homePage.amountRangeText).toContainText(
          `$${dollarAmountRange.min} - $${dollarAmountRange.max}`
        );

        const filtRes = await filtTxPromise;
        const filtData = (await filtRes.json()) as { results: TransactionResponseItem[] };
        const urlParams = new URL(filtRes.url()).searchParams;
        const rawAmountMin = dollarAmountRange.min * 100;
        const rawAmountMax = dollarAmountRange.max * 100;

        expect(urlParams.get("amountMin")).toEqual(`${rawAmountMin}`);
        expect(urlParams.get("amountMax")).toEqual(`${rawAmountMax}`);

        for (const { amount } of filtData.results) {
          expect(amount).toBeGreaterThanOrEqual(rawAmountMin);
          expect(amount).toBeLessThanOrEqual(rawAmountMax);
        }

        const unfiltPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.resetAmountRangeFilter();
        if (homePage.nav.isMobile()) {
          await expect(homePage.amountRangeDrawer).not.toBeVisible();
        } else {
          await expect(homePage.amountRangePopover).not.toBeVisible();
        }
        const unfiltRes = await unfiltPromise;
        const unfiltData = (await unfiltRes.json()) as { results: TransactionResponseItem[] };
        expect(unfiltData.results).toEqual(initialData.results);
      });
    });

    feedViews.forEach(({ tab, transactionsPath }) => {
      test(`does not show ${tab} transactions for out of range amount limits`, async ({
        loggedInTestUser: _user,
        homePage,
        page,
      }) => {
        const initialTxPromise = waitForTransactionResponse(page, transactionsPath);
        await page.reload();
        await homePage.goToTab(tab);
        await initialTxPromise;

        const filtTxPromise = waitForTransactionResponse(page, transactionsPath);
        await homePage.setAmountRange(550, 1000);
        await expect(homePage.amountRangeText).toContainText("$550 - $1,000");

        const filtRes = await filtTxPromise;
        const filtData = (await filtRes.json()) as { results: TransactionResponseItem[] };

        expect(filtData.results).toHaveLength(0);
        await expect(homePage.transactions).toHaveCount(0);
        await expect(homePage.emptyListHeader).toContainText("No Transactions");
        await expect(homePage.emptyListCreateButton).toHaveAttribute("href", "/transaction/new");
        await expect(homePage.emptyListCreateButton).toContainText("create a transaction", {
          ignoreCase: true,
        });
        await expect(homePage.emptyListCreateButton).toHaveCSS("text-transform", "uppercase");
      });
    });
  });

  test.describe("Feed item visibility", () => {
    test("mine feed only shows personal transactions", async ({
      loggedInTestUser: user,
      homePage,
      page,
    }) => {
      const txPromise = waitForTransactionResponse(page, "/transactions");
      await homePage.goToTab("mine");
      const res = await txPromise;
      const { results: transactions } = (await res.json()) as {
        results: TransactionResponseItem[];
      };

      for (const transaction of transactions) {
        const participants = [transaction.senderId, transaction.receiverId];
        expect(participants).toContain(user.id);
      }
      await expect(homePage.listSkeleton).not.toBeVisible();
    });

    test("first five items belong to contacts in public feed", async ({
      loggedInTestUser: user,
      homePage,
      page,
      request,
    }) => {
      const contactIds = await getContactUserIdsForUser(request, user.id);

      const txPromise = waitForTransactionResponse(page, "/transactions/public");
      await page.reload();
      const res = await txPromise;
      const { results } = (await res.json()) as { results: TransactionResponseItem[] };
      const transactions = results.slice(0, 5);

      for (const transaction of transactions) {
        const participants = [transaction.senderId, transaction.receiverId];
        const contactsInTransaction = contactIds.filter((id) => participants.includes(id));
        expect(
          contactsInTransaction.length,
          `"${contactsInTransaction}" are contacts of ${user.id}`
        ).toBeGreaterThan(0);
      }
      await expect(homePage.listSkeleton).not.toBeVisible();
    });

    test("friends feed only shows contact transactions", async ({
      loggedInTestUser: user,
      homePage,
      page,
      request,
    }) => {
      const contactIds = await getContactUserIdsForUser(request, user.id);

      const txPromise = waitForTransactionResponse(page, "/transactions/contacts");
      await homePage.goToTab("friends");
      const res = await txPromise;
      const { results: transactions } = (await res.json()) as {
        results: TransactionResponseItem[];
      };

      for (const transaction of transactions) {
        const participants = [transaction.senderId, transaction.receiverId];
        const contactsInTransaction = contactIds.filter((id) => participants.includes(id));
        expect(
          contactsInTransaction.length,
          `"${contactsInTransaction}" are contacts of ${user.id}`
        ).toBeGreaterThan(0);
      }
      await expect(homePage.listSkeleton).not.toBeVisible();
    });
  });
});

function waitForTransactionResponse(page: Page, transactionsPath: string) {
  return page.waitForResponse(
    (res) => new URL(res.url()).pathname === transactionsPath && res.request().method() === "GET"
  );
}
