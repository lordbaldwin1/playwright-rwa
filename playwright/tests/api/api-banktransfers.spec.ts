import { config } from "../../config";
import { test, expect } from "../../fixtures/api";
import { BankTransfer } from "models";

const apiBankTransfer = `${config.BACKEND_URL}/bankTransfers`;

test.describe("bank transfers API", () => {
  test("GET /bankTransfers", async ({ authenticatedRequest, testUser }) => {
    const res = await authenticatedRequest.get(apiBankTransfer);
    const { transfers } = (await res.json()) as { transfers: BankTransfer[] };
    expect(res.status()).toEqual(200);
    expect(transfers[0].userId).toEqual(testUser.id);
  });
});