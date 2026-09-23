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
  Moon,
  Sun,
  PanelLeft,
  Building2,
} from "lucide-react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "./styles.css";
import { LibraryPage, CalendarPage, ContentComposer } from "./ContentSections";
import { SeoWorkspace } from "./SeoWorkspace";
import { AiConnections } from "./AiConnections";
import { AiVisibilityEntry } from "./AiVisibilityEntry";
import { SocialWorkspace } from "./SocialWorkspace";
import { BusinessProfile } from "./BusinessProfile";
import { extraContent } from "./content-data";
import { KeywordPage, VisibilityPage } from "./ResearchSections";

import "./desktop-typography.css";
import "./mobile-layout.css";
import "./theme.css";
import "./sidebar.css";
import "./workspace-consistency.css";
import "./analytics-motion.css";
import { useAppearance } from "./appearance";

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
  { name: "Dashboard", icon: LayoutGrid },
  { name: "Content library", icon: FileText },
  { name: "Content calendar", icon: CalendarDays },
  { name: "AI visibility", icon: Sparkles },
  { name: "Keyword research", icon: Search },
  { name: "Google Business", icon: Globe2 },
  { name: "Social media", icon: Share2 },
  { name: "Business Profile", icon: Building2 },
  { name: "Connections", icon: Link2 },
];
const mixes = [
  { name: "SEO articles", value: 40, color: "var(--d2-chart-purple, #b8b7f4)" },
  { name: "Social posts", value: 28, color: "var(--d2-chart-green, #b4dca4)" },
  { name: "Content briefs", value: 16, color: "var(--d2-chart-blue, #95cdf7)" },
  { name: "Google Business", value: 10, color: "var(--d2-chart-gold, #f7d494)" },
  { name: "Other content", value: 6, color: "var(--d2-chart-neutral, #e7ebef)" },
];
const chartSets = {
  Month: {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    values: [16, 13, 23, 16, 17, 12, 10, 22, 13, 15, 17, 11],
    totals: [27, 25, 34, 26, 25, 22, 20, 33, 30, 34, 31, 24],
    max: 40,
  },
  Week: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [5, 8, 6, 10, 7, 3, 4],
    totals: [8, 11, 10, 13, 12, 6, 7],
    max: 16,
  },
  Year: {
    labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
    values: [24, 46, 60, 78, 91, 108],
    totals: [40, 62, 80, 100, 120, 144],
    max: 160,
  },
};
function donutPath(start, value) {
  const point = (r, a) =>
    [
      150 + r * Math.cos((a * Math.PI) / 180),
      150 + r * Math.sin((a * Math.PI) / 180),
    ].join(" ");
  const a = start * 3.6 - 90 + 3,
    b = (start + value) * 3.6 - 90 - 3,
    round = Math.min(5, (b - a) / 4);
  return `M ${point(130, a + round)} A 130 130 0 ${b - a > 180 ? 1 : 0} 1 ${point(130, b - round)} Q ${point(130, b)} ${point(118, b)} L ${point(91, b)} Q ${point(78, b)} ${point(78, b - round)} A 78 78 0 ${b - a > 180 ? 1 : 0} 0 ${point(78, a + round)} Q ${point(78, a)} ${point(91, a)} L ${point(118, a)} Q ${point(130, a)} ${point(130, a + round)} Z`;
}
function Logo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 19 15.8 7 27 19M10 24l5.8-6.6L22 24"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7v12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MiniBars({ variant = 0 }) {
  let vals = variant
    ? [25, 38, 52, 30, 60, 72, 40]
    : [49, 63, 41, 55, 70, 28, 48];
  return (
    <div className={"mini-bars variant-" + variant} aria-hidden="true">
      {vals.map((v, i) => (
        <span key={i} style={{ height: v + "%", "--fill": v * 0.86 + "%" }} />
      ))}
    </div>
  );
}
function Sparkline() {
  return (
    <svg className="sparkline" viewBox="0 0 120 80" aria-hidden="true">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="var(--d2-chart-purple, #c7c5f9)" stopOpacity=".65" />
          <stop offset="1" stopColor="var(--d2-chart-purple, #c7c5f9)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M2 68 9 64 14 53 23 57 31 47 39 50 48 41 56 46 65 16 72 12 79 42 87 37 96 53 104 44 110 48 118 36V80H2Z"
        fill="url(#sparkFill)"
      />
      <path
        d="M2 68 9 64 14 53 23 57 31 47 39 50 48 41 56 46 65 16 72 12 79 42 87 37 96 53 104 44 110 48 118 36"
        fill="none"
        stroke="var(--d2-chart-purple, #c2bff3)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="79" cy="42" r="3" fill="var(--d2-surface, white)" stroke="var(--d2-chart-purple, #b8b3ec)" />
    </svg>
  );
}
function Gauge() {
  return (
    <div className="mini-gauge" aria-hidden="true">
      <svg viewBox="0 0 126 80">
        <path
          d="M10 68a53 53 0 0 1 106 0"
          pathLength="100"
          fill="none"
          stroke="var(--d2-track, #edf0f2)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M10 68a53 53 0 0 1 106 0"
          pathLength="100"
          fill="none"
          stroke="var(--d2-chart-purple, #c6c4f6)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M25 68a38 38 0 0 1 76 0"
          fill="none"
          stroke="var(--d2-line, #dfe2ed)"
          strokeDasharray="1 5"
          strokeWidth="2"
        />
      </svg>
      <span>
        <CircleCheck size={20} />
      </span>
    </div>
  );
}
function Metric({ title, value, detail, icon: Icon, graphic, onClick }) {
  return (
    <button className="metric panel" onClick={onClick}>
      <div className="metric-heading">
        <h2>{title}</h2>
        <span className="metric-icon">
          <Icon size={18} />
        </span>
      </div>
      <div className="metric-body">
        <div>
          <strong>{value}</strong>
          <p>
            <TrendingUp size={14} />
            {detail}
          </p>
        </div>
        {graphic}
      </div>
    </button>
  );
}
function ContentAvatar({ item }) {
  return (
    <span className={"content-avatar " + item.tone}>
      <img
        src={`/avatars/contributor-${((item.id - 1) % 3) + 1}.jpg`}
        alt=""
        width="128"
        height="128"
        decoding="async"
      />
    </span>
  );
}

function readSidebarPreference() {
  try {
    return localStorage.getItem("uplift-dashboard-2-sidebar-expanded") === "true";
  } catch {
    return false;
  }
}

function App() {
  const [openingAnalytics, setOpeningAnalytics] = useState(true);
  const { preference, dark, setPreference } = useAppearance();
  const [sidebarExpanded, setSidebarExpanded] = useState(readSidebarPreference),
    [mobileMenu, setMobileMenu] = useState(false),
    [view, setView] = useState("Dashboard"),
    [period, setPeriod] = useState("Month"),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All content"),
    [popover, setPopover] = useState(null),
    [mix, setMix] = useState(null),
    [toast, setToast] = useState(""),
    [items, setItems] = useState([...content, ...extraContent]),
    [composerOpen, setComposerOpen] = useState(false),
    [composerDate, setComposerDate] = useState("2026-09-14"),
    [composerKeyword, setComposerKeyword] = useState(""),
    [website, setWebsite] = useState("LunchLink"),
    [noticeRead, setNoticeRead] = useState(false);
  const dialog = useRef(null),
    popRef = useRef(null);
  useEffect(() => {
    if (view !== "Dashboard") {
      setOpeningAnalytics(false);
      return;
    }
    const timer = setTimeout(() => setOpeningAnalytics(false), 1000);
    return () => clearTimeout(timer);
  }, [view]);
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
    try {
      localStorage.setItem(
        "uplift-dashboard-2-sidebar-expanded",
        String(sidebarExpanded),
      );
    } catch {
      // The sidebar remains usable when browser storage is unavailable.
    }
  }, [sidebarExpanded]);
  useEffect(() => {
    function dismiss(e) {
      if (popRef.current && !popRef.current.contains(e.target))
        setPopover(null);
    }
    function esc(e) {
      if (e.key === "Escape") {
        setPopover(null);
        setSidebarExpanded(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  function navigate(name) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMobileMenu(false);
    setView(name);
    setQuery("");
    setFilter("All content");
    setPopover(null);
  }
  function exportData() {
    let csv =
      "Title,Type,Date,Status\n" +
      items
        .map((i) =>
          [i.title, i.type, i.date, i.status]
            .map((v) => '"' + v.replaceAll('"', '""') + '"')
            .join(","),
        )
        .join("\n");
    let url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    let a = document.createElement("a");
    a.href = url;
    a.download = "uplift-content.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Content list exported.");
  }
  const shown = items.filter(
    (i) =>
      (i.title + " " + i.type).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All content" || i.status === filter) &&
      (view !== "Social media" || i.type === "Social post"),
  );
  const upcomingItems = items.filter((i) => i.status !== "Published");
  const series = chartSets[period];
  return (
    <div className={`app-shell${openingAnalytics ? " analytics-opening" : ""}`}>
      <aside
        className={"sidebar " + (sidebarExpanded ? "sidebar-expanded" : "")}
        aria-label="Main navigation"
      >
        <button
          className="brand"
          aria-label="Uplift AI home"
          title="Uplift AI"
          onClick={() => navigate("Dashboard")}
        >
          <Logo />
        </button>
          <button
            className="nav-item sidebar-toggle"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarExpanded}
            aria-controls="primary-navigation"
            data-tooltip={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setSidebarExpanded((expanded) => !expanded)}
          >
            <PanelLeft size={19} strokeWidth={1.7} aria-hidden="true" />
            <span className="mobile-nav-label" aria-hidden={!sidebarExpanded}>Collapse sidebar</span>
          </button>
        <nav
          id="primary-navigation"
          className={"nav-rail " + (mobileMenu ? "mobile-expanded" : "")}
        >
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
              <span className="mobile-nav-label" aria-hidden={!sidebarExpanded && !mobileMenu}>{name}</span>
            </button>
          ))}
        </nav>
        <div className="bottom-rail">
          <button
            className="nav-item mobile-more"
            aria-label="More navigation"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={19} /> : <MoreHorizontal size={19} />}
          </button>
          <button
            className="nav-item notification-button"
            aria-label="Notifications"
            data-tooltip="Notifications"
            onClick={() => {
              setView("Notifications");
              setNoticeRead(true);
            }}
          >
            <Bell size={19} />
            <span className="mobile-nav-label" aria-hidden={!sidebarExpanded}>Notifications</span>
            {!noticeRead && <i />}
          </button>
          <button
            className={"nav-item " + (view === "Settings" ? "active" : "")}
            aria-label="Settings"
            data-tooltip="Settings"
            onClick={() => navigate("Settings")}
          >
            <Settings size={19} />
            <span className="mobile-nav-label" aria-hidden={!sidebarExpanded}>Settings</span>
          </button>

        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="page-heading">
            <h1>{view}</h1>
            <span className="brand-caption">Uplift AI</span>
          </div>
          <div className="header-actions" ref={popRef}>
            <span className="demo-badge">Demo workspace</span>
            <button
              className="appearance-toggle"
              role="switch"
              aria-label="Dark mode"
              aria-checked={dark}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setPreference(dark ? "light" : "dark")}
            >
              {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            </button>
            <button
              className="workspace-switch"
              aria-expanded={popover === "workspace"}
              onClick={() =>
                setPopover(popover === "workspace" ? null : "workspace")
              }
            >
              <span className="workspace-avatar">
                {website === "LunchLink" ? "L" : "U"}
                <span />
              </span>
              <span>{website}</span>
              <ChevronsUpDown size={14} />
            </button>
            {popover === "workspace" && (
              <div className="popover workspace-pop">
                <p>Your workspace</p>
                <strong>LunchLink</strong>
                <span className="muted">Source content preview</span>
                <div className="popover-note">
                  This prototype uses a snapshot of your LunchLink workspace.
                </div>
                <button
                  onClick={() => {
                    setPopover(null);
                    navigate("Settings");
                  }}
                >
                  Workspace settings <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>
        </header>
        {view === "Dashboard" ? (
          <>
            <section className="metrics" aria-label="Workspace overview">
              <Metric
                title="Published content"
                value="108"
                detail="Total content assets"
                icon={FileText}
                graphic={<MiniBars />}
                onClick={() => navigate("Content library")}
              />
              <Metric
                title="Tracked keywords"
                value="132"
                detail="24 keywords in queue"
                icon={Search}
                graphic={<Sparkline />}
                onClick={() => navigate("Keyword research")}
              />
              <Metric
                title="Social post sets"
                value="28"
                detail="60 topics planned"
                icon={Share2}
                graphic={<MiniBars variant={1} />}
                onClick={() => navigate("Social media")}
              />
              <Metric
                title="Workspace setup"
                value="100%"
                detail="All 5 steps complete"
                icon={CircleCheck}
                graphic={<Gauge />}
                onClick={() => navigate("Settings")}
              />
            </section>
            <div className="dashboard-grid">
              <section className="production panel">
                <div className="section-header">
                  <h2>Content production</h2>
                  <div className="segmented" aria-label="Chart period">
                    {Object.keys(chartSets)
                      .filter((p) => p !== "Year")
                      .concat("Year")
                      .sort(
                        (a, b) =>
                          ["Week", "Month", "Year"].indexOf(a) -
                          ["Week", "Month", "Year"].indexOf(b),
                      )
                      .map((p) => (
                        <button
                          key={p}
                          aria-pressed={period === p}
                          className={period === p ? "selected" : ""}
                          onClick={() => setPeriod(p)}
                        >
                          {p}
                        </button>
                      ))}
                  </div>
                </div>
                <div
                  className="chart"
                  aria-label={period + " content production, illustrative data"}
                >
                  <div className="chart-ticks">
                    {[4, 3, 2, 1, 0].map((t) => (
                      <span key={t}>{(series.max * t) / 4}</span>
                    ))}
                  </div>
                  <div className="plot">
                    <div className="grid-lines">
                      {[0, 1, 2, 3, 4].map((n) => (
                        <i key={n} />
                      ))}
                    </div>
                    <div className="bar-columns">
                      {series.labels.map((label, i) => (
                        <div className="bar-column" key={label}>
                          <button
                            className="bar-area"
                            aria-label={`${label}: ${series.values[i]} published, ${series.totals[i] - series.values[i]} planned`}
                          >
                            <span
                              className="bar-track"
                              style={{
                                height: `${(series.totals[i] / series.max) * 100}%`,
                              }}
                            >
                              <span
                                className="bar-value"
                                style={{
                                  height: `${(series.values[i] / series.totals[i]) * 100}%`,
                                }}
                              />
                            </span>
                            <span className="chart-tooltip">
                              <b>{label}</b>
                              <span>{series.values[i]} published</span>
                              <span>
                                {series.totals[i] - series.values[i]} planned
                              </span>
                            </span>
                          </button>
                          <span className="actual-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="chart-footer">
                  <span>
                    <i className="legend-dot green" />
                    Published
                  </span>
                  <span>
                    <i className="legend-dot gray" />
                    Planned
                  </span>
                  <span className="illustrative-label">
                    Illustrative activity
                  </span>
                </div>
              </section>
              <section className="upcoming panel">
                <div className="section-header">
                  <h2>Upcoming content</h2>
                  <div className="upcoming-controls">
                    <button
                      className="circle-button"
                      aria-label="Previous content"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="circle-button"
                      aria-label="Next content"
                      disabled={offset >= upcomingItems.length - 3}
                      onClick={() =>
                        setOffset(
                          Math.min(upcomingItems.length - 3, offset + 1),
                        )
                      }
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => navigate("Content calendar")}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
                <div className="upcoming-cards">
                  {upcomingItems.slice(offset, offset + 3).map((item) => (
                    <button
                      className="content-card"
                      key={item.id}
                      onClick={() => setSelected(item)}
                    >
                      <div className="content-intro">
                        <ContentAvatar item={item} />
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.type}</p>
                        </div>
                      </div>
                      <div className="content-meta">
                        <span>
                          <CalendarDays size={14} />
                          {item.date}, {item.time}
                        </span>
                        <span>
                          <Globe2 size={14} />
                          LunchLink{" "}
                          <i
                            className={
                              "status-dot " +
                              (item.status === "Draft" ? "draft" : "")
                            }
                          />
                          <span>{item.status}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <section className="distribution panel">
                <div className="section-header">
                  <h2>Content distribution</h2>
                  <button
                    className="small-help"
                    aria-label="About content distribution"
                    onClick={() =>
                      setToast(
                        "Illustrative breakdown of the 108 content assets in this preview.",
                      )
                    }
                  >
                    <CircleHelp size={15} />
                  </button>
                </div>
                <div className="donut-container">
                  <svg
                    className="donut"
                    viewBox="0 0 300 300"
                    role="img"
                    aria-label="Illustrative content distribution: SEO 40%, social 28%, briefs 16%, Google Business 10%, other 6%"
                  >
                    <circle
                      cx="150"
                      cy="150"
                      r="63"
                      fill="none"
                      stroke="var(--d2-line, #dce1e9)"
                      strokeWidth="1.5"
                      strokeDasharray="1 7"
                    />
                    {mixes.map((m, i) => {
                      let start = mixes
                        .slice(0, i)
                        .reduce((a, v) => a + v.value, 0);
                      return (
                        <path
                          key={m.name}
                          d={donutPath(start, m.value)}
                          fill={m.color}
                          style={{
                            opacity: mix !== null && mix !== i ? 0.25 : 1,
                          }}
                        />
                      );
                    })}
                  </svg>
                  <div className="donut-center">
                    {mix === null ? (
                      <span>
                        <Layers3 size={24} />
                      </span>
                    ) : (
                      <>
                        <strong>{mixes[mix].value}%</strong>
                        <small>{mixes[mix].name}</small>
                      </>
                    )}
                  </div>
                </div>
                <div className="distribution-legend">
                  {mixes.map((m, i) => (
                    <button
                      key={m.name}
                      className={mix === i ? "chosen" : ""}
                      aria-pressed={mix === i}
                      onClick={() => setMix(mix === i ? null : i)}
                    >
                      <span>
                        <i style={{ background: m.color }} />
                        {m.name}
                      </span>
                      <span>{m.value}%</span>
                    </button>
                  ))}
                </div>
                <button
                  className="insight"
                  onClick={() => navigate("Social media")}
                >
                  <Sparkles size={17} />
                  <span>Your next 60 social topics are ready.</span>
                  <ArrowUpRight size={14} />
                </button>
              </section>
            </div>
            <footer className="dashboard-footer">
              <span>
                <span className="footer-dot" />
                Your growth, in one place.
              </span>
              <span>Snapshot content · Illustrative charts</span>
            </footer>
          </>
        ) : view === "Content calendar" ? (
          <CalendarPage
            items={items}
            onOpen={setSelected}
            onCreate={(date) => {
              setComposerKeyword("");
              setComposerDate(date || "2026-09-14");
              setComposerOpen(true);
            }}
          />
        ) : view === "Content library" ? (
          <SeoWorkspace onToast={setToast} onConnections={() => navigate("Connections")} library={
            <LibraryPage
              items={items}
              setItems={setItems}
              onOpen={setSelected}
              onToast={setToast}
              onCreate={() => {
                setComposerKeyword("");
                setComposerDate("2026-09-14");
                setComposerOpen(true);
              }}
              onCalendar={() => navigate("Content calendar")}
            />
          } />
        ) : view === "Social media" ? (
          <SocialWorkspace items={items} onOpen={setSelected} onToast={setToast}
            onCreate={(date, title = "") => {
              setComposerKeyword(title);
              setComposerDate(date || "2026-09-14");
              setComposerOpen(true);
            }}
            library={
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
            } />
        ) : view === "Keyword research" ? (
          <KeywordPage
            onCreate={(keyword) => {
              setComposerKeyword(typeof keyword === "string" ? keyword : "");
              setComposerDate("2026-09-14");
              setComposerOpen(true);
            }}
            onLibrary={() => navigate("Content library")}
          />
        ) : view === "AI visibility" ? (
          <AiVisibilityEntry
            overview={<VisibilityPage onKeywords={() => navigate("Keyword research")} />}
            onSettings={() => navigate("Settings")}
            onToast={setToast}
            onCreate={(keyword) => {
              setComposerKeyword(keyword);
              setComposerDate("2026-09-14");
              setComposerOpen(true);
            }}
          />
        ) : view === "Business Profile" ? (
          <BusinessProfile onToast={setToast} />
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
                <label htmlFor="appearance">Appearance</label>
                <p>Choose a theme or match your device settings.</p>
              </div>
              <select id="appearance" value={preference} onChange={(event) => setPreference(event.target.value)}>
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
            <AiConnections />
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
                <p>You’re all caught up with the latest workspace activity.</p>
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
                    {i === 2 ? "2 days ago" : "13 hours ago"} · Source snapshot
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
                    "status-pill " + (status === "Sync overdue" ? "draft" : "")
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
      </main>
      <ContentComposer
        initialType={view === "Social media" ? "Social post" : "SEO article"}
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
              <button className="text-button" onClick={() => setSelected(null)}>
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
  );
}

createRoot(document.getElementById("root")).render(<App />);
