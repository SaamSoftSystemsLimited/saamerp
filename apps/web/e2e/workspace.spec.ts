import { test, expect } from "@playwright/test";

test("module dependencies and preferences survive reload", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enable Billing & payments", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Enable Accounting first",
  );
  await page
    .getByRole("button", { name: "Enable Accounting", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enable Billing & payments", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Disable Accounting", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Disable Billing & payments first",
  );
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Disable Billing & payments",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Search modules").fill("Payroll");
  await expect(page.locator(".module-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Payroll", exact: true }),
  ).toBeVisible();
});

test("mobile navigation and branch scope work without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByLabel("Branch", { exact: true })
    .selectOption({ label: "Lagos · Head office" });
  await expect(page.locator(".stats")).toContainText("Lagos · Head office");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: /^Modules/ }).click();
  await expect(
    page.getByRole("heading", { name: "Make SaamERP your own." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
