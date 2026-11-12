export type Customer = {
  id: string;
  branch: string;
  name: string;
  email: string;
};
export type Contact = {
  id: string;
  customerId: string;
  name: string;
  email: string;
};
export type Line = {
  description: string;
  quantity: number;
  unitPriceMinor: number;
};
export type Quote = {
  id: string;
  number: string;
  customerId: string;
  contactId: string | null;
  branch: string;
  customerName: string;
  contactName: string;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  currency: "NGN";
  lines: Line[];
  totalMinor: number;
};
export type Dataset = {
  version: 1;
  mode: "synthetic";
  customers: Customer[];
  contacts: Contact[];
  quotes: Quote[];
};
export const branches = ["Lagos · Head office", "Abuja · Demo branch"];
export const crmStorageKey = "saamerp.demo.crm.v1";
export const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    minor / 100,
  );
function required(value: string, max: number) {
  if (!value.trim() || value.trim().length > max)
    throw new Error(`Enter a value of 1–${max} characters.`);
  return value.trim();
}
function email(value: string) {
  if (
    value &&
    (value.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
  )
    throw new Error("Enter a valid email address.");
  return value.trim();
}
export function parseMoney(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Use a positive price with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < 1 || minor > 100000000000)
    throw new Error("Price is outside the permitted range.");
  return minor;
}
export function total(lines: Line[]): number {
  if (lines.length < 1 || lines.length > 100)
    throw new Error("Add 1–100 quotation lines.");
  let result = 0;
  for (const l of lines) {
    required(l.description, 240);
    if (
      !Number.isSafeInteger(l.quantity) ||
      l.quantity < 1 ||
      l.quantity > 10000 ||
      !Number.isSafeInteger(l.unitPriceMinor) ||
      l.unitPriceMinor < 1 ||
      l.unitPriceMinor > 100000000000
    )
      throw new Error(
        "Enter a whole quantity of 1–10,000 and a positive price.",
      );
    result += l.quantity * l.unitPriceMinor;
  }
  if (!Number.isSafeInteger(result) || result > 900000000000000)
    throw new Error("Quotation total is too large.");
  return result;
}
function date(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < new Date().toISOString().slice(0, 10)
  )
    throw new Error("Choose a valid date today or later.");
}
export function addCustomer(
  data: Dataset,
  input: Omit<Customer, "id">,
): Dataset {
  if (!branches.includes(input.branch)) throw new Error("Select a branch.");
  const customer = {
    ...input,
    id: crypto.randomUUID(),
    name: required(input.name, 160),
    email: email(input.email),
  };
  return { ...data, customers: [...data.customers, customer] };
}
export function addContact(data: Dataset, input: Omit<Contact, "id">): Dataset {
  if (!data.customers.some((c) => c.id === input.customerId))
    throw new Error("Select a customer.");
  const contact = {
    ...input,
    id: crypto.randomUUID(),
    name: required(input.name, 160),
    email: email(input.email),
  };
  return { ...data, contacts: [...data.contacts, contact] };
}
export function addQuote(
  data: Dataset,
  customerId: string,
  contactId: string | null,
  validUntil: string,
  lines: Line[],
): Dataset {
  const customer = data.customers.find((c) => c.id === customerId);
  const contact = contactId
    ? data.contacts.find(
        (c) => c.id === contactId && c.customerId === customerId,
      )
    : undefined;
  if (!customer || (contactId && !contact))
    throw new Error(
      "Choose a customer and a contact belonging to that customer.",
    );
  date(validUntil);
  const totalMinor = total(lines);
  const id = crypto.randomUUID();
  const quote: Quote = {
    id,
    number: `Q-${id.slice(0, 18).toUpperCase()}`,
    customerId,
    contactId,
    branch: customer.branch,
    customerName: customer.name,
    contactName: contact?.name ?? "",
    validUntil,
    status: "DRAFT",
    currency: "NGN",
    lines: lines.map((l) => ({ ...l, description: l.description.trim() })),
    totalMinor,
  };
  return { ...data, quotes: [...data.quotes, quote] };
}
export function transition(
  data: Dataset,
  id: string,
  status: Quote["status"],
): Dataset {
  const q = data.quotes.find((q) => q.id === id);
  if (!q) throw new Error("Quotation not found.");
  if (q.status === status) return data;
  if (
    !(
      (q.status === "DRAFT" && status === "SENT") ||
      (q.status === "SENT" && (status === "ACCEPTED" || status === "REJECTED"))
    )
  )
    throw new Error("Invalid quotation status transition.");
  if (status !== "REJECTED") date(q.validUntil);
  return {
    ...data,
    quotes: data.quotes.map((item) =>
      item.id === id ? { ...item, status } : item,
    ),
  };
}
export function validateDataset(value: unknown): Dataset {
  const d = value as Dataset;
  try {
    if (
      d.version !== 1 ||
      d.mode !== "synthetic" ||
      !Array.isArray(d.customers) ||
      !Array.isArray(d.contacts) ||
      !Array.isArray(d.quotes)
    )
      throw new Error();
    const ids = new Set<string>();
    for (const c of d.customers) {
      if (
        typeof c.id !== "string" ||
        !c.id ||
        ids.has(c.id) ||
        !branches.includes(c.branch)
      )
        throw new Error();
      ids.add(c.id);
      required(c.name, 160);
      email(c.email);
    }
    const contacts = new Set<string>();
    for (const c of d.contacts) {
      if (
        typeof c.id !== "string" ||
        !c.id ||
        contacts.has(c.id) ||
        !ids.has(c.customerId)
      )
        throw new Error();
      contacts.add(c.id);
      required(c.name, 160);
      email(c.email);
    }
    const quotes = new Set<string>();
    for (const q of d.quotes) {
      if (
        typeof q.id !== "string" ||
        !q.id ||
        quotes.has(q.id) ||
        !ids.has(q.customerId) ||
        !branches.includes(q.branch) ||
        !["DRAFT", "SENT", "ACCEPTED", "REJECTED"].includes(q.status) ||
        q.currency !== "NGN" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(q.validUntil) ||
        q.totalMinor !== total(q.lines) ||
        (q.contactId &&
          !d.contacts.some(
            (c) => c.id === q.contactId && c.customerId === q.customerId,
          ))
      )
        throw new Error();
      required(q.customerName, 160);
      required(q.number, 40);
      if (typeof q.contactName !== "string") throw new Error();
      quotes.add(q.id);
    }
    return d;
  } catch {
    throw new Error(
      "Demo data could not be validated. Reset the demo to restore the synthetic records.",
    );
  }
}
