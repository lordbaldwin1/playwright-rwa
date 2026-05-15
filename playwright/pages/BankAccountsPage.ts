import { Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";
import { OnboardingBankDetails } from "./HomePage";

export class BankAccountsPage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly createNewBankAccountButton: Locator;
  readonly bankNameInput: Locator;
  readonly bankNameError: Locator;
  readonly routingNumberInput: Locator;
  readonly routingNumberError: Locator;
  readonly accountNumberInput: Locator;
  readonly accountNumberError: Locator;
  readonly bankAccountSaveButton: Locator;
  readonly bankAccountListItems: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.header = this.page.getByRole("heading", { level: 2, name: "Bank Accounts" });
    this.createNewBankAccountButton = this.page.getByTestId("bankaccount-new");
    this.bankNameInput = this.page.locator("#bankaccount-bankName-input");
    this.bankNameError = this.page.locator("#bankaccount-bankName-input-helper-text");
    this.routingNumberInput = this.page.locator("#bankaccount-routingNumber-input");
    this.routingNumberError = this.page.locator("#bankaccount-routingNumber-input-helper-text");
    this.accountNumberInput = this.page.locator("#bankaccount-accountNumber-input");
    this.accountNumberError = this.page.locator("#bankaccount-accountNumber-input-helper-text");
    this.bankAccountSaveButton = this.page.getByTestId("bankaccount-submit");
    this.bankAccountListItems = this.page.getByTestId(/bankaccount-list-item/);
  }

  async goto() {
    await this.page.goto("/bankaccounts");
  }

  async createNewBankAccount() {
    await this.createNewBankAccountButton.click();
  }

  async fillBankAccountForm(formData: OnboardingBankDetails) {
    await this.bankNameInput.fill(formData.bankName ?? "");
    await this.routingNumberInput.fill(formData.routingNumber ?? "");
    await this.accountNumberInput.fill(formData.accountNumber ?? "");
  }

  async saveBankAccount() {
    await this.bankAccountSaveButton.click();
  }
}