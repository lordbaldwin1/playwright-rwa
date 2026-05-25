import { expect, test } from "../../fixtures/ui";

test.describe("user settings e2e tests", () => {
  test.beforeEach(async ({ loggedInTestUser: _user, homePage }) => {
    await homePage.nav.goToUserSettings();
  });

  test("renders the user settings form", async ({ userSettingsPage, page }) => {
    await expect(userSettingsPage.form).toBeVisible();
    await expect(page).toHaveURL(/\/user\/settings/);
  });

  test("should display user setting form errors", async ({ userSettingsPage }) => {
    await userSettingsPage.firstNameInput.fill("Abc");
    await userSettingsPage.firstNameInput.clear();
    await userSettingsPage.firstNameInput.blur();
    await expect(userSettingsPage.firstNameError).toBeVisible();
    await expect(userSettingsPage.firstNameError).toContainText("Enter a first name");

    await userSettingsPage.lastNameInput.fill("Abc");
    await userSettingsPage.lastNameInput.clear();
    await userSettingsPage.lastNameInput.blur();
    await expect(userSettingsPage.lastNameError).toBeVisible();
    await expect(userSettingsPage.lastNameError).toContainText("Enter a last name");

    await userSettingsPage.emailInput.fill("abc");
    await userSettingsPage.emailInput.clear();
    await userSettingsPage.emailInput.blur();
    await expect(userSettingsPage.emailError).toBeVisible();
    await expect(userSettingsPage.emailError).toContainText("Enter an email address");

    await userSettingsPage.emailInput.fill("abc@bob.");
    await userSettingsPage.emailInput.blur();
    await expect(userSettingsPage.emailError).toBeVisible();
    await expect(userSettingsPage.emailError).toContainText("Must contain a valid email address");

    await userSettingsPage.phoneNumberInput.fill("abc");
    await userSettingsPage.phoneNumberInput.clear();
    await userSettingsPage.phoneNumberInput.blur();
    await expect(userSettingsPage.phoneNumberError).toBeVisible();
    await expect(userSettingsPage.phoneNumberError).toContainText("Enter a phone number");

    await userSettingsPage.phoneNumberInput.fill("615-555-");
    await userSettingsPage.phoneNumberInput.blur();
    await expect(userSettingsPage.phoneNumberError).toBeVisible();
    await expect(userSettingsPage.phoneNumberError).toContainText("Phone number is not valid");

    await expect(userSettingsPage.submitButton).toBeDisabled();
  });

  test("updates first name, last name, email and phone number", async ({
    userSettingsPage,
    page,
  }) => {
    await userSettingsPage.firstNameInput.clear();
    await userSettingsPage.firstNameInput.fill("New First Name");
    await userSettingsPage.lastNameInput.clear();
    await userSettingsPage.lastNameInput.fill("New Last Name");
    await userSettingsPage.emailInput.clear();
    await userSettingsPage.emailInput.fill("email@email.com");
    await userSettingsPage.phoneNumberInput.clear();
    await userSettingsPage.phoneNumberInput.fill("6155551212");
    await userSettingsPage.phoneNumberInput.blur();

    await expect(userSettingsPage.submitButton).toBeEnabled();

    const updateUser = page.waitForResponse(
      (res) => res.url().includes("/users/") && res.request().method() === "PATCH"
    );
    await userSettingsPage.submit();
    const response = await updateUser;
    expect(response.status()).toBe(204);

    if (userSettingsPage.nav.isMobile()) {
      await userSettingsPage.nav.toggleSideNav();
    }

    await expect(userSettingsPage.nav.sideNavUserFullName).toContainText("New First Name");
  });
});
