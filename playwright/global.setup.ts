import { expect, test as setup } from "@playwright/test";
import { BACKEND_URL } from "./config";

setup("seed database", async ({ request }) => {
  const res = await request.post(`${BACKEND_URL}/testData/seed`);
  expect(res.status()).toBeTruthy();
});
