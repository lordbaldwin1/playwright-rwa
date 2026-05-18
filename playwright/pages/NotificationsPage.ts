import { APIRequestContext, expect, Locator, Page } from "@playwright/test";
import { config } from "../config";


export class NotificationsPage {
  private readonly page: Page;
  readonly header: Locator;
  readonly notificationsList: Locator;
  readonly notifications: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = this.page.getByRole("heading", { level: 2, name: "Notifications", exact: true });
    this.notificationsList = this.page.getByTestId("notifications-list");
    this.notifications = this.page.getByTestId(/notification-list-item/);
  }

  async goto() {
    await this.page.goto("/notifications");
  }

  getNotification(text: string) {
    return this.notifications.filter({ hasText: text });
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

  async getNotificationCount(request: APIRequestContext, username: string, password: string) {
    const loginRes = await request.post(`${config.BACKEND_URL}/login`, {
      headers: { "Content-Type": "application/json" },
      data: { username, password },
    });
    expect(loginRes.ok()).toBeTruthy();

    const res = await request.get(`${config.BACKEND_URL}/notifications`);
    expect(res.ok()).toBeTruthy();

    const { results } = await res.json();
    return results.length;
  }
}