import { APIRequestContext, expect } from "@playwright/test";
import { Contact } from "models";
import { config } from "../config";

export async function reseedDatabase(request: APIRequestContext) {
  const res = await request.post(`${config.BACKEND_URL}/testData/seed`);
  expect(res.ok()).toBeTruthy();
}

export async function filterTestData<T extends Record<string, unknown>>(
  request: APIRequestContext,
  entity: string,
  query: Partial<T>
): Promise<T[]> {
  const res = await request.get(`${config.BACKEND_URL}/testData/${entity}`);
  expect(res.ok()).toBeTruthy();
  const { results } = (await res.json()) as { results: T[] };
  return results.filter((item) =>
    Object.entries(query).every(([key, value]) => item[key] === value)
  );
}

export async function getContactUserIdsForUser(request: APIRequestContext, userId: string) {
  const contacts = await filterTestData<Contact>(request, "contacts", { userId });
  return contacts.map((contact) => contact.contactUserId);
}
