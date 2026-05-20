import { expect, Locator, Page } from "@playwright/test";
import { Navigation } from "../components/Navigation";

export class NotificationsPage {
  private readonly page: Page;
  readonly nav: Navigation;
  readonly header: Locator;
  readonly notificationsList: Locator;
  readonly notifications: Locator;
  readonly emptyListHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = new Navigation(page);
    this.header = this.page.getByRole("heading", { level: 2, name: "Notifications", exact: true });
    this.notificationsList = this.page.getByTestId("notifications-list");
    this.notifications = this.page.getByTestId(/notification-list-item/);
    this.emptyListHeader = this.page.getByTestId("empty-list-header");
  }

  async goto(path = "/notifications") {
    await this.page.goto(path);
    await expect(this.header).toBeVisible();
  }

  getNotification(text: string) {
    return this.notifications.filter({ hasText: text });
  }

  async dismissFirstNotification() {
    const dismiss = this.notifications.first().getByTestId(/notification-mark-read/);
    await expect(dismiss).toBeEnabled();
    await dismiss.click();
  }

  async dismissAllNotifications() {
    let count = await this.notifications.count();
    while (count > 0) {
      const dismiss = this.notifications.last().getByRole("button", { name: "Dismiss" });
      await expect(dismiss).toBeEnabled();
      await dismiss.click();
      count--;
    }
  }
}