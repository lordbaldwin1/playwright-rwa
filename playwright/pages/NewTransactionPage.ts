import { expect, Locator, Page } from "@playwright/test";

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
  }

  async submitPayment() {
    await this.paymentButton.click();
  }
}
