import { describe, it, expect } from "vitest";
import {
  addCustomer,
  addContact,
  addQuote,
  transition,
  parseMoney,
  total,
  validateDataset,
  type Dataset,
} from "./crm";
const empty: Dataset = {
  version: 1,
  mode: "synthetic",
  customers: [],
  contacts: [],
  quotes: [],
};
function sample() {
  return addCustomer(empty, {
    branch: "Lagos · Head office",
    name: "Synthetic customer",
    email: "demo@example.test",
  });
}
describe("CRM demo workflow", () => {
  it("calculates kobo without floating point rounding and rejects invalid inputs", () => {
    expect(parseMoney("100.25")).toBe(10025);
    expect(
      total([{ description: "Support", quantity: 3, unitPriceMinor: 10025 }]),
    ).toBe(30075);
    for (const v of ["-1", "1.001", "NaN", "0", "1e3"])
      expect(() => parseMoney(v)).toThrow();
    expect(() =>
      total([{ description: "", quantity: 0, unitPriceMinor: 10 }]),
    ).toThrow();
  });
  it("rejects a contact belonging to a different customer", () => {
    let d = sample();
    const first = d.customers[0].id;
    d = addCustomer(d, {
      branch: "Lagos · Head office",
      name: "Other",
      email: "",
    });
    d = addContact(d, { customerId: first, name: "Contact", email: "" });
    expect(() =>
      addQuote(d, d.customers[1].id, d.contacts[0].id, "2099-12-31", [
        { description: "Service", quantity: 1, unitPriceMinor: 100 },
      ]),
    ).toThrow();
  });
  it("preserves snapshots and controls terminal transitions", () => {
    let d = sample();
    d = addQuote(d, d.customers[0].id, null, "2099-12-31", [
      { description: "Training", quantity: 2, unitPriceMinor: 15000 },
    ]);
    const id = d.quotes[0].id;
    expect(() => transition(d, id, "ACCEPTED")).toThrow();
    d = transition(d, id, "SENT");
    expect(transition(d, id, "SENT")).toBe(d);
    d = {
      ...d,
      customers: d.customers.map((c) => ({ ...c, name: "Changed" })),
    };
    d = transition(d, id, "ACCEPTED");
    expect(d.quotes[0].customerName).toBe("Synthetic customer");
    expect(() => transition(d, id, "REJECTED")).toThrow();
    expect(validateDataset(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it("rejects corrupted saved data and expired quotes", () => {
    expect(() => validateDataset({ version: 1 })).toThrow();
    let d = sample();
    expect(() =>
      addQuote(d, d.customers[0].id, null, "2000-01-01", [
        { description: "Service", quantity: 1, unitPriceMinor: 100 },
      ]),
    ).toThrow();
  });
});
