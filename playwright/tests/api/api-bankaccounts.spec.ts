import { BankAccount } from "models/bankaccount";
import { config } from "../../config";
import { expect, test } from "../../fixtures/api";
import { apiLoginUser } from "../../helpers/auth";
import faker from "@faker-js/faker";

const apiBankAccounts = `${config.BACKEND_URL}/bankAccounts`;
const apiGraphQL = `${config.BACKEND_URL}/graphql`;

test.describe("bank accounts API", () => {
  test("GET /bankAccounts", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.get(apiBankAccounts);
    const { results } = (await res.json()) as { results: BankAccount[] };
    expect(res.status()).toEqual(200);
    expect(results[0].userId).toEqual(testUser.id);
  });

  test("POST /bankAccounts", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.post(apiBankAccounts, {
      data: {
        bankName: `${faker.company.companyName()} Bank`,
        accountNumber: faker.finance.account(10),
        routingNumber: faker.finance.account(9),
      },
    });
    const { account } = (await res.json()) as { account: BankAccount };
    expect(res.status()).toEqual(200);
    expect(account.userId).toEqual(testUser.id);
  });

  test("DELETE /bankAccounts/:bankAccountId", async ({ authenticatedRequest }) => {
    let res = await authenticatedRequest.get(apiBankAccounts);
    const { results } = (await res.json()) as { results: BankAccount[] };
    const { id: bankAccountId } = results[0];
    res = await authenticatedRequest.delete(`${apiBankAccounts}/${bankAccountId}`);
    expect(res.status()).toEqual(200);
  });

  test("GET /graphql", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.post(apiGraphQL, {
      data: {
        query: `query { 
          listBankAccount {
            id
            uuid
            userId
            bankName
            accountNumber
            routingNumber
            isDeleted
            createdAt 
            modifiedAt 
          }
        }`,
      },
    });
    const body = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors?: any[] };
    expect(res.status()).toEqual(200);
    expect(body.errors).toBeUndefined();
    expect(body.data.listBankAccount[0].userId).toEqual(testUser.id);
  });

  test("POST /graphql", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.post(apiGraphQL, {
      data: {
        query: `mutation createBankAccount ($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
          createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
            id
            uuid
            userId
            bankName
            accountNumber
            routingNumber
            isDeleted
            createdAt
            modifiedAt
          }
        }`,
        variables: {
          bankName: `${faker.company.companyName()} Bank`,
          accountNumber: faker.finance.account(10),
          routingNumber: faker.finance.account(9),
        },
      },
    });
    const body = (await res.json()) as { data: { createBankAccount: BankAccount }; errors?: any[] };
    expect(res.status()).toEqual(200);
    expect(body.errors).toBeUndefined();
    expect(body.data.createBankAccount.userId).toEqual(testUser.id);
  });

  test("DELETE /graphql", async ({ authenticatedRequest, testUser }) => {
    let res = await authenticatedRequest.get(apiBankAccounts);
    const { results } = (await res.json()) as { results: BankAccount[] };
    const { id: bankAccountId } = results[0];
    res = await authenticatedRequest.post(apiGraphQL, {
      data: {
        query: `mutation deleteBankAccount ($id: ID!) {
          deleteBankAccount(id: $id)
        }`,
        variables: { id: bankAccountId },
      },
    });
    const body = (await res.json()) as { data: { deleteBankAccount: boolean }; errors?: any[] };
    expect(res.status()).toEqual(200);
    expect(body.errors).toBeUndefined();
    expect(body.data.deleteBankAccount).toBe(true);
  });
});
