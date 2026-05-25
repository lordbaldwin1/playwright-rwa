import { test, expect } from "../../fixtures/api";
import { config } from "../../config";
import { BankAccount, Transaction } from "models";
import { isWithinInterval } from "date-fns";
import faker from "@faker-js/faker";

const apiTransactions = `${config.BACKEND_URL}/transactions`;
const getFakeAmount = () => parseInt(faker.finance.amount(), 10);

test.describe("Transactions API", () => {
  test("GET /transactions gets a list of transactions for user (default)", async ({
    authenticatedRequest,
    testUser,
  }) => {
    const res = await authenticatedRequest.get(apiTransactions);
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].senderId).toBe(testUser.id);
  });

  test("GET /transactions gets a list of pending request transactions for user", async ({
    authenticatedRequest,
    testUser,
  }) => {
    const res = await authenticatedRequest.get(apiTransactions, {
      params: {
        requestStatus: "pending",
      },
    });
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].senderId).toBe(testUser.id);
    expect(results[0].requestStatus).toBe("pending");
  });

  test("GET /transactions gets a list of pending request transactions for user between a time range", async ({
    authenticatedRequest,
    testUser,
  }) => {
    const dateRangeStart = new Date("2018-01-01");
    const dateRangeEnd = new Date("2030-12-05");
    const res = await authenticatedRequest.get(apiTransactions, {
      params: {
        requestStatus: "pending",
        dateRangeStart: "2018-01-01",
        dateRangeEnd: "2030-12-05",
      },
    });
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].senderId).toBe(testUser.id);
    expect(results[0].requestStatus).toBe("pending");
    const createdAt = new Date(results[0].createdAt);
    expect(isWithinInterval(createdAt, { start: dateRangeStart, end: dateRangeEnd })).toBe(true);
  });

  test("GET /transactions/contacts gets a list of transactions for users list of contacts, page one", async ({
    authenticatedRequest,
  }) => {
    const res = await authenticatedRequest.get(`${apiTransactions}/contacts`, {
      params: {
        page: 1,
      },
    });
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(1);
  });

  test("GET /transactions/contacts gets a list of transactions for users list of contacts, page two", async ({
    authenticatedRequest,
  }) => {
    const res = await authenticatedRequest.get(`${apiTransactions}/contacts`, {
      params: {
        page: 2,
      },
    });
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(1);
  });

  test("GET /transactions/public gets a list of public transactions", async ({
    authenticatedRequest,
  }) => {
    const res = await authenticatedRequest.get(`${apiTransactions}/public`);
    expect(res.status()).toBe(200);
    const { results } = (await res.json()) as { results: Transaction[] };
    expect(results.length).toBeGreaterThan(1);
  });

  test("POST /transactions creates a new payment", async ({
    authenticatedRequest,
    testUser,
    testUserBankAccount: bankAccount,
    testContact,
  }) => {
    const res = await authenticatedRequest.post(apiTransactions, {
      data: {
        transactionType: "payment",
        source: bankAccount.id,
        receiverId: testContact.id,
        description: `Payment: ${testUser.id} to ${testContact.id}`,
        amount: getFakeAmount(),
        privacyLevel: "public",
      },
    });
    expect(res.status()).toBe(200);

    const { transaction } = (await res.json()) as { transaction: Transaction };
    expect(typeof transaction.id).toBe("string");
    expect(transaction.status).toBe("complete");
    expect(transaction.requestStatus).toBeUndefined();
  });

  test("POST /transactions creates a new request", async ({
    authenticatedRequest,
    testUser,
    testUserBankAccount: bankAccount,
    testContact,
  }) => {
    const res = await authenticatedRequest.post(apiTransactions, {
      data: {
        transactionType: "request",
        source: bankAccount.id,
        receiverId: testContact.id,
        description: `Request: ${testUser.id} from ${testContact.id}`,
        amount: getFakeAmount(),
        privacyLevel: "public",
      },
    });
    expect(res.status()).toBe(200);
    const { transaction } = (await res.json()) as { transaction: Transaction };
    expect(typeof transaction.id).toBe("string");
    expect(transaction.status).toBe("pending");
    expect(transaction.requestStatus).toBe("pending");
  });

  test("PATCH /transactions/:transactionId updates a transaction", async ({
    authenticatedRequest,
    testUserTransaction: transaction,
  }) => {
    const res = await authenticatedRequest.patch(`${apiTransactions}/${transaction.id}`, {
      data: {
        requestStatus: "rejected",
      },
    });
    expect(res.status()).toBe(204);
  });

  test("PATCH /transactions/:transactionId errors when an invalid field sent", async ({
    authenticatedRequest,
    testUserTransaction: transaction,
  }) => {
    const res = await authenticatedRequest.patch(`${apiTransactions}/${transaction.id}`, {
      data: {
        notATransactionField: "not a transaction field",
      },
    });
    expect(res.status()).toBe(422);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors.length).toBe(1);
  });
});
