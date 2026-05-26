import { test, expect } from "../../fixtures/api";
import { config } from "../../config";
import { User } from "models";
import faker from "@faker-js/faker";

const apiUsers = `${config.BACKEND_URL}/users`;

test.describe("Users API", function () {
  test("GET /users gets a list of users", async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.get(apiUsers);
    expect(res.status()).toBe(200);
    const { results: users } = (await res.json()) as { results: User[] };
    expect(users.length).toBeGreaterThan(1);
  });

  test("GET /users/:userId gets a user", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/${testUser.id}`);
    expect(res.status()).toBe(200);
    const { user } = (await res.json()) as { user: User };
    expect(user.id).toBe(testUser.id);
    expect(user).toHaveProperty("firstName");
    expect(user).toHaveProperty("lastName");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("phoneNumber");
    expect(user).toHaveProperty("avatar");
    expect(user).toHaveProperty("balance");
    expect(user).toHaveProperty("createdAt");
    expect(user).toHaveProperty("modifiedAt");
  });

  test("GET /users/:userId errors when invalid userId", async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/1234`, {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(422);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors.length).toBe(1);
  });

  test("GET /users/profile/:username gets a user profile by username", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/profile/${testUser.username}`);
    expect(res.status()).toBe(200);
    const { user } = (await res.json()) as { user: User };
    expect(user).toEqual({
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      avatar: testUser.avatar,
    });
    expect(user).not.toHaveProperty("balance");
  });

  test("GET /users/search gets users by email", async ({ authenticatedRequest, testContact }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/search`, {
      params: {
        q: testContact.email,
      },
    });
    expect(res.status()).toBe(200);
    const { results: users } = (await res.json()) as { results: User[] };
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toMatchObject({
      firstName: testContact.firstName,
      lastName: testContact.lastName,
      avatar: testContact.avatar,
    });
  });

  test("GET /users/search gets users by phone number", async ({ authenticatedRequest, testContact }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/search`, {
      params: {
        q: testContact.phoneNumber,
      },
    });
    expect(res.status()).toBe(200);
    const { results: users } = (await res.json()) as { results: User[] };
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toMatchObject({
      firstName: testContact.firstName,
      lastName: testContact.lastName,
      avatar: testContact.avatar,
    });
  });

  test("GET /users/search gets users by username", async ({ authenticatedRequest, testContact }) => {
    const res = await authenticatedRequest.get(`${apiUsers}/search`, {
      params: {
        q: testContact.username,
      },
    });
    expect(res.status()).toBe(200);
    const { results: users } = (await res.json()) as { results: User[] };
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toMatchObject({
      firstName: testContact.firstName,
      lastName: testContact.lastName,
      avatar: testContact.avatar,
    });
  });

  test("POST /users creates a new user", async ({ authenticatedRequest }) => {
    const firstName = faker.name.firstName();
    const res = await authenticatedRequest.post(apiUsers, {
      data: {
        firstName,
        lastName: faker.name.lastName(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.phoneNumber(),
        avatar: faker.internet.avatar(),
      },
    });
    expect(res.status()).toBe(201);
    const { user } = (await res.json()) as { user: User };
    expect(user.firstName).toBe(firstName);
  });

  test("POST /users creates a new user with an account balance in cents", async ({ authenticatedRequest }) => {
    const firstName = faker.name.firstName();
    const res = await authenticatedRequest.post(apiUsers, {
      data: {
        firstName,
        lastName: faker.name.lastName(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.phoneNumber(),
        avatar: faker.internet.avatar(),
        balance: 100_00,
      },
    });
    expect(res.status()).toBe(201);
    const { user } = (await res.json()) as { user: User };
    expect(user.firstName).toBe(firstName);
    expect(user.balance).toBe(100_00);
  });

  test("POST /users errors when an invalid field sent", async ({ authenticatedRequest }) => {
    const res = await authenticatedRequest.post(apiUsers, {
      data: {
        notAUserField: "not a user field",
      },
    });
    expect(res.status()).toBe(422);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors.length).toBe(1);
  });

  test("PATCH /users/:userId updates a user", async ({ authenticatedRequest, testUser }) => {
    const firstName = faker.name.firstName();
    const res = await authenticatedRequest.patch(`${apiUsers}/${testUser.id}`, {
      data: {
        firstName,
      },
    });
    expect(res.status()).toBe(204);
  });

  test("PATCH /users/:userId errors when an invalid field sent", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.patch(`${apiUsers}/${testUser.id}`, {
      data: {
        notAUserField: "not a user field",
      },
    });
    expect(res.status()).toBe(422);
    const { errors } = (await res.json()) as { errors: any[] };
    expect(errors.length).toBe(1);
  });

  test("POST /login logs in as a user", async ({ request, testUser }) => {
    const res = await request.post(`${config.BACKEND_URL}/login`, {
      data: {
        username: testUser.username,
        password: config.DEFAULT_PASSWORD,
      },
    });
    expect(res.status()).toBe(200);
  });
});