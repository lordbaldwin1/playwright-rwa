import { Page } from "@playwright/test";

export function waitForPageGetResponse(page: Page, transactionsPath: string) {
  return page.waitForResponse(
    (res) => new URL(res.url()).pathname === transactionsPath && res.request().method() === "GET"
  );
}
