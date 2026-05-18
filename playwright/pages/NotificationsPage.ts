import { Locator, Page } from "@playwright/test";


export class NotificationsPage {
  private readonly page: Page;
  readonly header: Locator;
  readonly notificationsList: Locator;
  readonly notifications: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByRole("heading", { level: 2, name: "Notifications" });
    this.notificationsList = this.page.getByTestId("notifications-list");
    this.notifications = this.page.getByTestId(/notification-list-item/);
  }

  async goto() {
    await this.page.goto("/notifications");
  }

  async findNotification(text: string) {
    return this.notifications.filter({ hasText: text });
  }
}