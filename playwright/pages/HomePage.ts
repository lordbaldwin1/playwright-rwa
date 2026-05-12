import { Locator, Page } from "@playwright/test";
import { isMobile } from "../helpers/is-mobile";

export type OnboardingBankDetails = {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
}
export class HomePage {
  private readonly page: Page;
  readonly userOnboardingDialog: Locator;
  readonly listSkeleton: Locator;
  readonly navTopNotificationsCounnt: Locator;
  readonly userOnboardingNext: Locator;
  readonly userOnboardingDialogTitle: Locator;
  readonly userOnboardingDialogContent: Locator;
  readonly bankNameInput: Locator;
  readonly accountNumberInput: Locator;
  readonly routingNumberInput: Locator;
  readonly bankAccountSubmitButton: Locator;
  readonly transactionList: Locator;
  readonly sideNavToggle: Locator;
  readonly sideNavSignOut: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userOnboardingDialog = this.page.getByTestId("user-onboarding-dialog");
    this.listSkeleton = this.page.getByTestId("list-skeleton");
    this.navTopNotificationsCounnt = this.page.getByTestId("nav-top-notifications-count");
    this.userOnboardingNext = this.page.getByTestId("user-onboarding-next");
    this.userOnboardingDialogTitle = this.page.getByTestId("user-onboarding-dialog-title");
    this.userOnboardingDialogContent = this.page.getByTestId("user-onboarding-dialog-content");
    this.bankNameInput = this.page.getByTestId("bankaccount-bankName-input").locator("input");
    this.routingNumberInput = this.page.locator("#bankaccount-routingNumber-input"); // getByTestId is failing on this for some reason
    this.accountNumberInput = this.page.getByTestId("bankaccount-accountNumber-input").locator("input");
    this.bankAccountSubmitButton = this.page.getByTestId("bankaccount-submit");
    this.transactionList = this.page.getByTestId("transaction-list");
    this.sideNavToggle = this.page.getByTestId("sidenav-toggle");
    this.sideNavSignOut = this.page.getByTestId("sidenav-signout");
  }

  async goNextOnboardingScreen() {
    await this.userOnboardingNext.click();
  }

  async fillBankDetails(formData: OnboardingBankDetails) {
    await this.bankNameInput.fill(formData.bankName ?? "");
    await this.routingNumberInput.fill(formData.routingNumber ?? "");
    await this.accountNumberInput.fill(formData.accountNumber ?? "");
  }

  async submitBankDetails() {
    await this.bankAccountSubmitButton.click();
  }

  async openSideNav() {
    await this.sideNavToggle.click();
  }

  async signOut() {
    await this.sideNavSignOut.click();
  }

  isMobile() {
    return isMobile(this.page);
  }
}
