import { config } from "../../config";
import { test as setup } from "../../fixtures/api";
import { apiLoginUser } from "../../helpers/auth";

setup("auth", async ({ testUser, request }) => {
  await apiLoginUser(testUser.username, config.DEFAULT_PASSWORD, request);
  await request.storageState({ path: config.API_AUTH_FILE_PATH });
});
