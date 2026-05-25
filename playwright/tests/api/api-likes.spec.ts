

import { config } from "../../config";
import { test, expect } from "../../fixtures/api";
import { Like } from "models";
import { getLikes } from "../../helpers/api/likes";

const apiLikes = `${config.BACKEND_URL}/likes`;

test.describe("Likes API", () => {
  test("GET /likes/:transactionId gets a list of likes for a transaction", async ({
      request,
    }) => {
      const likes = await getLikes(request);
      const transactionId = likes[0].transactionId;
      const res = await request.get(`${apiLikes}/${transactionId}`);
      const { likes: likesResponse } = (await res.json()) as { likes: Like[] };
      expect(res.status()).toBe(200);
      expect(likesResponse).toHaveLength(1);
      expect(likesResponse[0].transactionId).toBe(transactionId);
    });
  test("POST /likes/:transactionId creates a new like for a transaction", async ({
    request,
  }) => {
    const likes = await getLikes(request);
    const transactionId = likes[0].transactionId;
    const res = await request.post(`${apiLikes}/${transactionId}`);
    expect(res.status()).toBe(200);
  });
});