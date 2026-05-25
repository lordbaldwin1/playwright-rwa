import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";

export class TransactionDetailPage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly header: Locator;
  readonly commentInput: Locator;
  readonly likeButton: Locator;
  readonly likeCount: Locator;
  readonly comments: Locator;
  readonly acceptButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.header = this.page.getByTestId("transaction-detail-header");
    this.commentInput = this.page.getByTestId(/transaction-comment-input/);
    this.likeButton = this.page.getByTestId(/transaction-like-button/);
    this.likeCount = this.page.getByTestId(/transaction-like-count/);
    this.comments = this.page.getByTestId(/comment-list-item/);
    this.acceptButton = this.page.getByTestId(/transaction-accept-request/);
    this.rejectButton = this.page.getByTestId(/transaction-reject-request/);
  }

  async goto(transactionId: string) {
    await this.page.goto(`/transaction/${transactionId}`);
    await expect(this.header).toBeVisible();
  }

  async addComment(text: string) {
    await this.commentInput.fill(text);
    await this.page.keyboard.press("Enter");
  }

  async likeTransaction() {
    await this.likeButton.click();
  }

  async acceptTransaction() {
    await this.acceptButton.click();
  }

  async rejectTransaction() {
    await this.rejectButton.click();
  }
}