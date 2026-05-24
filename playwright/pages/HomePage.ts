import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";
import { TransactionDateRangeFilter } from "../components/TransactionDateRangeFilter";
import { isMobile } from "../helpers/is-mobile";
import { TransactionDetailPage } from "./TransactionDetailPage";

export type OnboardingBankDetails = {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
};

export type TransactionTabs = "everyone" | "friends" | "mine";

export class HomePage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly dateRangeFilter: TransactionDateRangeFilter;
  readonly clearDateRangeButton: Locator;
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
  readonly mineTab: Locator;
  readonly everyoneTab: Locator;
  readonly friendsTab: Locator;
  readonly transactionAcceptButton: Locator;
  readonly transactionRejectButton: Locator;
  readonly transactionTabs: Locator;
  readonly scrollableGrid: Locator;
  readonly emptyListHeader: Locator;
  readonly emptyListCreateButton: Locator;
  readonly amountFilterButton: Locator;
  readonly amountRangeText: Locator;
  readonly amountSlider: Locator;
  readonly amountFilterClearButton: Locator;
  readonly amountRangeDrawer: Locator;
  readonly amountRangeDrawerClose: Locator;
  readonly amountRangePopover: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.dateRangeFilter = new TransactionDateRangeFilter(page);
    this.clearDateRangeButton = this.page.getByTestId("transaction-list-filter-date-clear-button");
    this.userOnboardingDialog = this.page.getByTestId("user-onboarding-dialog");
    this.listSkeleton = this.page.getByTestId("list-skeleton");
    this.userOnboardingNext = this.page.getByTestId("user-onboarding-next");
    this.userOnboardingDialogTitle = this.page.getByTestId("user-onboarding-dialog-title");
    this.userOnboardingDialogContent = this.page.getByTestId("user-onboarding-dialog-content");
    this.bankNameInput = this.page.getByTestId("bankaccount-bankName-input").locator("input");
    this.routingNumberInput = this.page.locator("#bankaccount-routingNumber-input"); // getByTestId is failing on this for some reason
    this.accountNumberInput = this.page
      .getByTestId("bankaccount-accountNumber-input")
      .locator("input");
    this.bankAccountSubmitButton = this.page.getByTestId("bankaccount-submit");
    this.transactionList = this.page.getByTestId("transaction-list");
    this.transactions = this.transactionList.getByTestId(/transaction-item/);
    this.transactionTabs = this.page.getByTestId("nav-transaction-tabs");
    this.mineTab = this.page.getByTestId("nav-personal-tab");
    this.everyoneTab = this.page.getByTestId("nav-public-tab");
    this.friendsTab = this.page.getByTestId("nav-contacts-tab");
    this.transactionAcceptButton = this.page.getByTestId(/transaction-accept-request/);
    this.transactionRejectButton = this.page.getByTestId(/transaction-reject-request/);
    this.scrollableGrid = this.page.getByRole("grid");
    this.emptyListHeader = this.page.getByTestId("empty-list-header");
    this.emptyListCreateButton = this.page.getByTestId("transaction-list-empty-create-transaction-button");
    this.amountFilterButton = this.page.getByTestId("transaction-list-filter-amount-range-button");
    this.amountRangeText = this.page.getByTestId("transaction-list-filter-amount-range-text");
    this.amountSlider = this.page.getByTestId("transaction-list-filter-amount-range-slider");
    this.amountFilterClearButton = this.page.getByTestId("transaction-list-filter-amount-clear-button");
    this.amountRangeDrawer = this.page.getByTestId("amount-range-filter-drawer");
    this.amountRangeDrawerClose = this.page.getByTestId("amount-range-filter-drawer-close");
    this.amountRangePopover = this.page.getByTestId("transaction-list-filter-amount-range");
    this.mainContent = this.page.getByTestId("main");
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async setAmountRange(minDollars: number, maxDollars: number) {
    await this.amountFilterButton.scrollIntoViewIfNeeded();
    await this.amountFilterButton.click();
    await this.amountSlider.locator('input[data-index="0"]').fill(String(minDollars / 10));
    await this.amountSlider.locator('input[data-index="1"]').fill(String(maxDollars / 10));
  }

  async resetAmountRangeFilter() {
    await this.amountFilterClearButton.click();

    if (isMobile(this.page)) {
      await this.amountRangeDrawerClose.click();
    } else {
      await this.amountFilterClearButton.click();
      await this.mainContent.evaluate((el) => {
        el.scrollTop = 0;
      });
      await this.dateRangeFilter.openButton.click({ force: true });
    }
  }

  async goNextOnboardingScreen() {
    await this.userOnboardingNext.click();
  }

  async clearDateRange() {
    await this.clearDateRangeButton.click();
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

  async goToTab(tab: TransactionTabs) {
    switch (tab) {
      case "everyone":
        await this.goToEveryoneTab();
        break;
      case "friends":
        await this.goToFriendsTab();
        break;
      case "mine":
        await this.goToMineTab();
        break;
      default:
        throw new Error(`invalid tab: ${tab}`);
    }
  }

  async getTab(tab: TransactionTabs) {
    return this.transactionTabs.getByRole("tab", { name: tab.charAt(0).toUpperCase() + tab.slice(1) });
  }

  async goToMineTab() {
    await this.mineTab.click();
  }

  async goToEveryoneTab() {
    await this.everyoneTab.click();
  }

  async goToFriendsTab() {
    await this.friendsTab.click();
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
