import { describe, expect, it } from "vitest";
import { changeModule, readModules, initialModules } from "./modules";

describe("module activation policy", () => {
  it("requires finance and CRM before billing", () => {
    expect(() => changeModule(["organization", "crm"], "billing")).toThrow(
      "Accounting",
    );
    expect(
      changeModule(["organization", "crm", "accounting"], "billing"),
    ).toContain("billing");
  });
  it("prevents disabling dependencies of active workflows", () => {
    expect(() =>
      changeModule(
        ["organization", "crm", "accounting", "billing"],
        "accounting",
      ),
    ).toThrow("Billing & payments");
    expect(() => changeModule(["organization"], "organization")).toThrow(
      "required",
    );
  });
  it("allows disabling a leaf without changing other modules", () => {
    expect(changeModule(["organization", "crm"], "crm")).toEqual([
      "organization",
    ]);
  });
  it("recovers from corrupt, obsolete or inconsistent persisted state", () => {
    for (const value of [
      "{",
      "{}",
      '["unknown"]',
      '["organization","payroll"]',
      "[]",
    ]) {
      expect(readModules(value)).toEqual(initialModules);
    }
    expect(readModules('["organization","accounting","accounting"]')).toEqual([
      "organization",
      "accounting",
    ]);
  });
});
