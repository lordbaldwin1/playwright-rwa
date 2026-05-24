import { expect, Locator, Page } from "@playwright/test";
import { differenceInMonths, parse as parseDate } from "date-fns";

/**
 * Page object for the transaction list date-range filter (react-calendar).
 * Mirrors Cypress `pickDateRange` behavior without network waits — use those in tests.
 */
export class TransactionDateRangeFilter {
  readonly openButton: Locator;
  readonly clearButton: Locator;
  readonly calendar: Locator;
  readonly monthLabel: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly mobileDrawerClose: Locator;

  constructor(page: Page) {
    this.openButton = page.getByTestId("transaction-list-filter-date-range-button");
    this.clearButton = page.getByTestId("transaction-list-filter-date-clear-button");
    this.calendar = page.locator(".react-calendar");
    this.monthLabel = this.calendar.locator(".react-calendar__navigation__label");
    this.prevMonthButton = this.calendar.locator(".react-calendar__navigation__prev-button");
    this.nextMonthButton = this.calendar.locator(".react-calendar__navigation__next-button");
    this.mobileDrawerClose = page.getByTestId("date-range-filter-drawer-close");
  }

  async open() {
    await this.openButton.click();
    await expect(this.calendar).toBeVisible();
  }

  /** Clears an active date filter via the chip delete icon. */
  async clear() {
    await this.clearButton.click();
  }

  /**
   * Opens the picker, selects [startDate, endDate] (inclusive range UI), and waits for the calendar to close.
   */
  async pickDateRange(startDate: Date, endDate: Date) {
    await this.open();
    await this.selectDate(startDate);
    await this.selectDate(endDate);
    await expect(this.calendar).toBeHidden();
  }

  private async selectDate(date: Date) {
    await this.navigateToMonth(date);
    await this.clickDay(date.getDate());
  }

  private async navigateToMonth(targetDate: Date) {
    const labelText = await this.monthLabel.textContent();
    if (!labelText?.trim()) {
      throw new Error("Could not read react-calendar month label");
    }

    const visibleMonth = parseDate(labelText.trim(), "MMMM yyyy", new Date());
    const monthsDiff = differenceInMonths(targetDate, visibleMonth);

    if (monthsDiff < 0) {
      for (let i = 0; i < Math.abs(monthsDiff); i++) {
        await this.prevMonthButton.click();
      }
    } else if (monthsDiff > 0) {
      for (let i = 0; i < monthsDiff; i++) {
        await this.nextMonthButton.click();
      }
    }
  }

  private async clickDay(dayOfMonth: number) {
    const day = this.calendar
      .locator(
        ".react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth)"
      )
      .filter({ hasText: new RegExp(`^${dayOfMonth}$`) });

    await day.click();
  }
}
