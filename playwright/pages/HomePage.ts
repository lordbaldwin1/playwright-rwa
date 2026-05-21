import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";
import { TransactionDetailPage } from "./TransactionDetailPage";

export type OnboardingBankDetails = {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
}
export class HomePage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly userOnboardingDialog: Locator;
  readonly listSkeleton: Locator;
  readonly userOnboardingNext: Locator;
  readonly userOnboardingDialogTitle: Locator;
  readonly userOnboardingDialogContent: Locator;
  readonly bankNameInput: Locator;
  readonly accountNumberInput: Locator;
  readonly routingNumberInput: Locator;
  readonly bankAccountSubmitButton: Locator;
  readonly transactionList: Locator;
  readonly transactions: Locator;
  readonly personalTab: Locator;
  readonly transactionAcceptButton: Locator;
  readonly transactionRejectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.userOnboardingDialog = this.page.getByTestId("user-onboarding-dialog");
    this.listSkeleton = this.page.getByTestId("list-skeleton");
    this.userOnboardingNext = this.page.getByTestId("user-onboarding-next");
    this.userOnboardingDialogTitle = this.page.getByTestId("user-onboarding-dialog-title");
    this.userOnboardingDialogContent = this.page.getByTestId("user-onboarding-dialog-content");
    this.bankNameInput = this.page.getByTestId("bankaccount-bankName-input").locator("input");
    this.routingNumberInput = this.page.locator("#bankaccount-routingNumber-input"); // getByTestId is failing on this for some reason
    this.accountNumberInput = this.page.getByTestId("bankaccount-accountNumber-input").locator("input");
    this.bankAccountSubmitButton = this.page.getByTestId("bankaccount-submit");
    this.transactionList = this.page.getByTestId("transaction-list");
    this.transactions = this.transactionList.getByTestId(/transaction-item/);
    this.personalTab = this.page.getByTestId("nav-personal-tab");
    this.transactionAcceptButton = this.page.getByTestId(/transaction-accept-request/);
    this.transactionRejectButton = this.page.getByTestId(/transaction-reject-request/);
  }

  async goto(path = "/") {
    await this.page.goto(path);
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

  async fastOnboardUser() {
    await this.goNextOnboardingScreen();
    await this.fillBankDetails({
      bankName: `bank${Date.now()}`,
      routingNumber: "123456789",
      accountNumber: "123456789",
    });
    await this.submitBankDetails();
    await this.goNextOnboardingScreen();
  }

  findTransactionByDescription(description: string) {
    return this.transactions.filter({ hasText: description });
  }

  async goToTransaction(description: string) {
    const trans = this.findTransactionByDescription(description);
    await trans.click();
  }

  async goToPersonalTab() {
    await this.personalTab.click();
  }

  async acceptTransaction() {
    await this.transactionAcceptButton.click();
  }

  async rejectTransaction() {
    await this.transactionRejectButton.click();
  }

  async goToTransactionById(transactionId: string) {
    const dataTest = `transaction-item-${transactionId}`;
    await expect(this.page.getByTestId(dataTest)).toBeVisible();
    await this.page.getByTestId(dataTest).click();
    return new TransactionDetailPage(this.page);
  }
}
