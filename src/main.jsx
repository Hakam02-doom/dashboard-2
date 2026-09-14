import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowDownToLine,
  ArrowUp,
  LayoutGrid,
  FileText,
  CalendarDays,
  Sparkles,
  Search,
  Globe2,
  Share2,
  Settings,
  Bell,
  CircleHelp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock3,
  CircleCheck,
  Plus,
  SlidersHorizontal,
  ExternalLink,
  BookOpen,
  Layers3,
  Link2,
  TrendingUp,
  MoreHorizontal,
  Home,
  PanelLeftClose,
  Headphones,
  Moon,
  Sun,
} from "lucide-react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import { LibraryPage, CalendarPage, ContentComposer } from "./ContentSections";
import { extraContent } from "./content-data";
import { KeywordPage, VisibilityPage } from "./ResearchSections";

import InkwiseDashboard from "./InkwiseDashboard";
import { useTheme } from "./useTheme";
import "./inkwise.css";
import "./typography.css";
import "./workspace.css";

const content = [
  {
    id: 1,
    title: "Allergen labeling best practices",
    type: "SEO article",
    date: "Sep 14, 2026",
    time: "08:00 AM",
    status: "Scheduled",
    tone: "peach",
    keyword: "allergen labeling best practices",
    volume: 50,
    description:
      "A practical guide to clear allergen labeling for corporate catering, with steps to help teams communicate dietary information.",
  },
  {
    id: 2,
    title: "Halal menu compliance",
    type: "SEO article",
    date: "Sep 15, 2026",
    time: "08:00 AM",
    status: "Scheduled",
    tone: "purple",
    keyword: "halal menu compliance",
    volume: 40,
    description:
      "Plan a halal-friendly office menu and communicate requirements clearly with your catering provider.",
  },
  {
    id: 3,
    title: "Vegan office catering options",
    type: "SEO article",
    date: "Sep 16, 2026",
    time: "08:00 AM",
    status: "Scheduled",
    tone: "green",
    keyword: "vegan office catering options",
    volume: 70,
    description:
      "Explore plant-based catering options for office lunches, meetings, and team events.",
  },
  {
    id: 4,
    title: "Gluten-free catering strategies",
    type: "SEO article",
    date: "Sep 17, 2026",
    time: "08:00 AM",
    status: "Draft",
    tone: "blue",
    keyword: "gluten-free catering strategies",
    volume: 60,
    description:
      "Build a more inclusive office catering plan with clearly identified gluten-free menu options.",
  },
  {
    id: 5,
    title: "Corporate catering across the GTA",
    type: "Social post",
    date: "Sep 18, 2026",
    time: "02:00 PM",
    status: "Ready for review",
    tone: "peach",
    keyword: "corporate catering GTA",
    volume: 120,
    description:
      "A coordinated content set introducing what LunchLink delivers to workplaces across the Greater Toronto Area.",
  },
  {
    id: 6,
    title: "Individually packaged meals for meetings",
    type: "Social post",
    date: "Sep 19, 2026",
    time: "02:00 PM",
    status: "Ready for review",
    tone: "purple",
    keyword: "individually packaged meals benefits",
    volume: 90,
    description:
      "A social content set covering convenient individually packaged meals for workplace meetings.",
  },
];
const navItems = [
  { name: "Dashboard", icon: Home },
  { name: "Content library", icon: FileText },
  { name: "Content calendar", icon: CalendarDays },
  { name: "AI visibility", icon: Sparkles },
  { name: "Keyword research", icon: Search },
  { name: "Google Business", icon: Globe2 },
  { name: "Social media", icon: Share2 },
  { name: "Connections", icon: Link2 },
];
function Logo() {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <rect key={index} x="15.5" y="1" width="9" height="13" rx="4.5"
          transform={`rotate(${index * 45} 20 20)`} />
      ))}
    </svg>
  );
}
function ContentAvatar({ item }) {
  return <span className="content-avatar">{item.type === "Social post" ? <Share2 size={22} /> : <FileText size={22} />}</span>;
}

function App() {
  const { theme, preference, chooseTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false),
    [view, setView] = useState("Dashboard"),
    [selected, setSelected] = useState(null),
    [query, setQuery] = useState(""),
    [popover, setPopover] = useState(null),
    [toast, setToast] = useState(""),
    [items, setItems] = useState([...content, ...extraContent]),
    [composerOpen, setComposerOpen] = useState(false),
    [composerDate, setComposerDate] = useState("2026-09-14"),
    [composerKeyword, setComposerKeyword] = useState(""),
    [noticeRead, setNoticeRead] = useState(false);
  const dialog = useRef(null),
    popRef = useRef(null);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  useEffect(() => {
    if (!toast) return;
    let timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function dismiss(e) {
      if (popRef.current && !popRef.current.contains(e.target))
        setPopover(null);
    }
    function esc(e) {
      if (e.key === "Escape") setPopover(null);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  useEffect(() => {
    const searchShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("workspace-search")?.focus();
      }
    };
    document.addEventListener("keydown", searchShortcut);
    return () => document.removeEventListener("keydown", searchShortcut);
  }, []);
  function navigate(name) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMobileMenu(false);
    setView(name);
    setQuery("");
    setPopover(null);
  }
  return (
    <div
      className={
        "app-shell inkwise-shell " + (mobileMenu ? "rail-expanded" : "")
      }
    >
      <aside className="sidebar" aria-label="Main navigation">
        <button
          className="brand"
          aria-label="Uplift AI home"
          title="Uplift AI"
          onClick={() => navigate("Dashboard")}
        >
          <Logo />
        </button>
        <button
          className="iw-collapse"
          aria-label="Toggle navigation labels"
          aria-expanded={mobileMenu}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          <PanelLeftClose size={19} />
        </button>
        <nav className={"nav-rail " + (mobileMenu ? "mobile-expanded" : "")}>
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={"nav-item " + (view === name ? "active" : "")}
              aria-label={name}
              aria-current={view === name ? "page" : undefined}
              data-tooltip={name}
              onClick={() => navigate(name)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span className="mobile-nav-label">{name}</span>
            </button>
          ))}
        </nav>
        <div className="bottom-rail">
          <button
            className="nav-item"
            aria-label="Workspace information"
            data-tooltip="Workspace information"
            onClick={() => navigate("Settings")}
          >
            <CircleHelp size={19} />
          </button>
          <button
            className="nav-item"
            aria-label="Publishing connections"
            data-tooltip="Publishing connections"
            onClick={() => navigate("Connections")}
          >
            <Headphones size={19} />
          </button>
          <button
            className="nav-item mobile-more"
            aria-label="More navigation"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={19} /> : <MoreHorizontal size={19} />}
          </button>
          <button
            className={"nav-item " + (view === "Settings" ? "active" : "")}
            aria-label="Settings"
            data-tooltip="Settings"
            onClick={() => navigate("Settings")}
          >
            <Settings size={19} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar iw-topbar">
          <label className="iw-search">
            <Search size={20} />
            <input
              id="workspace-search"
              aria-label="Search content"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setView("Dashboard");
              }}
            />
            {query ? (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            ) : (
              <span className="iw-shortcut">
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </span>
            )}
          </label>
          <div className="header-actions" ref={popRef}>
            <button
              className="iw-theme-toggle"
              role="switch"
              aria-label="Dark mode"
              aria-checked={theme === "dark"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => chooseTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="iw-notification"
              aria-label="Notifications"
              onClick={() => {
                navigate("Notifications");
                setNoticeRead(true);
              }}
            >
              <Bell size={20} />
              {!noticeRead && <i />}
            </button>
            <button
              className="iw-profile"
              aria-label="LunchLink workspace menu"
              aria-expanded={popover === "workspace"}
              onClick={() =>
                setPopover(popover === "workspace" ? null : "workspace")
              }
            >
              <span>L</span>
            </button>
            {popover === "workspace" && (
              <div className="workspace-view workspace-popover">
                <div className="popover workspace-pop">
                  <p>Your workspace</p>
                  <strong>LunchLink</strong>
                  <span className="muted">Uplift AI · Content workspace</span>
                  <div className="popover-note">
                    A preview of your saved workspace. Changes last for this
                    session.
                  </div>
                  <button onClick={() => navigate("Settings")}>
                    Workspace settings <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        {view !== "Dashboard" && (
          <div className="iw-secondary-heading">
            <h1>{view}</h1>
            <span>LunchLink workspace</span>
          </div>
        )}
        {view === "Dashboard" ? (
          <InkwiseDashboard
            items={items}
            query={query}
            onOpen={setSelected}
            onNavigate={navigate}
            onToast={setToast}
            onCreate={() => {
              setComposerKeyword("");
              setComposerDate("2026-09-14");
              setComposerOpen(true);
            }}
          />
        ) : (
          <div className="workspace-view">
            {view === "Content calendar" ? (
              <CalendarPage
                items={items}
                onOpen={setSelected}
                onCreate={(date) => {
                  setComposerKeyword("");
                  setComposerDate(date || "2026-09-14");
                  setComposerOpen(true);
                }}
              />
            ) : ["Content library", "Social media"].includes(view) ? (
              <LibraryPage
                key={view}
                items={items}
                setItems={setItems}
                onOpen={setSelected}
                onToast={setToast}
                onCreate={() => {
                  setComposerKeyword("");
                  setComposerDate("2026-09-14");
                  setComposerOpen(true);
                }}
                socialOnly={view === "Social media"}
                onCalendar={() => navigate("Content calendar")}
              />
            ) : view === "Keyword research" ? (
              <KeywordPage
                onCreate={(keyword) => {
                  setComposerKeyword(
                    typeof keyword === "string" ? keyword : "",
                  );
                  setComposerDate("2026-09-14");
                  setComposerOpen(true);
                }}
                onLibrary={() => navigate("Content library")}
              />
            ) : view === "AI visibility" ? (
              <VisibilityPage onKeywords={() => navigate("Keyword research")} />
            ) : view === "Settings" ? (
              <section className="panel detail-page">
                <div className="detail-heading">
                  <div>
                    <h2>Workspace settings</h2>
                    <p>Your LunchLink workspace is ready.</p>
                  </div>
                  <span className="status-pill">5 of 5 complete</span>
                </div>
                <div className="appearance-setting">
                  <div>
                    <label htmlFor="theme-preference">Appearance</label>
                    <p>Choose your theme. Your preference stays with this browser.</p>
                  </div>
                  <select id="theme-preference" value={preference} onChange={(event) => chooseTheme(event.target.value)}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                {[
                  "Business profile",
                  "SEO content plan",
                  "Social topic plan",
                  "Publishing connections",
                  "Generate SEO + Social",
                ].map((x, i) => (
                  <div className="setup-row" key={x}>
                    <span className="setup-number">{i + 1}</span>
                    <span>{x}</span>
                    <CircleCheck size={19} />
                    <span>Completed</span>
                  </div>
                ))}
                <div className="info-block">
                  <CircleHelp size={20} />
                  <p>
                    This is a local dashboard preview. Workspace settings and
                    publishing connections are read-only source snapshots.
                  </p>
                </div>
              </section>
            ) : view === "Notifications" ? (
              <section className="panel detail-page">
                <div className="detail-heading">
                  <div>
                    <h2>Recent activity</h2>
                    <p>
                      You’re all caught up with the latest workspace activity.
                    </p>
                  </div>
                  <CircleCheck size={24} />
                </div>
                {[
                  "Content created for “buffet vs boxed lunches”",
                  "What Are the Benefits of Individually Packaged Meals for Offices?",
                  "Which 7 Menu Planning Choices Fit Your Meeting Best?",
                ].map((n, i) => (
                  <div className="activity-row" key={n}>
                    <span className="content-avatar purple">
                      <FileText size={19} />
                    </span>
                    <div>
                      <h3>{n}</h3>
                      <p>
                        {i === 2 ? "2 days ago" : "13 hours ago"} · Source
                        snapshot
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ) : (
              <section className="panel detail-page">
                <div className="detail-heading">
                  <div>
                    <h2>
                      {view === "Google Business"
                        ? "Google Business Profile"
                        : "Publishing connections"}
                    </h2>
                    <p>Connection health for the selected website.</p>
                  </div>
                </div>
                {(view === "Google Business"
                  ? [
                      [
                        "Google Business",
                        "The saved connection has not synced recently.",
                        "Sync overdue",
                      ],
                    ]
                  : [
                      [
                        "Website publishing",
                        "Your website publishing destination is ready.",
                        "Connected",
                      ],
                      [
                        "Google Business",
                        "Review the saved connection before relying on automation.",
                        "Sync overdue",
                      ],
                      [
                        "Social publishing",
                        "4 social accounts connected.",
                        "Connected",
                      ],
                    ]
                ).map(([title, desc, status]) => (
                  <div className="connection-row" key={title}>
                    <span className="content-avatar blue">
                      <Globe2 size={22} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                    <span
                      className={
                        "status-pill " +
                        (status === "Sync overdue" ? "draft" : "")
                      }
                    >
                      {status}
                    </span>
                  </div>
                ))}
                <div className="info-block">
                  <CircleHelp size={20} />
                  <p>
                    Connections reflect your source workspace. Manage live
                    connections in Uplift AI.
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <div className="workspace-view workspace-overlays">
        <ContentComposer
          open={composerOpen}
          initialDate={composerDate}
          initialKeyword={composerKeyword}
          onClose={() => setComposerOpen(false)}
          onSave={(item) => {
            setItems((old) => [...old, item]);
            setToast("Content added to your preview workspace.");
          }}
        />
        <dialog
          aria-label="Content details"
          ref={dialog}
          onCancel={() => setSelected(null)}
          onClick={(e) => {
            if (e.target === dialog.current) setSelected(null);
          }}
        >
          {selected && (
            <>
              <div className="dialog-header">
                <ContentAvatar item={selected} />
                <button
                  className="circle-button"
                  aria-label="Close content details"
                  onClick={() => setSelected(null)}
                >
                  <X size={19} />
                </button>
              </div>
              <h2>{selected.title}</h2>
              <p className="dialog-description">{selected.description}</p>
              <dl>
                <div>
                  <dt>Content type</dt>
                  <dd>{selected.type}</dd>
                </div>
                <div>
                  <dt>Scheduled for</dt>
                  <dd>
                    {selected.date} · {selected.time}
                  </dd>
                </div>
                <div>
                  <dt>Target keyword</dt>
                  <dd>{selected.keyword}</dd>
                </div>
                <div>
                  <dt>Monthly searches</dt>
                  <dd>{selected.volume}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="status-pill">{selected.status}</span>
                  </dd>
                </div>
              </dl>
              <p className="preview-note">
                Content preview · Changes are saved for this session only.
              </p>
              <div className="dialog-actions">
                <button
                  className="text-button"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    setItems(
                      items.map((i) =>
                        i.id === selected.id
                          ? { ...i, status: "Ready for review" }
                          : i,
                      ),
                    );
                    setSelected(null);
                    setToast("Marked ready for review in this preview.");
                  }}
                >
                  <Check size={16} />
                  Mark ready for review
                </button>
              </div>
            </>
          )}
        </dialog>
        {toast && (
          <div className="toast" role="status">
            <CircleCheck size={18} />
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
