import { BankAccount } from "models";
import { config } from "../../config";
import { expect, test } from "../../fixtures/api";
import { L } from "vitest/dist/chunks/reporters.d.BFLkQcL6";

const API_GRAPHQL = `${config.BACKEND_URL}/graphql`;

test.describe("graphql playground", () => {
  test("unauthenticated request", async ({ request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          listBankAccount {
            id
            uuid
          }
        }`,
      },
    });
    const body = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors?: any[] };
    expect(body.errors).toBeDefined();
    expect(body.errors).toHaveLength(1);
    expect(body.errors![0].path[0]).toEqual("listBankAccount");
    expect(body.errors![0].message).toEqual(
      "TypeError: Cannot read properties of undefined (reading 'id')"
    );
    expect(body.data.listBankAccount).toBeNull();
  });

  test("listBankAccounts underfetching", async ({ authenticatedRequest: request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          listBankAccount {
            id
            uuid
            userId
          }
        }
        `,
      },
    });
    const {
      data: { listBankAccount: bankAccounts },
    } = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors?: any[] };
    expect(bankAccounts[0]).toHaveProperty("id");
    expect(bankAccounts[0]).toHaveProperty("uuid");
    expect(bankAccounts[0]).toHaveProperty("userId");
    expect(bankAccounts[0]).not.toHaveProperty("bankName");
  });

  test("bank accounts with id, bankName, accountNumber", async ({
    authenticatedRequest: request,
  }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
        listBankAccount {
          id
          bankName
          accountNumber
          }
        }
        `,
      },
    });
    const {
      data: { listBankAccount: bankAccounts },
    } = (await res.json()) as { data: { listBankAccount: BankAccount[] } };
    expect(res.status()).toEqual(200);
    expect(bankAccounts[0]).toHaveProperty("id");
    expect(bankAccounts[0]).toHaveProperty("bankName");
    expect(bankAccounts[0]).toHaveProperty("accountNumber");
    expect(bankAccounts[0]).not.toHaveProperty("uuid");
    expect(bankAccounts[0]).not.toHaveProperty("routingNumber");
    expect(bankAccounts[0]).not.toHaveProperty("isDeleted");
    expect(bankAccounts[0]).not.toHaveProperty("createdAt");
    expect(bankAccounts[0]).not.toHaveProperty("modifiedAt");
  });

  test("create a muation with variables", async ({ authenticatedRequest: request, testUser }) => {
    const bankToAdd = {
      bankName: "Epic Bank 12",
      accountNumber: "123456789",
      routingNumber: "0987654321",
    };

    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation {
          createBankAccount(
            bankName: "${bankToAdd.bankName}"
            accountNumber: "${bankToAdd.accountNumber}"
            routingNumber: "${bankToAdd.routingNumber}"
          ) {
            id
            userId  
          }
        }`,
      },
    });
    const {
      data: { createBankAccount: createdAccount },
    } = (await res.json()) as { data: { createBankAccount: BankAccount }; errors?: any[] };
    expect(res.status()).toEqual(200);
    expect(createdAccount).toHaveProperty("id");
    expect(createdAccount).toHaveProperty("userId");
    expect(createdAccount.userId).toEqual(testUser.id);
  });

  test("authenticated request retusn 200 and no errors", async ({
    authenticatedRequest: request,
  }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          listBankAccount {
            id
            uuid
            bankName
          }
        }`,
      },
    });
    const {
      data: { listBankAccount: _bankAccounts },
      errors,
    } = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors?: any[] };
    expect(res.status()).toEqual(200);
    expect(errors).toBeUndefined();
  });

  test("bank account creation and deletion", async ({ authenticatedRequest: request }) => {
    const bankToAdd = {
      bankName: "creation and deletion",
      accountNumber: "123456789",
      routingNumber: "0987654321",
    };
    let res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation {
          createBankAccount(
            bankName: "${bankToAdd.bankName}"
            accountNumber: "${bankToAdd.accountNumber}"
            routingNumber: "${bankToAdd.routingNumber}"
          ) {
            id  
          }
        }
        `,
      },
    });
    console.log(await res.json());
    const {
      data: { createBankAccount: newBankAccount },
      errors: newBankAccountErrors,
    } = (await res.json()) as { data: { createBankAccount: BankAccount }; errors?: any[] };
    expect(newBankAccount).toHaveProperty("id");
    expect(newBankAccountErrors).toBeUndefined();

    res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          listBankAccount {
            id
            bankName
          }
        }`,
      },
    });
    const {
      data: { listBankAccount: queriedBankAccounts },
      errors: queriedBankAccountErrors,
    } = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors: any[] };
    expect(res.status()).toEqual(200);
    expect(queriedBankAccountErrors).toBeUndefined();
    expect(queriedBankAccounts.find((ba) => ba.id === newBankAccount.id)).toBeDefined();
  });
});
