import { Locator, Page } from "@playwright/test";

export class Navigation {
  readonly notificationsCount: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;

  constructor(page: Page) {
    this.notificationsCount = page.getByTestId("nav-top-notifications-count");
    this.sideNavToggle = page.getByTestId("sidenav-toggle");
    this.sideNavSignOut = page.getByTestId("sidenav-signout");
  }

  async openSideNav() {
    await this.sideNavToggle.click();
  }

  async signOut() {
    await this.sideNavSignOut.click();
  }
}
