import { test as setup } from "@playwright/test";
import { reseedDatabase } from "../helpers/database";

setup("seed database", async ({ request }) => {
  await reseedDatabase(request);
});
