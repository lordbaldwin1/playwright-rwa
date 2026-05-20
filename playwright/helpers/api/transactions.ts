import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../../config";
import { Transaction } from "models";

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
