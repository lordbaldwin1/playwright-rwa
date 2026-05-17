import { Locator, Page } from "@playwright/test";
import { isMobile } from "../helpers/is-mobile";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";

export class Navigation {
  private readonly page: Page;
  readonly notificationsCount: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;
  readonly sideNavBankAccounts: Locator;
  readonly sideNavHome: Locator;
  readonly newTransactionButton: Locator;
  readonly userBalance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.notificationsCount = page.getByTestId("nav-top-notifications-count");
    this.sideNavToggle = page.getByTestId("sidenav-toggle");
    this.sideNavSignOut = page.getByTestId("sidenav-signout");
    this.sideNavBankAccounts = page.getByTestId("sidenav-bankaccounts");
    this.sideNavHome = page.getByTestId("sidenav-home");
    this.newTransactionButton = page.getByTestId("nav-top-new-transaction");
    this.userBalance = page.getByTestId("sidenav-user-balance");
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

  async goToHome() {
    if (isMobile(this.page)) {
      await this.sideNavToggle.click();
    }
    await this.sideNavHome.click();
    return new HomePage(this.page);
  }

  async goToNewTransaction() {
    if (isMobile(this.page)) {
      await this.sideNavToggle.click();
    }
    await this.newTransactionButton.click();
    return new NewTransactionPage(this.page);
  }
}
