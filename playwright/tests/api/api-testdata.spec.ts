import { config } from "../../config";
import { test, expect } from "../../fixtures/api";

const apiTestData = `${config.BACKEND_URL}/testData`;
const entities = ["users", "contacts", "bankaccounts", "notifications", "transactions", "likes", "comments", "banktransfers"];
test.describe("Test Data API", () => {
  entities.forEach((entity) => {
    test(`GET /testData/${entity} gets a list of ${entity}`, async ({ request }) => {
      const res = await request.get(`${apiTestData}/${entity}`);
      expect(res.status()).toBe(200);
      const { results } = await res.json() as { results: any[] };
      expect(results.length).toBeGreaterThan(0);
    });
  });
});