import { Locator, Page } from "@playwright/test";
import { SignUpPage } from "./SignUpPage";
import { HomePage } from "./HomePage";

export class SignInPage {
  private readonly page: Page;
  readonly header: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeBox: Locator;
  readonly signUpLink: Locator;
  readonly usernameError: Locator;
  readonly passwordError: Locator;


  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByRole("heading", { name: "Sign in" });
    this.usernameInput = this.page.getByLabel("Username");
    this.passwordInput = this.page.getByLabel("Password");
    this.signInButton = this.page.getByTestId("signin-submit");
    this.rememberMeBox = this.page.getByRole("checkbox", { name: "remember" });
    this.signUpLink = this.page.getByTestId("signup");
    this.usernameError = this.page.locator("#username-helper-text");
    this.passwordError = this.page.locator("#password-helper-text");
  }

  async goto() {
    await this.page.goto("/signin");
  }

  async fillForm(username?: string, password?: string) {
    await this.usernameInput.fill(username ?? "");
    await this.passwordInput.fill(password ?? "");
  }

  async checkRememberMe() {
    await this.rememberMeBox.click();
  }

  async submitForm() {
    await this.signInButton.click();
    return new HomePage(this.page);
  }

  async goToSignUp() {
    await this.signUpLink.click();
    await this.signUpLink.click();
    await this.page.waitForURL("/signup");
    return new SignUpPage(this.page);
  }
}
