import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  FileText,
  CalendarDays,
  Share2,
  Search,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Clock3,
  CircleCheck,
  LayoutGrid,
  List,
  ArrowDownToLine,
  ArrowUpDown,
  SlidersHorizontal,
  FolderOpen,
  Sparkles,
  Globe2,
  Send,
  PenLine,
  MoreHorizontal,
  CheckCheck,
  CalendarClock,
  Layers3,
} from "lucide-react";
import "./sections.css";

const statuses = ["Published", "Scheduled", "Ready for review", "Draft"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const shortDate = (d) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const keyDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseDate = (s) => new Date(s + " 12:00:00");
const statusClass = (s) => s.toLowerCase().replaceAll(" ", "-");
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function TypeIcon({ type, size = 16 }) {
  return type === "Social post" ? (
    <Share2 size={size} />
  ) : (
    <FileText size={size} />
  );
}
function Status({ value }) {
  return (
    <span className={`cs-status ${statusClass(value)}`}>
      <i />
      {value === "Ready for review" ? "In review" : value}
    </span>
  );
}
function MiniColumns({ values, color = "green" }) {
  const max = Math.max(...values, 1);
  return (
    <div className={`cs-mini-columns ${color}`} aria-hidden="true">
      {values.map((n, i) => (
        <i key={i} style={{ height: `${Math.max((n / max) * 100, 8)}%` }} />
      ))}
    </div>
  );
}
export function Stat({
  label,
  value,
  description,
  icon: Icon,
  color = "green",
  values = [3, 5, 4, 7, 6, 8, 10],
}) {
  return (
    <div className="cs-stat panel">
      <div className="cs-stat-heading">
        <span>{label}</span>
        <span className={`cs-soft-icon ${color}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="cs-stat-value">
        <div>
          <strong>{value}</strong>
          <p>{description}</p>
        </div>
        <MiniColumns values={values} color={color} />
      </div>
    </div>
  );
}
function Empty({
  title = "No content found",
  description = "Try another search or reset your filters.",
  onReset,
}) {
  return (
    <div className="cs-empty">
      <span>
        <FolderOpen size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onReset && (
        <button className="cs-button" onClick={onReset}>
          Reset filters
        </button>
      )}
    </div>
  );
}
function downloadRows(rows, onToast) {
  const fields = ["title", "type", "date", "time", "status", "keyword"];
  const cell = (value) => {
    let v = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replaceAll('"', '""') + '"';
  };
  let url = URL.createObjectURL(
    new Blob(
      [
        fields.join(",") +
          "\n" +
          rows
            .map((row) => fields.map((f) => cell(row[f])).join(","))
            .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  let a = document.createElement("a");
  a.href = url;
  a.download = "uplift-content.csv";
  a.click();
  URL.revokeObjectURL(url);
  onToast(
    `${rows.length} content ${rows.length === 1 ? "item" : "items"} exported.`,
  );
}
export function ContentComposer({
  open,
  onClose,
  onSave,
  initialDate,
  initialKeyword = "",
}) {
  const ref = useRef(null);
  const [title, setTitle] = useState(""),
    [type, setType] = useState("SEO article"),
    [status, setStatus] = useState("Draft"),
    [date, setDate] = useState(""),
    [time, setTime] = useState("08:00"),
    [keyword, setKeyword] = useState("");
  useEffect(() => {
    if (open) {
      setTitle(initialKeyword);
      setKeyword(initialKeyword);
      setStatus("Draft");
      setDate(initialDate || "2026-09-14");
      ref.current?.showModal();
    } else ref.current?.close();
  }, [open, initialDate, initialKeyword]);
  function save(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const [h, m] = time.split(":").map(Number);
    onSave({
      id: Date.now(),
      title: title.trim(),
      type,
      status,
      date: shortDate(new Date(date + "T12:00:00")),
      time: `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`,
      keyword: keyword.trim() || title.trim().toLowerCase(),
      volume: 0,
      tone: type === "SEO article" ? "purple" : "green",
      description:
        "New content planned in this local preview. Add the full content in your connected Uplift workspace.",
    });
    onClose();
  }
  return (
    <dialog
      className="cs-composer"
      ref={ref}
      aria-labelledby="composer-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <form onSubmit={save}>
        <div className="cs-modal-title">
          <span className="cs-soft-icon purple">
            <PenLine size={20} />
          </span>
          <button
            type="button"
            className="cs-icon-button"
            aria-label="Close new content"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <h2 id="composer-title">Plan something worth finding.</h2>
        <p>Add an article or social post to your workspace.</p>
        <label>
          Content title
          <input
            required
            maxLength={140}
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What would you like to create?"
          />
        </label>
        <div className="cs-form-pair">
          <label>
            Content type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>SEO article</option>
              <option>Social post</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Draft</option>
              <option>Ready for review</option>
              <option>Scheduled</option>
            </select>
          </label>
        </div>
        <label>
          Target keyword <span>(optional)</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. office lunch catering"
          />
        </label>
        <div className="cs-form-pair">
          <label>
            Planned date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <div className="cs-form-note">
          <CircleCheck size={15} />
          <span>Saved in this preview only. Nothing is published.</span>
        </div>
        <div className="cs-modal-actions">
          <button type="button" className="cs-button" onClick={onClose}>
            Cancel
          </button>
          <button className="cs-button filled" type="submit">
            <Plus size={15} />
            Add content
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function LibraryPage({
  items,
  setItems,
  onOpen,
  onToast,
  onCreate,
  socialOnly = false,
  onCalendar,
}) {
  const [tab, setTab] = useState("All content"),
    [status, setStatus] = useState("All statuses"),
    [query, setQuery] = useState(""),
    [layout, setLayout] = useState("List"),
    [sort, setSort] = useState("Newest first"),
    [selected, setSelected] = useState([]);
  const base = useMemo(
    () => items.filter((i) => !socialOnly || i.type === "Social post"),
    [items, socialOnly],
  );
  const counts = Object.fromEntries(
    statuses.map((s) => [s, base.filter((i) => i.status === s).length]),
  );
  const filtered = useMemo(
    () =>
      base
        .filter(
          (i) =>
            (tab === "All content" ||
              (tab === "Articles"
                ? i.type === "SEO article"
                : i.type === "Social post")) &&
            (status === "All statuses" || i.status === status) &&
            (i.title + " " + i.keyword)
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Title A–Z"
            ? a.title.localeCompare(b.title)
            : (sort === "Newest first" ? -1 : 1) *
              (parseDate(a.date) - parseDate(b.date)),
        ),
    [base, tab, status, query, sort],
  );
  const allSelected =
    filtered.length > 0 && filtered.every((i) => selected.includes(i.id));
  function toggle(id) {
    setSelected((old) =>
      old.includes(id) ? old.filter((v) => v !== id) : [...old, id],
    );
  }
  function review() {
    setItems((old) =>
      old.map((i) =>
        selected.includes(i.id) && i.status !== "Published"
          ? { ...i, status: "Ready for review" }
          : i,
      ),
    );
    setSelected([]);
    onToast("Selected unpublished content marked ready for review.");
  }
  function reset() {
    setQuery("");
    setStatus("All statuses");
    setTab("All content");
  }
  const articleCount = base.filter((i) => i.type === "SEO article").length;
  return (
    <div className="cs-page">
      <div className="cs-page-intro">
        <div>
          <h2>
            {socialOnly
              ? "A little more social. A lot more connected."
              : "A home for every good idea."}
          </h2>
          <p>
            {socialOnly
              ? "Review and organize your coordinated social content."
              : "Create, organize, and keep your content moving."}
          </p>
        </div>
        <button className="cs-button filled" onClick={() => onCreate()}>
          <Plus size={16} />
          New content
        </button>
      </div>
      <section className="cs-stats" aria-label="Content library analytics">
        <Stat
          label={socialOnly ? "Social content" : "Library content"}
          value={base.length}
          description="Items in this preview"
          icon={Layers3}
          color="purple"
          values={[articleCount, base.length - articleCount]}
        />
        <Stat
          label="Published"
          value={counts.Published}
          description="Ready for the world"
          icon={Globe2}
          values={statuses.map((s) => counts[s])}
        />
        <Stat
          label="In review"
          value={counts["Ready for review"]}
          description="A fresh pair of eyes needed"
          icon={FileText}
          color="gold"
          values={[counts.Draft, counts["Ready for review"]]}
        />
        <Stat
          label="Scheduled"
          value={counts.Scheduled}
          description="Next up in your calendar"
          icon={CalendarClock}
          color="blue"
          values={[counts.Published, counts.Scheduled]}
        />
      </section>
      <div className="cs-library-layout">
        <section className="cs-library panel">
          <div className="cs-library-header">
            <div className="cs-tabs" aria-label="Content type">
              {(socialOnly
                ? ["All content"]
                : ["All content", "Articles", "Social posts"]
              ).map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  aria-pressed={tab === t}
                  onClick={() => {
                    setTab(t);
                    setSelected([]);
                  }}
                >
                  {t}
                  <span>
                    {t === "All content"
                      ? base.length
                      : t === "Articles"
                        ? articleCount
                        : base.length - articleCount}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="cs-icon-button"
              title="Export visible content"
              aria-label="Export visible content"
              onClick={() => downloadRows(filtered, onToast)}
            >
              <ArrowDownToLine size={17} />
            </button>
          </div>
          <div className="cs-library-tools">
            <label className="cs-search">
              <Search size={16} />
              <input
                placeholder="Find a title or keyword…"
                aria-label="Search library content"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected([]);
                }}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={13} />
                </button>
              )}
            </label>
            <label className="cs-select">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Filter library status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setSelected([]);
                }}
              >
                <option>All statuses</option>
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <div className="cs-view-toggle" aria-label="Library layout">
              <button
                aria-label="List view"
                aria-pressed={layout === "List"}
                className={layout === "List" ? "active" : ""}
                onClick={() => setLayout("List")}
              >
                <List size={17} />
              </button>
              <button
                aria-label="Grid view"
                aria-pressed={layout === "Grid"}
                className={layout === "Grid" ? "active" : ""}
                onClick={() => setLayout("Grid")}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
          <div className="cs-results-line">
            <span>
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
              {query ? " matching your search" : ""}
            </span>
            <label>
              <ArrowUpDown size={12} />
              <select
                aria-label="Sort content"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Newest first</option>
                <option>Oldest first</option>
                <option>Title A–Z</option>
              </select>
            </label>
          </div>
          {selected.length > 0 && (
            <div className="cs-selection-bar">
              <span>{selected.length} selected</span>
              <button onClick={review}>
                <CheckCheck size={14} />
                Mark for review
              </button>
              <button
                onClick={() =>
                  downloadRows(
                    base.filter((i) => selected.includes(i.id)),
                    onToast,
                  )
                }
              >
                <ArrowDownToLine size={14} />
                Export
              </button>
              <button
                aria-label="Clear selection"
                onClick={() => setSelected([])}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {!filtered.length ? (
            <Empty onReset={reset} />
          ) : layout === "List" ? (
            <div className="cs-table-wrap">
              <table className="cs-library-table">
                <thead>
                  <tr>
                    <th className="cs-check-cell">
                      <input
                        type="checkbox"
                        aria-label="Select all visible content"
                        checked={allSelected}
                        onChange={() =>
                          setSelected(
                            allSelected ? [] : filtered.map((i) => i.id),
                          )
                        }
                      />
                    </th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Search volume</th>
                    <th>Planned date</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selected.includes(item.id) ? "is-selected" : ""
                      }
                    >
                      <td className="cs-check-cell">
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.title}`}
                          checked={selected.includes(item.id)}
                          onChange={() => toggle(item.id)}
                        />
                      </td>
                      <td>
                        <button
                          className="cs-content-title"
                          onClick={() => onOpen(item)}
                        >
                          <span
                            className={`cs-document-icon ${item.type === "Social post" ? "green" : "purple"}`}
                          >
                            <TypeIcon type={item.type} />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>
                              {item.type}
                              <i />
                              LunchLink
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <Status value={item.status} />
                      </td>
                      <td className="cs-volume">
                        {item.volume ? item.volume.toLocaleString() : "—"}
                        <span>{item.volume ? "/ mo" : ""}</span>
                      </td>
                      <td className="cs-date-cell">
                        {item.date.replace(", 2026", "")}
                        <small>{item.time}</small>
                      </td>
                      <td>
                        <button
                          className="cs-icon-button row-open"
                          aria-label={`Open ${item.title}`}
                          onClick={() => onOpen(item)}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cs-asset-grid">
              {filtered.map((item) => (
                <button
                  className="cs-asset-card"
                  key={item.id}
                  onClick={() => onOpen(item)}
                >
                  <div
                    className={`cs-document-preview ${item.type === "Social post" ? "green" : item.tone}`}
                  >
                    <span className="cs-preview-paper">
                      <TypeIcon type={item.type} size={19} />
                      <b>{item.title}</b>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="cs-preview-type">
                      <TypeIcon type={item.type} size={12} />
                      {item.type}
                    </span>
                  </div>
                  <div className="cs-asset-info">
                    <Status value={item.status} />
                    <h3>{item.title}</h3>
                    <p>
                      {item.date}
                      <ArrowUpRight size={14} />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="cs-library-footer">
            <span>
              Showing {filtered.length} of {base.length} preview items
            </span>
            <span>
              <CircleCheck size={12} />
              All changes stay in this session
            </span>
          </div>
        </section>
        <aside className="cs-library-aside">
          <section className="panel cs-breakdown">
            <div className="cs-section-heading">
              <h3>Content at a glance</h3>
              <Layers3 size={16} />
            </div>
            <div className="cs-breakdown-number">
              <strong>{base.length}</strong>
              <span>ideas taking shape</span>
            </div>
            <div
              className="cs-stacked-bar"
              aria-label={`${articleCount} articles, ${base.length - articleCount} social posts`}
            >
              <span
                style={{
                  width: `${(articleCount / Math.max(base.length, 1)) * 100}%`,
                }}
              />
              <span
                style={{
                  width: `${((base.length - articleCount) / Math.max(base.length, 1)) * 100}%`,
                }}
              />
            </div>
            <button
              className="cs-breakdown-row"
              onClick={() => {
                setTab(socialOnly ? "All content" : "Articles");
                setStatus("All statuses");
              }}
            >
              <span>
                <i className="purple" />
                {socialOnly ? "Social posts" : "SEO articles"}
              </span>
              <b>{socialOnly ? base.length : articleCount}</b>
            </button>
            {!socialOnly && (
              <button
                className="cs-breakdown-row"
                onClick={() => {
                  setTab("Social posts");
                  setStatus("All statuses");
                }}
              >
                <span>
                  <i className="green" />
                  Social posts
                </span>
                <b>{base.length - articleCount}</b>
              </button>
            )}
            <div className="cs-soft-divider" />
            <div className="cs-section-heading">
              <h3>Workflow</h3>
              <span>{base.length} total</span>
            </div>
            {statuses.map((s) => (
              <button
                className="cs-workflow-row"
                key={s}
                onClick={() => {
                  setStatus(s);
                  setTab("All content");
                }}
              >
                <Status value={s} />
                <span>{counts[s]}</span>
                <ChevronRight size={13} />
              </button>
            ))}
          </section>
          <section className="panel cs-collections">
            <div className="cs-section-heading">
              <h3>Collections</h3>
              <FolderOpen size={16} />
            </div>
            {[
              { name: "Office catering", q: "catering", color: "purple" },
              { name: "Menus & dietary needs", q: "menu", color: "green" },
              { name: "Team lunches", q: "lunch", color: "gold" },
            ].map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setQuery(c.q);
                  setTab("All content");
                  setStatus("All statuses");
                }}
              >
                <span className={`cs-folder ${c.color}`}>
                  <FolderOpen size={18} />
                </span>
                <span>
                  {c.name}
                  <small>
                    {
                      base.filter((i) =>
                        (i.title + " " + i.keyword).toLowerCase().includes(c.q),
                      ).length
                    }{" "}
                    items
                  </small>
                </span>
                <ChevronRight size={13} />
              </button>
            ))}
          </section>
          <button className="cs-calendar-link" onClick={onCalendar}>
            <span className="cs-soft-icon purple">
              <CalendarDays size={20} />
            </span>
            <h3>Make room for your next idea.</h3>
            <p>See what’s coming up and plan your next content batch.</p>
            <span>
              Open calendar <ArrowUpRight size={15} />
            </span>
          </button>
        </aside>
      </div>
      <div className="cs-page-footer">
        <span>
          <i />
          LunchLink workspace
        </span>
        <span>Demo content · Illustrative records · Session-only changes</span>
      </div>
    </div>
  );
}
export function CalendarPage({ items, onOpen, onCreate }) {
  const [month, setMonth] = useState(new Date(2026, 8, 1)),
    [selectedDate, setSelectedDate] = useState("2026-09-14"),
    [mode, setMode] = useState("Month"),
    [type, setType] = useState("All content");
  const todayKey = keyDate(new Date());
  const filtered = items.filter(
    (i) =>
      type === "All content" ||
      i.type === (type === "Articles" ? "SEO article" : "Social post"),
  );
  const selectedDay = new Date(selectedDate + "T12:00:00");
  const monthItems = filtered.filter((i) => {
    const d = parseDate(i.date);
    return (
      d.getMonth() === month.getMonth() &&
      d.getFullYear() === month.getFullYear()
    );
  });
  const groups = new Map();
  filtered.forEach((i) => {
    const key = keyDate(parseDate(i.date));
    groups.set(key, [...(groups.get(key) || []), i]);
  });
  const dayItems = (groups.get(selectedDate) || []).sort(
    (a, b) =>
      new Date(`Jan 1, 2000 ${a.time}`) - new Date(`Jan 1, 2000 ${b.time}`),
  );
  const counts = Object.fromEntries(
    statuses.map((s) => [s, monthItems.filter((i) => i.status === s).length]),
  );
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(1 - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  if (
    days[34].getMonth() === month.getMonth() &&
    days[34].getDate() <
      new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  ) {
    for (let i = 35; i < 42; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
  }
  const weekStart = new Date(selectedDay);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    let d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekTotals = weekDays.map((d) => (groups.get(keyDate(d)) || []).length);
  function step(direction) {
    if (mode === "Week") {
      let d = new Date(selectedDay);
      d.setDate(d.getDate() + direction * 7);
      setSelectedDate(keyDate(d));
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      let d = new Date(month.getFullYear(), month.getMonth() + direction, 1);
      setMonth(d);
      setSelectedDate(keyDate(d));
    }
  }
  function goToday() {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(keyDate(d));
  }
  return (
    <div className="cs-page">
      <div className="cs-page-intro">
        <div>
          <h2>A clear view of what’s next.</h2>
          <p>Give every article and social post its moment.</p>
        </div>
        <button
          className="cs-button filled"
          onClick={() => onCreate(selectedDate)}
        >
          <Plus size={16} />
          Plan content
        </button>
      </div>
      <section
        className="cs-stats calendar-stats"
        aria-label="Calendar analytics"
      >
        <Stat
          label="Planned this month"
          value={monthItems.length}
          description={`${monthNames[month.getMonth()]} ${month.getFullYear()} · All statuses`}
          icon={CalendarDays}
          color="purple"
          values={weekTotals}
        />
        <Stat
          label="Scheduled to publish"
          value={counts.Scheduled}
          description="In your selected month"
          icon={Send}
          color="green"
          values={[counts.Published, counts.Scheduled]}
        />
        <Stat
          label="Awaiting review"
          value={counts["Ready for review"]}
          description="A little polish before publishing"
          icon={PenLine}
          color="gold"
          values={[counts.Draft, counts["Ready for review"]]}
        />
        <Stat
          label="Published this month"
          value={counts.Published}
          description="Content that’s already out there"
          icon={CircleCheck}
          color="blue"
          values={weekTotals}
        />
      </section>
      <div className="cs-calendar-layout">
        <section className="cs-calendar panel">
          <div className="cs-calendar-toolbar">
            <div className="cs-month-nav">
              <h3>
                {monthNames[month.getMonth()]}{" "}
                <span>{month.getFullYear()}</span>
              </h3>
              <div>
                <button
                  className="cs-icon-button"
                  aria-label={
                    mode === "Week" ? "Previous week" : "Previous month"
                  }
                  onClick={() => step(-1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  className="cs-icon-button"
                  aria-label={mode === "Week" ? "Next week" : "Next month"}
                  onClick={() => step(1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
              <button className="cs-button today" onClick={goToday}>
                Today
              </button>
            </div>
            <div className="cs-mode-toggle" aria-label="Calendar view">
              {["Month", "Week", "Agenda"].map((v) => (
                <button
                  key={v}
                  className={mode === v ? "active" : ""}
                  aria-pressed={mode === v}
                  onClick={() => setMode(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="cs-calendar-filter">
            <div
              className="cs-channel-filters"
              aria-label="Calendar content type"
            >
              {["All content", "Articles", "Social posts"].map((t) => (
                <button
                  key={t}
                  aria-pressed={type === t}
                  className={type === t ? "active" : ""}
                  onClick={() => setType(t)}
                >
                  {t !== "All content" && (
                    <i className={t === "Articles" ? "purple" : "green"} />
                  )}{" "}
                  {t}
                </button>
              ))}
            </div>
            <span className="cs-timezone">
              <Clock3 size={12} />
              Workspace time
            </span>
          </div>
          {mode === "Month" ? (
            <div className="cs-month-grid">
              <div className="cs-weekdays">
                {dayNames.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="cs-day-grid">
                {days.map((d) => {
                  const key = keyDate(d),
                    events = groups.get(key) || [],
                    outside = d.getMonth() !== month.getMonth();
                  return (
                    <div
                      key={key}
                      className={`cs-day ${outside ? "outside" : ""} ${key === selectedDate ? "selected" : ""} ${key === todayKey ? "today" : ""}`}
                    >
                      <button
                        className="cs-day-select"
                        aria-label={`Select ${shortDate(d)}, ${events.length} content items`}
                        aria-pressed={key === selectedDate}
                        onClick={() => {
                          setSelectedDate(key);
                          if (outside)
                            setMonth(
                              new Date(d.getFullYear(), d.getMonth(), 1),
                            );
                        }}
                      >
                        <span>{d.getDate()}</span>
                        {events.length > 0 && <small>{events.length}</small>}
                      </button>
                      <div className="cs-day-events">
                        {events.slice(0, 2).map((e) => (
                          <button
                            key={e.id}
                            className={`cs-event ${e.type === "Social post" ? "social" : "article"} ${e.status === "Published" ? "published" : ""}`}
                            onClick={() => {
                              setSelectedDate(key);
                              onOpen(e);
                            }}
                            title={`${e.title} · ${e.status}`}
                          >
                            <span>
                              <TypeIcon type={e.type} size={10} />
                              {e.time
                                .replace(" AM", "a")
                                .replace(" PM", "p")
                                .replace(":00", "")}
                              {e.status === "Published" && (
                                <Check size={10} aria-label="Published" />
                              )}
                            </span>
                            <strong>{e.title}</strong>
                          </button>
                        ))}
                        {events.length > 2 && (
                          <button
                            className="cs-more-events"
                            onClick={() => setSelectedDate(key)}
                          >
                            +{events.length - 2} more
                          </button>
                        )}
                      </div>
                      <div className="cs-mobile-dots">
                        {events.slice(0, 3).map((e) => (
                          <i
                            key={e.id}
                            className={
                              e.type === "Social post" ? "green" : "purple"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : mode === "Week" ? (
            <div className="cs-week-view">
              {weekDays.map((d) => {
                const key = keyDate(d);
                return (
                  <section
                    key={key}
                    className={key === selectedDate ? "selected" : ""}
                  >
                    <button
                      className="cs-week-heading"
                      aria-pressed={key === selectedDate}
                      onClick={() => setSelectedDate(key)}
                    >
                      {dayNames[(d.getDay() + 6) % 7]}
                      <strong>{d.getDate()}</strong>
                    </button>
                    <div>
                      {(groups.get(key) || []).map((e) => (
                        <button
                          className={`cs-event ${e.type === "Social post" ? "social" : "article"}`}
                          key={e.id}
                          onClick={() => onOpen(e)}
                        >
                          <span>
                            <TypeIcon type={e.type} size={11} />
                            {e.time}
                          </span>
                          <strong>{e.title}</strong>
                          <small>{e.status}</small>
                        </button>
                      ))}
                      <button
                        className="cs-week-add"
                        aria-label={`Add content on ${shortDate(d)}`}
                        onClick={() => onCreate(key)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="cs-agenda-list">
              {monthItems.length ? (
                Array.from(
                  new Set(monthItems.map((i) => keyDate(parseDate(i.date)))),
                )
                  .sort()
                  .map((key) => (
                    <div className="cs-agenda-group" key={key}>
                      <div>
                        <strong>{new Date(key + "T12:00:00").getDate()}</strong>
                        <span>
                          {new Date(key + "T12:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "short" },
                          )}
                        </span>
                      </div>
                      <section>
                        {(groups.get(key) || []).map((e) => (
                          <button key={e.id} onClick={() => onOpen(e)}>
                            <span
                              className={`cs-document-icon ${e.type === "Social post" ? "green" : "purple"}`}
                            >
                              <TypeIcon type={e.type} />
                            </span>
                            <span>
                              <strong>{e.title}</strong>
                              <small>
                                {e.type} · {e.time}
                              </small>
                            </span>
                            <Status value={e.status} />
                            <ArrowUpRight size={15} />
                          </button>
                        ))}
                      </section>
                    </div>
                  ))
              ) : (
                <Empty
                  title="A fresh month, full of possibilities."
                  description="Plan your first piece of content for this month."
                />
              )}
            </div>
          )}
          <div className="cs-calendar-footer">
            <span>
              <i className="purple" />
              SEO articles
            </span>
            <span>
              <i className="green" />
              Social posts
            </span>
            <span>Select a day to see its agenda</span>
          </div>
        </section>
        <aside className="cs-calendar-aside">
          <section className="panel cs-day-agenda">
            <div className="cs-section-heading">
              <h3>
                {selectedDay.toLocaleDateString("en-US", { weekday: "long" })}
              </h3>
              <span className="cs-count-pill">
                {dayItems.length} {dayItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="cs-selected-date">
              {selectedDay.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
              <span>{selectedDay.getFullYear()}</span>
            </div>
            <div className="cs-agenda-divider" />
            {dayItems.length ? (
              dayItems.map((e) => (
                <button
                  className="cs-day-item"
                  key={e.id}
                  onClick={() => onOpen(e)}
                >
                  <span className="cs-day-time">
                    <i />
                    {e.time}
                  </span>
                  <span
                    className={`cs-day-item-body ${e.type === "Social post" ? "green" : "purple"}`}
                  >
                    <span className="cs-day-item-type">
                      <TypeIcon type={e.type} size={14} />
                      {e.type}
                      <ArrowUpRight size={14} />
                    </span>
                    <strong>{e.title}</strong>
                    <Status value={e.status} />
                    <span className="cs-day-workspace">
                      <Globe2 size={12} />
                      LunchLink
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="cs-day-empty">
                <CalendarDays size={24} />
                <h4>Room for something new</h4>
                <p>No content planned for this day.</p>
              </div>
            )}
            <button
              className="cs-add-day"
              onClick={() => onCreate(selectedDate)}
            >
              <Plus size={15} />
              Add content to this day
            </button>
          </section>
          <section className="panel cs-week-pulse">
            <div className="cs-section-heading">
              <h3>This week’s rhythm</h3>
              <span className="cs-soft-icon green">
                <TrendingIcon />
              </span>
            </div>
            <p>
              <strong>{weekTotals.reduce((a, b) => a + b, 0)}</strong> planned
              pieces
            </p>
            <div className="cs-week-bars">
              {weekTotals.map((n, i) => (
                <div key={i}>
                  <div>
                    <span
                      style={{
                        height: `${(n / Math.max(...weekTotals, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{dayNames[i][0]}</span>
                </div>
              ))}
            </div>
            <div className="cs-pulse-note">
              Week of{" "}
              {weekDays[0].toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              · all statuses
            </div>
          </section>
          <div className="cs-calendar-tip">
            <Sparkles size={18} />
            <p>
              A consistent rhythm starts with a plan.
              <br />
              <span>Your next idea has a place here.</span>
            </p>
          </div>
        </aside>
      </div>
      <div className="cs-page-footer">
        <span>
          <i />
          LunchLink workspace
        </span>
        <span>Illustrative schedule · Session-only changes</span>
      </div>
    </div>
  );
}
function TrendingIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m3 17 6-6 4 4 8-10M15 5h6v6" />
    </svg>
  );
}
