import { BankAccount } from "models";
import { config } from "../../config";
import { expect, test } from "../../fixtures/api";
import { L } from "vitest/dist/chunks/reporters.d.BFLkQcL6";
import faker from "@faker-js/faker";

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
        query: `query listBankAccount {
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
        query: `mutation createBankAccount ($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
          createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
            id
            userId
          }
        }`,
        variables: {
          bankName: bankToAdd.bankName,
          accountNumber: bankToAdd.accountNumber,
          routingNumber: bankToAdd.routingNumber,
        },
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
    let res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation createBankAccount ($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
          createBankAccount(
            bankName: $bankName,
            accountNumber: $accountNumber,
            routingNumber: $routingNumber,
          ) {
            id  
            bankName
          }
        }
        `,
        variables: {
          bankName: `${faker.company.companyName()} Bank`,
          accountNumber: faker.finance.account(10),
          routingNumber: faker.finance.account(9),
        },
      },
    });
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
    expect(queriedBankAccounts.length).toBeGreaterThan(1);
    expect(queriedBankAccounts.at(-1)!.id).toEqual(newBankAccount.id);
    expect(queriedBankAccounts.at(-1)!.bankName).toEqual(newBankAccount.bankName);

    res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation {
          deleteBankAccount(id: "${newBankAccount.id}")
        }`,
      },
    });
    expect(res.status()).toEqual(200);
    const body = await res.json();
    expect(body.data.deleteBankAccount).toBe(true);

    res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          listBankAccount {
            id
            bankName
            isDeleted
          }
        }`,
      },
    });
    expect(res.status()).toBe(200);
    const {
      data: { listBankAccount: finalBankAccounts },
      errors,
    } = (await res.json()) as { data: { listBankAccount: BankAccount[] }; errors: any[] };
    expect(errors).toBeUndefined();
    expect(finalBankAccounts.at(-1)!.isDeleted).toBe(true);
  });

  test("missing required arg", async ({ authenticatedRequest: request }) => {
    let res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation createBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
          createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
            id
          }
        }`,
        variables: {
          accountNumber: faker.finance.account(10),
          routingNumber: faker.finance.account(9),
        },
      },
    });
    expect(res.status()).toBe(200);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors).toBeDefined();
    expect(errors[0].message).toBe(
      'Variable "$bankName" of required type "String!" was not provided.'
    );
  });

  test("invalid variable type", async ({ authenticatedRequest: request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation createBankAccount($bankName: String!, $accountNumber: String!, $routingNumber: String!) {
          createBankAccount(bankName: $bankName, accountNumber: $accountNumber, routingNumber: $routingNumber) {
            id
          }
        }`,
        variables: {
          bankName: `${faker.company.companyName()} bank`,
          accountNumber: 1234567890,
          routingNumber: faker.finance.account(9),
        },
      },
    });
    expect(res.status()).toBe(200);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors[0].message).toBe(
      'Variable "$accountNumber" got invalid value 1234567890; String cannot represent a non string value: 1234567890'
    );
  });

  test("delete non-existant id", async ({ authenticatedRequest: request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation deleteBankAccount($id: ID!) {
          deleteBankAccount(id: $id)
        }`,
        variables: {
          id: faker.random.alphaNumeric(11),
        },
      },
    });
    const {
      data: { deleteBankAccount },
    } = (await res.json()) as { data: { deleteBankAccount: boolean } };
    expect(deleteBankAccount).toBe(true);
  });

  test("malformed query syntax", async ({ authenticatedRequest: request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `mutation createBankAccount {
        }`,
      },
    });
    expect(res.status()).toBe(200);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors[0].message).toBe('Syntax Error: Expected Name, found "}".');
  });

  test("introspection query on BankAccount type", async ({ authenticatedRequest: request }) => {
    const res = await request.post(API_GRAPHQL, {
      data: {
        query: `query {
          __schema {
            queryType { name fields { name args { name }} }
            mutationType { name fields { name args { name }} }
            types { name kind }
          }
        }`,
      },
    });
    console.log(JSON.stringify(await res.json(), null, 2))
  });
});
