import { Locator, Page } from "@playwright/test";
import { isMobile } from "../helpers/is-mobile";
import { BankAccountsPage } from "../pages/BankAccountsPage";

export class Navigation {
  private readonly page: Page;
  readonly notificationsCount: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;
  readonly sideNavBankAccounts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.notificationsCount = page.getByTestId("nav-top-notifications-count");
    this.sideNavToggle = page.getByTestId("sidenav-toggle");
    this.sideNavSignOut = page.getByTestId("sidenav-signout");
    this.sideNavBankAccounts = page.getByTestId("sidenav-bankaccounts");
  }

  async openSideNav() {
    await this.sideNavToggle.click();
  }

  async signOut() {
    await this.sideNavSignOut.click();
  }

  async goToBankAccounts() {
    if (isMobile(this.page)) {
      await this.sideNavToggle.click();
    }
    await this.sideNavBankAccounts.click();
    return new BankAccountsPage(this.page);
  }
}
