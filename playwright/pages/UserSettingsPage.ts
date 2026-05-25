import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";

export type UserSettingsFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export class UserSettingsPage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly header: Locator;
  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly submitButton: Locator;
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly phoneNumberError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.header = this.page.getByRole("heading", { level: 2, name: "User Settings", exact: true });
    this.form = this.page.getByTestId("user-settings-form");
    this.firstNameInput = this.page.getByTestId("user-settings-firstName-input");
    this.lastNameInput = this.page.getByTestId("user-settings-lastName-input");
    this.emailInput = this.page.getByTestId("user-settings-email-input");
    this.phoneNumberInput = this.page.getByTestId("user-settings-phoneNumber-input");
    this.submitButton = this.page.getByTestId("user-settings-submit");
    this.firstNameError = this.page.locator("#user-settings-firstName-input-helper-text");
    this.lastNameError = this.page.locator("#user-settings-lastName-input-helper-text");
    this.emailError = this.page.locator("#user-settings-email-input-helper-text");
    this.phoneNumberError = this.page.locator("#user-settings-phoneNumber-input-helper-text");
  }

  async goto(path = "/user/settings") {
    await this.page.goto(path);
    await expect(this.header).toBeVisible();
  }

  async fillForm(data: UserSettingsFormData) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.phoneNumberInput.fill(data.phoneNumber);
  }

  async submit() {
    await this.submitButton.click();
  }
}
