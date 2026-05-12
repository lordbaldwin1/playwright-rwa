import { APIRequestContext, expect } from "@playwright/test";
import { BACKEND_URL } from "../config";
import { User } from "models";

export async function getTestUser(request: APIRequestContext) {
  const res = await request.get(`${BACKEND_URL}/testData/users`);
  expect(res.status()).toBeTruthy();
  const users = (await res.json()).results as User[];
  return users[0];
}

export async function apiLoginUser(
  username: string,
  password: string = "s3cret",
  request: APIRequestContext,
) {
  const res = await request.post(`${BACKEND_URL}/login`, {
    data: {
      username: username,
      password: process.env.TEST_PASSWORD ?? password,
    },
  });
  expect(res.status()).toBeTruthy();
};

export async function clientLoginUser( username: string, password: string = "s3cret") {
  
}
