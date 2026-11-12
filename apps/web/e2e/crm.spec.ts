import { test, expect } from "@playwright/test";

test("customer to contact to issued and accepted quotation persists in browser", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Customers & quotations", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Relationships that move business forward.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New customer", exact: true }).click();
  await page
    .getByLabel("Customer name", { exact: true })
    .fill("Demo · New Prospect");
  await page
    .getByLabel("Email (optional)", { exact: true })
    .fill("sales@example.test");
  await page
    .getByRole("button", { name: "Save customer", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Demo · New Prospect", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Contacts", exact: true }).click();
  await page.getByRole("button", { name: "New contact", exact: true }).click();
  await page
    .getByLabel("Customer", { exact: true })
    .selectOption({ label: "Demo · New Prospect" });
  await page
    .getByLabel("Contact name", { exact: true })
    .fill("Demo · New Contact");
  await page.getByRole("button", { name: "Save contact", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Demo · New Contact", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Quotations", exact: true }).click();
  await page
    .getByRole("button", { name: "New quotation", exact: true })
    .click();
  await page
    .getByLabel("Customer", { exact: true })
    .selectOption({ label: "Demo · New Prospect" });
  await page
    .getByLabel("Contact (optional)", { exact: true })
    .selectOption({ label: "Demo · New Contact" });
  await page
    .getByLabel("Description 1", { exact: true })
    .fill("Synthetic consulting");
  await page.getByLabel("Quantity 1", { exact: true }).fill("3");
  await page.getByLabel("Unit price 1 (NGN)", { exact: true }).fill("100.25");
  await page.getByRole("button", { name: "Add line", exact: true }).click();
  await page
    .getByLabel("Description 2", { exact: true })
    .fill("Synthetic support");
  await page.getByLabel("Unit price 2 (NGN)", { exact: true }).fill("1.99");
  await expect(page.locator(".crm-form .quote-total")).toContainText("302.74");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const row = page
    .getByRole("row")
    .filter({
      has: page.getByRole("cell", { name: "Demo · New Prospect", exact: true }),
    });
  await row.getByRole("button", { name: /Open quotation/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Demo · New Contact");
  await page
    .getByRole("button", { name: "Issue quotation", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".quote-status")).toHaveText(
    "Issued",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download quotation", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/^Q-.*\.html$/);
  await page
    .getByRole("button", { name: "Record acceptance", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".quote-status")).toHaveText(
    "Accepted",
  );
  await expect(
    page.getByRole("button", { name: "Record rejection", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Customers & quotations", exact: true })
    .click();
  await page.getByRole("tab", { name: "Quotations", exact: true }).click();
  await expect(
    page
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", {
          name: "Demo · New Prospect",
          exact: true,
        }),
      }),
  ).toContainText("Accepted");
});

test("branch scope and reset restore synthetic data on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("button", { name: "Customers & quotations", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Demo · Lagoon Learning Ltd", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Branch", { exact: true })
    .selectOption({ label: "Abuja · Demo branch" });
  await expect(
    page.getByRole("cell", { name: "Demo · Lagoon Learning Ltd", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("cell", {
      name: "Demo · Cedar Technology Ltd",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Synthetic demo restored",
  );
});
