import { Locator, Page } from "@playwright/test";
import { isMobile } from "../helpers/is-mobile";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { SignInPage } from "../pages/SignInPage";
import { NotificationsPage } from "../pages/NotificationsPage";

export class Navigation {
  private readonly page: Page;
  readonly notificationsCount: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;
  readonly sideNavBankAccounts: Locator;
  readonly sideNavHome: Locator;
  readonly sideNavNotifications: Locator;
  readonly newTransactionButton: Locator;
  readonly userBalance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.notificationsCount = this.page.getByTestId("nav-top-notifications-count");
    this.sideNavToggle = this.page.getByTestId("sidenav-toggle");
    this.sideNavSignOut = this.page.getByTestId("sidenav-signout");
    this.sideNavBankAccounts = this.page.getByTestId("sidenav-bankaccounts");
    this.sideNavHome = this.page.getByTestId("sidenav-home");
    this.newTransactionButton = this.page.getByTestId("nav-top-new-transaction");
    this.userBalance = this.page.getByTestId("sidenav-user-balance");
    this.sideNavNotifications = this.page.getByTestId("sidenav-notifications");
  }

  async toggleSideNav() {
    await this.sideNavToggle.click();
  }

  async isMobile() {
    if (isMobile(this.page)) {
      return true;
    } else {
      return false;
    }
  }

  async mobileCloseSideNav() {
    await this.page.locator(".MuiBackdrop-root").click();
  }

  async signOut() {
    if (isMobile(this.page)) {
      await this.toggleSideNav();
    }
    await this.sideNavSignOut.click();
    return new SignInPage(this.page);
  }

  async goToBankAccounts() {
    if (isMobile(this.page)) {
      await this.toggleSideNav();
    }
    await this.sideNavBankAccounts.click();
    return new BankAccountsPage(this.page);
  }

  async goToHome() {
    if (isMobile(this.page)) {
      await this.toggleSideNav();
    }
    await this.sideNavHome.click();
    return new HomePage(this.page);
  }

  async goToNewTransaction() {
    if (isMobile(this.page)) {
      await this.toggleSideNav();
    }
    await this.newTransactionButton.click();
    return new NewTransactionPage(this.page);
  }

  async goToNotifications() {
    if (isMobile(this.page)) {
      await this.toggleSideNav();
    }
    await this.sideNavNotifications.click();
    return new NotificationsPage(this.page);
  }
}
