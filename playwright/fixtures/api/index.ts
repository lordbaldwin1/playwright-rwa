import { test as base, type APIRequestContext } from "@playwright/test";
import { User } from "models";
import { apiLoginUser, getTestUser, getThreeUsers, TestUsers } from "../../helpers/auth";
import { config } from "../../config";



type Fixtures = {
  threeTestUsers: TestUsers;
  testUser: User;
  testContact: User;
  authenticatedRequest: APIRequestContext;
};

export const test = base.extend<Fixtures>({
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
});

export { expect } from "@playwright/test";