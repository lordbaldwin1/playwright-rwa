import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";

export class NewTransactionPage {
  private readonly page: Page;
  readonly searchInput: Locator;
  readonly usersList: Locator;
  readonly userListItems: Locator;
  readonly amountInput: Locator;
  readonly descriptionInput: Locator;
  readonly requestButton: Locator;
  readonly paymentButton: Locator;
  readonly successToast: Locator;
  readonly returnToTransactionButton: Locator;
  readonly amountError: Locator;
  readonly descriptionError: Locator;
  readonly nav: Navigation;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = this.page.getByTestId("user-list-search-input");
    this.usersList = this.page.getByTestId("users-list");
    this.userListItems = this.usersList.getByTestId(/user-list-item/);
    this.amountInput = this.page.getByRole("textbox", { name: "amount" });
    this.descriptionInput = this.page.getByRole("textbox", { name: "Add a note" });
    this.requestButton = this.page.getByTestId("transaction-create-submit-request");
    this.paymentButton = this.page.getByTestId("transaction-create-submit-payment");
    this.successToast = this.page.getByTestId("alert-bar-success");
    this.returnToTransactionButton = this.page.getByTestId("new-transaction-return-to-transactions");
    this.amountError = this.page.locator("#transaction-create-amount-input-helper-text");
    this.descriptionError = this.page.locator("#transaction-create-description-input-helper-text");
    this.nav = new Navigation(this.page);
  }

  async goto() {
    await this.page.goto("/transaction/new");
  }

  async searchUser(username: string) {
    await this.searchInput.fill(username);
  }

  async selectUserFromList(username: string) {
    const userRow = this.userListItems.filter({ hasText: username });
    await expect(userRow).toBeVisible();
    await userRow.click();
  }

  async fillForm(payment: { amount: string; description: string }) {
    await this.amountInput.fill(payment.amount);
    await this.descriptionInput.fill(payment.description);
    await this.descriptionInput.blur();
  }

  async submitPayment() {
    await this.paymentButton.click();
  }

  async submitRequest() {
    await this.requestButton.click();
  }

  async returnToTransaction() {
    await this.returnToTransactionButton.click();
  }
}
