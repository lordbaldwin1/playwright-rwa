import { Page } from "@playwright/test";


export function isMobile(page: Page) {
  const viewportSize = page.viewportSize();
  if (!viewportSize) {
    throw new Error("Unable to get viewport size");
  }
  return viewportSize.width < 600;
}