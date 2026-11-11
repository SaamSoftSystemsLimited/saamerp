export const catalog = [
  {
    id: "organization",
    title: "Organization",
    category: "Foundation",
    description: "Your business, branches and operating structure.",
    dependencies: [],
    required: true,
  },
  {
    id: "crm",
    title: "CRM & sales",
    category: "Customer operations",
    description:
      "Build relationships, manage opportunities and prepare quotations.",
    dependencies: ["organization"],
  },
  {
    id: "accounting",
    title: "Accounting",
    category: "Finance",
    description: "A controlled ledger, financial periods and reporting.",
    dependencies: ["organization"],
  },
  {
    id: "billing",
    title: "Billing & payments",
    category: "Finance",
    description: "Issue invoices and track customer payment allocations.",
    dependencies: ["crm", "accounting"],
  },
  {
    id: "inventory",
    title: "Inventory",
    category: "Operations",
    description: "Products, warehouses, stock movements and counts.",
    dependencies: ["organization"],
  },
  {
    id: "procurement",
    title: "Procurement",
    category: "Operations",
    description: "Manage suppliers, purchase orders and supplier bills.",
    dependencies: ["inventory", "accounting"],
  },
  {
    id: "hr",
    title: "People",
    category: "People",
    description: "Employee records, teams and employee self-service.",
    dependencies: ["organization"],
  },
  {
    id: "payroll",
    title: "Payroll",
    category: "People",
    description:
      "Prepare controlled payroll runs with approved calculation rules.",
    dependencies: ["hr", "accounting"],
  },
] as const;
export type ModuleId = (typeof catalog)[number]["id"];
export const initialModules: ModuleId[] = ["organization", "crm"];
export const storageKey = "saamerp.demo.modules.v1";
const known = new Set<string>(catalog.map((m) => m.id));
export function title(id: string): string {
  return catalog.find((m) => m.id === id)?.title ?? id;
}
export function changeModule(enabled: ModuleId[], id: ModuleId): ModuleId[] {
  const module = catalog.find((m) => m.id === id)!;
  if (enabled.includes(id)) {
    if ("required" in module && module.required)
      throw new Error("Organization is required for this workspace.");
    const dependents = catalog.filter(
      (m) =>
        enabled.includes(m.id) &&
        (m.dependencies as readonly string[]).includes(id),
    );
    if (dependents.length)
      throw new Error(
        `Disable ${dependents.map((m) => m.title).join(", ")} first. Existing history will be retained.`,
      );
    return enabled.filter((value) => value !== id);
  }
  const missing = module.dependencies.filter(
    (dependency) => !enabled.includes(dependency),
  );
  if (missing.length)
    throw new Error(`Enable ${missing.map(title).join(" and ")} first.`);
  return [...enabled, id];
}
export function readModules(raw: string | null): ModuleId[] {
  if (!raw) return [...initialModules];
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      !value.every((id) => typeof id === "string" && known.has(id))
    )
      return [...initialModules];
    const enabled = [...new Set(value)] as ModuleId[];
    if (!enabled.includes("organization")) return [...initialModules];
    if (
      catalog.some(
        (m) =>
          enabled.includes(m.id) &&
          m.dependencies.some((d) => !enabled.includes(d)),
      )
    )
      return [...initialModules];
    return enabled;
  } catch {
    return [...initialModules];
  }
}
