import { APIRequestContext, expect } from "@playwright/test";
import { config } from "../../config";
import { Transaction } from "models";

export async function getTransactions(request: APIRequestContext) {
  const transRes = await request.get(`${config.BACKEND_URL}/testData/transactions`);
  expect(transRes.ok()).toBeTruthy();
  const { results: transactions } = (await transRes.json()) as { results: Transaction[] };
  return transactions;
}
