import { expect, Locator, Page } from "@playwright/test";

export type SignUpFormData = {
  firstName?: string;
  lastname?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
};
export class SignUpPage {
  private readonly page: Page;
  readonly header: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByTestId("signup-title");
    this.firstNameInput = this.page.getByLabel("First Name");
    this.lastNameInput = this.page.getByLabel("Last Name");
    this.usernameInput = this.page.getByLabel("Username");
    this.passwordInput = this.page.getByLabel("Password");
    this.confirmPasswordInput = this.page.getByLabel("Confirm Password", { exact: true });
    this.submitButton = this.page.getByTestId("signup-submit");
  }

  async fillForm(formData: SignUpFormData) {
    await this.firstNameInput.fill(formData.firstName ?? "");
    await this.lastNameInput.fill(formData.lastname ?? "");
    await this.usernameInput.fill(formData.username ?? "");
    await this.passwordInput.fill(formData.password ?? "");
    await this.confirmPasswordInput.fill(formData.confirmPassword ?? "");
  }

  async submitForm() {
    await this.submitButton.click();
    await expect(this.page).toHaveURL("/signin");
  }
}
