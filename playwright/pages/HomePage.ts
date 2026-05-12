import { Locator, Page } from "@playwright/test";

export class HomePage {
  private readonly page: Page;
  readonly userOnboardingDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userOnboardingDialog = this.page.getByTestId("user-onboarding-dialog");
  }
}
