import { Locator, Page } from "@playwright/test";
import { isMobile as isMobileViewport } from "../helpers/is-mobile";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { HomePage } from "../pages/HomePage";
import { NewTransactionPage } from "../pages/NewTransactionPage";
import { SignInPage } from "../pages/SignInPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { UserSettingsPage } from "../pages/UserSettingsPage";

export class Navigation {
  private readonly page: Page;
  readonly notificationsCount: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;
  readonly sideNavBankAccounts: Locator;
  readonly sideNavHome: Locator;
  readonly sideNavNotifications: Locator;
  readonly sideNavUserSettings: Locator;
  readonly sideNavUserFullName: Locator;
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
    this.sideNavUserSettings = this.page.getByTestId("sidenav-user-settings");
    this.sideNavUserFullName = this.page.getByTestId("sidenav-user-full-name");
  }

  async toggleSideNav() {
    await this.sideNavToggle.click();
  }

  isMobile() {
    return isMobileViewport(this.page);
  }

  async mobileCloseSideNav() {
    await this.page.locator(".MuiBackdrop-root").click();
  }

  async withSideNav<T>(action: () => Promise<T>): Promise<T> {
    const mobile = this.isMobile();
    if (mobile) {
      await this.toggleSideNav();
    }
    try {
      return await action();
    } finally {
      if (mobile) {
        await this.mobileCloseSideNav();
      }
    }
  }

  async getUserBalance() {
    return this.withSideNav(() => this.userBalance.innerText());
  }

  async signOut() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.sideNavSignOut.click();
    return new SignInPage(this.page);
  }

  async goToBankAccounts() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.sideNavBankAccounts.click();
    return new BankAccountsPage(this.page);
  }

  async goToHome() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.sideNavHome.click();
    return new HomePage(this.page);
  }

  async goToNewTransaction() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.newTransactionButton.click();
    return new NewTransactionPage(this.page);
  }

  async goToNotifications() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.sideNavNotifications.click();
    return new NotificationsPage(this.page);
  }

  async goToUserSettings() {
    if (this.isMobile()) {
      await this.toggleSideNav();
    }
    await this.sideNavUserSettings.click();
    return new UserSettingsPage(this.page);
  }
}
