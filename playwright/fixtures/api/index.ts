import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { BankAccount, Transaction, User } from "models";
import { apiLoginUser, getThreeUsers, TestUsers } from "../../helpers/auth";
import { config } from "../../config";
import { reseedDatabase } from "../../helpers/database";



type Fixtures = {
  _reseedDatabase: void;
  threeTestUsers: TestUsers;
  testUser: User;
  testUserBankAccount: BankAccount;
  testUserTransaction: Transaction;
  testContact: User;
  authenticatedRequest: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  _reseedDatabase: [async ({ request }, use) => {
    await reseedDatabase(request);
    await use();
  },
  { auto: true },
  ],
  threeTestUsers: async ({ request }, use) => {
    const users = await getThreeUsers(request);
    await use(users);
  },
  testUser: async ({ threeTestUsers }, use) => {
    await use(threeTestUsers.userA);
  },
  testContact: async ({ threeTestUsers }, use) => {
    await use(threeTestUsers.userB);
  },
  authenticatedRequest: async ({ request, testUser }, use) => {
    await apiLoginUser(testUser.username, config.DEFAULT_PASSWORD, request);
    await use(request);
  },
  testUserBankAccount: async ({ authenticatedRequest }, use) => {
    const res = await authenticatedRequest.get(`${config.BACKEND_URL}/bankAccounts`);
    const { results: bankAccounts } = (await res.json()) as { results: BankAccount[] };
    expect(res.status()).toBe(200);
    expect(bankAccounts.length).toBeGreaterThan(0);
    const bankAccount = bankAccounts[0];
    await use(bankAccount);
  },
  testUserTransaction: async ({ authenticatedRequest }, use) => {
    const res = await authenticatedRequest.get(`${config.BACKEND_URL}/transactions`);
    const { results: transactions } = (await res.json()) as { results: Transaction[] };
    expect(res.status()).toBe(200);
    expect(transactions.length).toBeGreaterThan(0);
    const transaction = transactions[0];
    await use(transaction);
  }
});

export { expect } from "@playwright/test";