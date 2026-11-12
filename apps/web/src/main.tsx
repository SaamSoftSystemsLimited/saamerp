import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Layers3,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  catalog,
  changeModule,
  readModules,
  storageKey,
  title,
  type ModuleId,
} from "./modules";
import "./style.css";
import { CrmWorkspace } from "./CrmWorkspace";

function App() {
  const [enabled, setEnabled] = useState<ModuleId[]>(() => {
    try {
      return readModules(localStorage.getItem(storageKey));
    } catch {
      return readModules(null);
    }
  });
  const [branch, setBranch] = useState("All branches");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"overview" | "modules" | "crm">("overview");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  function toggle(id: ModuleId) {
    try {
      const next = changeModule(enabled, id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setNotice(
          "Browser storage is unavailable. Your changes will last for this visit only.",
        );
        setEnabled(next);
        return;
      }
      setEnabled(next);
      setNotice(
        `${title(id)} ${next.includes(id) ? "enabled" : "disabled"}. Demo preferences saved; existing history is retained.`,
      );
    } catch (error) {
      setNotice((error as Error).message);
    }
  }
  const visible = catalog.filter((m) =>
    `${m.title} ${m.category} ${m.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <a href="#" className="brand" onClick={() => setView("overview")}>
          <span className="brand-symbol">
            <Layers3 size={24} />
          </span>
          Saam<span>ERP</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">SS</span>
          <div>
            <strong>SaamSoft Systems</strong>
            <small>Demonstration workspace</small>
          </div>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation">
          <button
            className={view === "overview" ? "selected" : ""}
            onClick={() => {
              setView("overview");
              setMobileMenu(false);
            }}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button
            className={view === "modules" ? "selected" : ""}
            onClick={() => {
              setView("modules");
              setMobileMenu(false);
            }}
          >
            <Layers3 size={18} />
            Modules<span className="nav-count">{catalog.length}</span>
          </button>
          <button
            className={view === "crm" ? "selected" : ""}
            onClick={() => {
              setView("crm");
              setMobileMenu(false);
            }}
          >
            <Users size={18} />
            Customers & quotations
          </button>
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={21} />
          <strong>Your business. Connected.</strong>
          <p>One workspace for your teams, operations and finances.</p>
          <span>
            CRM demonstration <span className="tiny-dot" />
          </span>
        </div>
        <div className="profile">
          <div className="avatar">SA</div>
          <div>
            <strong>Sunday Ayandele</strong>
            <small>Demo administrator</small>
          </div>
        </div>
      </aside>
      <div className="content-shell">
        <header>
          <div className="breadcrumb">
            <button
              className="icon-button menu"
              aria-label="Toggle navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>
              {view === "overview"
                ? "Overview"
                : view === "crm"
                  ? "CRM & sales"
                  : "Modules"}
            </strong>
          </div>
          <div className="header-right">
            <span className="demo-tag">DEMO</span>
            <button
              className="icon-button"
              aria-label="About this preview"
              onClick={() =>
                setNotice(
                  "This demo includes customers, contacts and quotations. Synthetic seed records come from PostgreSQL on GitHub runners; your edits stay in this browser. No live backend connection is used by Pages.",
                )
              }
            >
              <CircleHelp size={19} />
            </button>
            <div className="avatar small">SA</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
              <h1>
                {view === "overview"
                  ? "A good day to move forward."
                  : view === "crm"
                    ? "Your customer workspace."
                    : "Make SaamERP your own."}
              </h1>
              <p>
                {view === "overview"
                  ? "A connected foundation for the way your business works."
                  : view === "crm"
                    ? "From the first conversation to an accepted quotation."
                    : "Choose the modules your business needs. Grow at your own pace."}
              </p>
            </div>
            <label className="branch-picker">
              <Building2 size={16} />
              <select
                aria-label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option>All branches</option>
                <option>Lagos · Head office</option>
                <option>Abuja · Demo branch</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <>
              <section className="welcome-card">
                <div>
                  <span className="pill">
                    <span className="tiny-dot" /> LET’S BUILD SOMETHING BETTER
                  </span>
                  <h2>
                    Everything your business needs.
                    <br />
                    <span>Working together.</span>
                  </h2>
                  <p>
                    Start with your organization, connect your modules,
                    <br className="desktop-break" /> and shape a workspace that
                    grows with you.
                  </p>
                  <button
                    className="light-button"
                    onClick={() => setView("modules")}
                  >
                    Explore your modules <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="orbital" aria-hidden="true">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="orbit o3" />
                  <div className="orbit-center">
                    <Layers3 size={40} />
                  </div>
                  <span className="orbit-icon oi1">
                    <Users size={24} />
                  </span>
                  <span className="orbit-icon oi2">
                    <Wallet size={24} />
                  </span>
                  <span className="orbit-icon oi3">
                    <Building2 size={24} />
                  </span>
                  <span className="orbit-dot od1" />
                  <span className="orbit-dot od2" />
                </div>
              </section>
              <section className="stats" aria-label="Workspace summary">
                <article>
                  <div className="stat-label">
                    Active modules
                    <Layers3 size={18} />
                  </div>
                  <strong>
                    {enabled.length.toString().padStart(2, "0")}
                    <small>/ {catalog.length}</small>
                  </strong>
                  <p>
                    <span className="green-dot" />
                    Configured in this browser
                  </p>
                </article>
                <article>
                  <div className="stat-label">
                    Demo branches
                    <Building2 size={18} />
                  </div>
                  <strong>{branch === "All branches" ? "02" : "01"}</strong>
                  <p>
                    {branch === "All branches"
                      ? "Lagos and Abuja · synthetic data"
                      : branch}
                  </p>
                </article>
                <article>
                  <div className="stat-label">
                    Workspace stage
                    <ShieldCheck size={18} />
                  </div>
                  <strong className="text-stat">Foundation</strong>
                  <p>Controlled demonstration · M0</p>
                </article>
              </section>
            </>
          )}
          {view === "crm" &&
            (enabled.includes("crm") ? (
              <CrmWorkspace branch={branch} />
            ) : (
              <div className="empty">
                <h2>CRM & sales is disabled</h2>
                <p>
                  Your saved records are retained. Enable CRM & sales in Modules
                  to continue.
                </p>
                <button onClick={() => setView("modules")}>
                  Manage modules
                </button>
              </div>
            ))}
          {view !== "crm" && (
            <section className="modules-section">
              <div className="section-heading">
                <div>
                  <h2>
                    {view === "overview"
                      ? "Your business toolkit"
                      : "Workspace modules"}
                    <span className="count">{catalog.length}</span>
                  </h2>
                  <p>Activate what you need. Your history stays with you.</p>
                </div>
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search modules"
                    placeholder="Search modules..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="module-grid">
                {visible.map((module) => {
                  const active = enabled.includes(module.id);
                  const required = "required" in module && module.required;
                  const Icon =
                    module.category === "Finance"
                      ? Wallet
                      : module.category === "People" || module.id === "crm"
                        ? Users
                        : module.id === "organization"
                          ? Building2
                          : Layers3;
                  return (
                    <article className="module-card" key={module.id}>
                      <div className="module-top">
                        <div
                          className={`module-icon ${module.category === "Finance" ? "purple" : module.category === "People" ? "orange" : ""}`}
                        >
                          <Icon size={22} />
                        </div>
                        <span className={`status ${active ? "active" : ""}`}>
                          {active ? (
                            <>
                              <span className="tiny-dot" />
                              Active
                            </>
                          ) : (
                            "Not active"
                          )}
                        </span>
                      </div>
                      <div className="module-category">{module.category}</div>
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                      <div className="dependency">
                        {required
                          ? "Included in every workspace"
                          : `Requires: ${module.dependencies.map(title).join(", ")}`}
                      </div>
                      <div className="module-footer">
                        {module.id === "crm" && active ? (
                          <button onClick={() => setView("crm")}>
                            Open CRM <ArrowUpRight size={14} />
                          </button>
                        ) : (
                          <span>
                            {module.id === "crm"
                              ? "Demo workflow available"
                              : "Workflow coming next"}
                          </span>
                        )}
                        <button
                          disabled={required}
                          aria-label={`${active ? "Disable" : "Enable"} ${module.title}`}
                          onClick={() => toggle(module.id)}
                        >
                          {required ? (
                            <>
                              <Check size={14} />
                              Required
                            </>
                          ) : active ? (
                            "Disable"
                          ) : (
                            <>
                              Enable
                              <ArrowUpRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!visible.length && (
                <div className="empty">
                  No modules match “{query}”.{" "}
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              )}
            </section>
          )}
          <div className="bottom-note">
            <ShieldCheck size={18} />
            <p>
              <strong>A safe place to explore.</strong> This preview uses
              synthetic data. Module preferences are saved only in this browser;
              no real customer records should be entered.
            </p>
          </div>
          <footer>
            <span>© {new Date().getFullYear()} SaamSoft Systems</span>
            <span>SaamERP · Built for what’s next</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
