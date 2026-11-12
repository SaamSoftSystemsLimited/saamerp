import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Plus,
  Search,
  X,
  Download,
  RotateCcw,
  Users,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import {
  addCustomer,
  addContact,
  addQuote,
  transition,
  validateDataset,
  parseMoney,
  money,
  total,
  branches,
  crmStorageKey,
  type Dataset,
  type Quote,
} from "./crm";

type FormKind = "customer" | "contact" | "quote";
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className="crm-dialog"
      onCancel={close}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const statusLabel = (s: Quote["status"]) =>
  s === "SENT" ? "Issued" : s[0] + s.slice(1).toLowerCase();
export function CrmWorkspace({ branch }: { branch: string }) {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0);
  const seed = useRef<Dataset | null>(null);
  const [tab, setTab] = useState<"customers" | "contacts" | "quotes">(
      "customers",
    ),
    [search, setSearch] = useState("");
  const [form, setForm] = useState<FormKind | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    fetch(`${import.meta.env.BASE_URL}demo/crm.json`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok)
          throw new Error("Demo dataset is unavailable. Retry loading.");
        return r.json();
      })
      .then((raw) => {
        const initial = validateDataset(raw);
        seed.current = initial;
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(crmStorageKey);
        } catch {
          setNotice(
            "Browser storage is unavailable; saving changes requires browser storage.",
          );
        }
        setData(saved ? validateDataset(JSON.parse(saved)) : initial);
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setError(
            e instanceof SyntaxError
              ? "Saved demo data is damaged. Reset demo to restore it."
              : e.message,
          );
      });
    return () => abort.abort();
  }, [retry]);
  function save(next: Dataset) {
    try {
      localStorage.setItem(crmStorageKey, JSON.stringify(next));
    } catch {
      throw new Error(
        "Could not save in this browser. Check storage permissions or available space.",
      );
    }
    setData(next);
    setNotice(
      "Saved in this browser. Other visitors and the PostgreSQL database are unchanged.",
    );
  }
  function reset() {
    if (!seed.current) return;
    if (
      !window.confirm(
        "Reset customers, contacts and quotations in this browser to the synthetic demo records?",
      )
    )
      return;
    try {
      localStorage.removeItem(crmStorageKey);
      setData(structuredClone(seed.current));
      setError("");
      setSelected(null);
      setNotice("Synthetic demo restored.");
    } catch {
      setError("Browser storage could not be cleared.");
    }
  }
  if (error || !data)
    return (
      <section className="crm-panel">
        <h2>
          {error ? "Demo needs attention" : "Loading your demo workspace…"}
        </h2>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button
              className="crm-primary"
              onClick={() => setRetry((x) => x + 1)}
            >
              Retry loading
            </button>
            {seed.current && (
              <button className="crm-secondary" onClick={reset}>
                Reset demo
              </button>
            )}
          </>
        )}
      </section>
    );
  const customers = data.customers.filter(
    (c) => branch === "All branches" || c.branch === branch,
  );
  const customerIds = new Set(customers.map((c) => c.id));
  const contacts = data.contacts.filter((c) => customerIds.has(c.customerId));
  const quotes = data.quotes.filter(
    (q) => branch === "All branches" || q.branch === branch,
  );
  const filter = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());
  const currentQuote = data.quotes.find((q) => q.id === selected);
  function changeStatus(q: Quote, status: Quote["status"]) {
    try {
      save(transition(data!, q.id, status));
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function download(q: Quote) {
    const esc = (s: string) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      );
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(q.number)}</title><style>body{font:16px system-ui;max-width:850px;margin:60px auto;padding:20px;color:#263c35}table{width:100%;border-collapse:collapse}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}small{color:#666}</style><h1>SaamERP · Quotation</h1><p>${esc(q.number)} · ${statusLabel(q.status)}</p><h2>${esc(q.customerName)}</h2><p>${esc(q.contactName)}<br>${esc(q.branch)}</p><p>Valid until ${q.validUntil} · Currency NGN</p><table><tr><th>Description</th><th>Quantity</th><th>Unit price</th><th>Amount</th></tr>${q.lines.map((l) => `<tr><td>${esc(l.description)}</td><td>${l.quantity}</td><td>${money(l.unitPriceMinor)}</td><td>${money(l.quantity * l.unitPriceMinor)}</td></tr>`).join("")}</table><h2>Total ${money(q.totalMinor)}</h2><small>Synthetic demonstration. No tax calculation, invoice or email transmission. ${q.status === "DRAFT" ? "Draft — not issued." : "Issued snapshot — line items and recipient preserved."}</small></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${q.number}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="crm-workspace">
      <div className="crm-intro">
        <div>
          <span className="eyebrow">CUSTOMER OPERATIONS</span>
          <h2>Relationships that move business forward.</h2>
          <p>Customers, the people behind them, and your next quotation.</p>
        </div>
        <button className="crm-secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reset demo
        </button>
      </div>
      <div className="crm-demo-note">
        Synthetic demo · Dataset generated through the Java API and PostgreSQL
        on a GitHub runner. Edits are saved only in this browser.
      </div>
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            aria-label="Dismiss CRM message"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="crm-summary">
        <div>
          <Users size={20} />
          <strong>{customers.length}</strong>
          <span>Customers</span>
        </div>
        <div>
          <Users size={20} />
          <strong>{contacts.length}</strong>
          <span>Contacts</span>
        </div>
        <div>
          <FileText size={20} />
          <strong>{quotes.length}</strong>
          <span>Quotations</span>
        </div>
      </div>
      <div className="crm-panel">
        <div className="crm-toolbar">
          <div className="crm-tabs" role="tablist" aria-label="CRM records">
            {(["customers", "contacts", "quotes"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setSearch("");
                }}
              >
                {t === "quotes"
                  ? "Quotations"
                  : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="crm-primary"
            onClick={() =>
              setForm(
                tab === "customers"
                  ? "customer"
                  : tab === "contacts"
                    ? "contact"
                    : "quote",
              )
            }
          >
            <Plus size={16} />
            {tab === "customers"
              ? "New customer"
              : tab === "contacts"
                ? "New contact"
                : "New quotation"}
          </button>
        </div>
        <label className="search crm-search">
          <Search size={17} />
          <input
            aria-label="Search CRM records"
            placeholder={`Search ${tab === "quotes" ? "quotations" : tab}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                {(tab === "customers"
                  ? ["Customer", "Email", "Branch", "Contacts"]
                  : tab === "contacts"
                    ? ["Contact", "Customer", "Email"]
                    : ["Quotation", "Customer", "Total (NGN)", "Status", ""]
                ).map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "customers" &&
                customers
                  .filter((c) => filter(c.name + " " + c.email))
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{c.email || "—"}</td>
                      <td>{c.branch}</td>
                      <td>
                        {contacts.filter((p) => p.customerId === c.id).length}
                      </td>
                    </tr>
                  ))}
              {tab === "contacts" &&
                contacts
                  .filter((c) => filter(c.name + " " + c.email))
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        {
                          data.customers.find((x) => x.id === c.customerId)
                            ?.name
                        }
                      </td>
                      <td>{c.email || "—"}</td>
                    </tr>
                  ))}
              {tab === "quotes" &&
                quotes
                  .filter((q) =>
                    filter(
                      q.number +
                        " " +
                        q.customerName +
                        " " +
                        statusLabel(q.status),
                    ),
                  )
                  .map((q) => (
                    <tr key={q.id}>
                      <td>
                        <strong>{q.number}</strong>
                        <small>Valid until {q.validUntil}</small>
                      </td>
                      <td>{q.customerName}</td>
                      <td>{money(q.totalMinor)}</td>
                      <td>
                        <span
                          className={`quote-status ${q.status.toLowerCase()}`}
                        >
                          {statusLabel(q.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="crm-link"
                          aria-label={`Open quotation ${q.number}`}
                          onClick={() => setSelected(q.id)}
                        >
                          View
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {(tab === "customers"
          ? customers.filter((c) => filter(c.name + " " + c.email))
          : tab === "contacts"
            ? contacts.filter((c) => filter(c.name + " " + c.email))
            : quotes.filter((q) =>
                filter(
                  q.number + " " + q.customerName + " " + statusLabel(q.status),
                ),
              )
        ).length === 0 && (
          <p className="crm-empty">
            No records match this view. Try another branch or create your first
            record.
          </p>
        )}
      </div>
      {form && (
        <CrmForm
          kind={form}
          data={data}
          branch={branch}
          close={() => setForm(null)}
          submit={(next) => {
            save(next);
            setForm(null);
          }}
        />
      )}
      {currentQuote && (
        <Modal title="Quotation details" close={() => setSelected(null)}>
          <div className="quote-document">
            <div className="quote-doc-top">
              <div>
                <h3>{currentQuote.number}</h3>
                <p>{currentQuote.customerName}</p>
                <p>{currentQuote.contactName || "No named contact"}</p>
                <p>{currentQuote.branch}</p>
              </div>
              <span
                className={`quote-status ${currentQuote.status.toLowerCase()}`}
              >
                {statusLabel(currentQuote.status)}
              </span>
            </div>
            <p>Valid until {currentQuote.validUntil} · NGN</p>
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuote.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{l.description}</td>
                      <td>{l.quantity}</td>
                      <td>{money(l.unitPriceMinor)}</td>
                      <td>{money(l.quantity * l.unitPriceMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="quote-total">
              Total {money(currentQuote.totalMinor)}
            </h3>
            <p className="crm-help">
              No taxes applied. This is a quotation, not an invoice. Issuing
              records a snapshot; it does not send email.
            </p>
            <div className="crm-actions">
              <button
                className="crm-secondary"
                onClick={() => download(currentQuote)}
              >
                <Download size={15} />
                Download quotation
              </button>
              {currentQuote.status === "DRAFT" && (
                <button
                  className="crm-primary"
                  onClick={() => changeStatus(currentQuote, "SENT")}
                >
                  Issue quotation
                </button>
              )}
              {currentQuote.status === "SENT" && (
                <>
                  <button
                    className="crm-secondary"
                    onClick={() => changeStatus(currentQuote, "REJECTED")}
                  >
                    Record rejection
                  </button>
                  <button
                    className="crm-primary"
                    onClick={() => changeStatus(currentQuote, "ACCEPTED")}
                  >
                    Record acceptance
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
function CrmForm({
  kind,
  data,
  branch,
  close,
  submit,
}: {
  kind: FormKind;
  data: Dataset;
  branch: string;
  close: () => void;
  submit: (next: Dataset) => void;
}) {
  const [error, setError] = useState("");
  const customers = data.customers.filter(
    (c) => branch === "All branches" || c.branch === branch,
  );
  const [customer, setCustomer] = useState(customers[0]?.id ?? "");
  const [lines, setLines] = useState([
    { description: "", quantity: "1", price: "" },
  ]);
  const tomorrow = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const f = new FormData(event.currentTarget);
      let next: Dataset;
      if (kind === "customer")
        next = addCustomer(data, {
          branch: String(f.get("branch")),
          name: String(f.get("name")),
          email: String(f.get("email")),
        });
      else if (kind === "contact")
        next = addContact(data, {
          customerId: customer,
          name: String(f.get("name")),
          email: String(f.get("email")),
        });
      else
        next = addQuote(
          data,
          customer,
          String(f.get("contact")) || null,
          String(f.get("validUntil")),
          lines.map((l) => ({
            description: l.description,
            quantity: Number(l.quantity),
            unitPriceMinor: parseMoney(l.price),
          })),
        );
      submit(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function update(
    index: number,
    key: "description" | "quantity" | "price",
    value: string,
  ) {
    setLines(lines.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
  }
  let preview = "—";
  try {
    preview = money(
      total(
        lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPriceMinor: parseMoney(l.price),
        })),
      ),
    );
  } catch {
    /* Incomplete form */
  }
  return (
    <Modal
      title={
        kind === "customer"
          ? "New customer"
          : kind === "contact"
            ? "New contact"
            : "New quotation"
      }
      close={close}
    >
      <form className="crm-form" onSubmit={onSubmit}>
        {error && (
          <p className="crm-form-error" role="alert">
            {error}
          </p>
        )}
        {kind === "customer" ? (
          <>
            <label>
              Customer name
              <input name="name" required maxLength={160} autoFocus />
            </label>
            <label>
              Branch
              <select
                aria-label="Customer branch"
                name="branch"
                defaultValue={branches.includes(branch) ? branch : branches[0]}
              >
                {branches.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              Email (optional)
              <input name="email" type="email" maxLength={200} />
            </label>
          </>
        ) : (
          <>
            <label>
              Customer
              <select
                aria-label="Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {kind === "contact" ? (
              <>
                <label>
                  Contact name
                  <input name="name" required maxLength={160} />
                </label>
                <label>
                  Email (optional)
                  <input name="email" type="email" maxLength={200} />
                </label>
              </>
            ) : (
              <>
                <label>
                  Contact (optional)
                  <select
                    aria-label="Contact (optional)"
                    name="contact"
                    key={customer}
                  >
                    <option value="">No named contact</option>
                    {data.contacts
                      .filter((c) => c.customerId === customer)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Valid until
                  <input
                    name="validUntil"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    defaultValue={tomorrow}
                  />
                </label>
                <fieldset>
                  <legend>Quotation lines · NGN</legend>
                  {lines.map((l, i) => (
                    <div className="quote-line-form" key={i}>
                      <label>
                        Description {i + 1}
                        <input
                          aria-label={`Description ${i + 1}`}
                          required
                          maxLength={240}
                          value={l.description}
                          onChange={(e) =>
                            update(i, "description", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Quantity {i + 1}
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          required
                          value={l.quantity}
                          onChange={(e) =>
                            update(i, "quantity", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Unit price {i + 1} (NGN)
                        <input
                          inputMode="decimal"
                          required
                          value={l.price}
                          onChange={(e) => update(i, "price", e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove line ${i + 1}`}
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines(lines.filter((_, n) => n !== i))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="crm-link"
                    disabled={lines.length >= 100}
                    onClick={() =>
                      setLines([
                        ...lines,
                        { description: "", quantity: "1", price: "" },
                      ])
                    }
                  >
                    <Plus size={14} />
                    Add line
                  </button>
                </fieldset>
                <strong className="quote-total">Total {preview}</strong>
                <p className="crm-help">
                  Whole quantities and NGN only in this slice. No tax rates are
                  assumed. Drafts are not sent to customers.
                </p>
              </>
            )}
          </>
        )}
        <div className="crm-actions">
          <button type="button" className="crm-secondary" onClick={close}>
            Cancel
          </button>
          <button className="crm-primary" type="submit">
            {kind === "quote"
              ? "Save draft"
              : kind === "customer"
                ? "Save customer"
                : "Save contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
