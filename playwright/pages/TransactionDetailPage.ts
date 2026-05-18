import { Locator, Page } from "@playwright/test";


export class TransactionDetailPage {
  private readonly page: Page;
  readonly header: Locator;
  readonly commentInput: Locator;
  readonly likeButton: Locator;
  readonly likeCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByTestId("transaction-detail-header");
    this.commentInput = this.page.getByTestId(/transaction-comment-input/);
    this.likeButton = this.page.getByTestId(/transaction-like-button/);
    this.likeCount = this.page.getByTestId(/transaction-like-count/);
  }

  async addComment(text: string) {
    await this.commentInput.fill(text);
    await this.page.keyboard.press("Enter");
  }

  async likeTransaction() {
    await this.likeButton.click();
  }

  async gotoTransaction(id: string) {
    await this.page.goto(`/transaction/${id}`)
  }
}