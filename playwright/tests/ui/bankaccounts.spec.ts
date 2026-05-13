import { test } from "../../fixtures";
import { getTestUser, loginWithXState } from "../../helpers/auth";
import { reseedDatabase } from "../../helpers/database";


test.describe("bank accounts e2e tests", () => {
  test.beforeEach(async ({ request, page }) => {
    await reseedDatabase(request);
    const user = await getTestUser(request);
    await loginWithXState(page, user.username, process.env.TEST_PASSWORD);
  });

  
});