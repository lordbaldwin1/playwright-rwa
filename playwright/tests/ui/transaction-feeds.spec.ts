import { expect, test } from "../../fixtures";


test.describe("transaction feed e2e tests", () => {
  test("toggles the navigation drawer", async ({
    loggedInTestUser: _user,
    homePage,
  }) => {
    if (homePage.nav.isMobile()) {
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
      await homePage.nav.toggleSideNav();
      await expect(homePage.nav.sideNavHome).toBeVisible();
      await homePage.nav.mobileCloseSideNav();
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
    } else {
      await expect(homePage.nav.sideNavHome).toBeVisible();
      await homePage.nav.toggleSideNav();
      await expect(homePage.nav.sideNavHome).not.toBeVisible();
    }
  });
});