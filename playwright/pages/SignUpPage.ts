import { expect, Locator, Page } from "@playwright/test";
import { SignInPage } from "./SignInPage";

export type SignUpFormData = {
  firstName?: string;
  lastName?: string;
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
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly usernameError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByTestId("signup-title");
    this.firstNameInput = this.page.getByLabel("First Name");
    this.lastNameInput = this.page.getByLabel("Last Name");
    this.usernameInput = this.page.getByLabel("Username");
    this.passwordInput = this.page.getByRole("textbox", { name: "Password", exact: true });
    this.confirmPasswordInput = this.page.getByLabel("Confirm Password");
    this.submitButton = this.page.getByTestId("signup-submit");
    this.firstNameError = this.page.locator("#firstName-helper-text");
    this.lastNameError = this.page.locator("#lastName-helper-text");
    this.usernameError = this.page.locator("#username-helper-text");
    this.passwordError = this.page.locator("#password-helper-text");
    this.confirmPasswordError = this.page.locator("#confirmPassword-helper-text");
  }

  async goto(path = "/signup") {
    await this.page.goto(path);
    await expect(this.header).toBeVisible();
  }

  async fillForm(formData: SignUpFormData) {
    await this.firstNameInput.fill(formData.firstName ?? "");
    await this.lastNameInput.fill(formData.lastName ?? "");
    await this.usernameInput.fill(formData.username ?? "");
    await this.passwordInput.fill(formData.password ?? "");
    await this.confirmPasswordInput.fill(formData.confirmPassword ?? "");
  }

  async submitForm() {
    await this.submitButton.click();
    await expect(this.page).toHaveURL("/signin");
    return new SignInPage(this.page);
  }
}
