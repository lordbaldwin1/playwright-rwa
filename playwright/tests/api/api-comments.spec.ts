import { Comment } from "models";
import { config } from "../../config";
import { expect, test } from "../../fixtures/api";
import { getComments } from "../../helpers/api/comments";

const apiComments = `${config.BACKEND_URL}/comments`;

test.describe("Comments API", () => {
  test("GET /comments/:transactionId", async ({ authenticatedRequest }) => {
    const allComments = await getComments(authenticatedRequest);
    const transactionId = allComments[0].transactionId;

    const res = await authenticatedRequest.get(`${apiComments}/${transactionId}`);
    expect(res.status()).toBe(200);
    const { comments } = (await res.json()) as { comments: Comment[] };
    expect(Array.isArray(comments)).toBe(true);
    expect(comments).toHaveLength(1);
  });

  test("POST /comments/:transactionID", async ({
    authenticatedRequest,
  }) => {
    const allComments = await getComments(authenticatedRequest);
    const transactionId = allComments[0].transactionId;

    const res = await authenticatedRequest.post(`${apiComments}/${transactionId}`, {
      data: {
        content: "This is my comment",
      },
    });
    expect(res.status()).toBe(200);
  });
});
