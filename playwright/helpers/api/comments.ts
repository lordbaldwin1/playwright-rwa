import { config } from "../../config";
import { APIRequestContext, expect } from "@playwright/test";
import { Comment } from "models";


export async function getComments(request: APIRequestContext) {
  const res = await request.get(`${config.BACKEND_URL}/testData/comments`);
  expect(res.ok()).toBeTruthy();
  const { results: comments } = (await res.json()) as { results: Comment[] };
  return comments;
}