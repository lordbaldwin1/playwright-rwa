import { Like } from "models";
import { config } from "../../config";
import { APIRequestContext, expect } from "@playwright/test";


export async function getLikes(request: APIRequestContext) {
  const res = await request.get(`${config.BACKEND_URL}/testData/likes`);
  expect(res.ok()).toBeTruthy();
  const { results: likes } = (await res.json()) as { results: Like[] };
  return likes;
}