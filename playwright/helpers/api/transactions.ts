import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../../config";
import { Transaction, TransactionRequestStatus, TransactionStatus } from "models";

export async function getTransactions(request: APIRequestContext) {
  const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
  expect(transRes.ok()).toBeTruthy();
  const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
  return transactions;
}

export function findTransaction(
  transactions: Transaction[],
  query: { senderId?: string; receiverId?: string }
) {
  return transactions.find(
    (t) =>
      (query.senderId === undefined || t.senderId === query.senderId) &&
      (query.receiverId === undefined || t.receiverId === query.receiverId)
  );
}

export type FindTransactionRequestQuery = {
  status?: TransactionStatus | string;
  requestStatus?: TransactionRequestStatus | string;
  requestResolvedAt?: string;
};

const defaultPendingRequestQuery: FindTransactionRequestQuery = {
  status: TransactionStatus.pending,
  requestStatus: TransactionRequestStatus.pending,
  requestResolvedAt: "",
};

const defaultCompletedTransactionQuery: FindTransactionRequestQuery = {
  status: TransactionStatus.complete,
  requestStatus: TransactionRequestStatus.accepted,
};

async function findTransactionInTestData(
  request: APIRequestContext,
  matchQuery: FindTransactionRequestQuery & { receiverId: string }
) {
  const transactions = await getTransactions(request);
  const transaction = transactions.find((t) =>
    Object.entries(matchQuery).every(([key, value]) => t[key as keyof Transaction] === value)
  );

  if (!transaction) {
    throw new Error(`No transaction found: ${JSON.stringify(matchQuery)}`);
  }

  return transaction;
}

/** Mirrors Cypress `cy.database("find", "transactions", { receiverId, status: pending, ... })`. */
export async function findTransactionRequestForUser(
  request: APIRequestContext,
  receiverId: string,
  query: FindTransactionRequestQuery = {}
) {
  return findTransactionInTestData(request, {
    ...defaultPendingRequestQuery,
    ...query,
    receiverId,
  });
}

/** Mirrors Cypress `cy.database("find", "transactions", { receiverId, status: complete, requestStatus: accepted })`. */
export async function findCompletedTransactionForUser(
  request: APIRequestContext,
  receiverId: string,
  query: FindTransactionRequestQuery = {}
) {
  return findTransactionInTestData(request, {
    ...defaultCompletedTransactionQuery,
    ...query,
    receiverId,
  });
}
