import React, { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  FileText,
  Globe2,
  Share2,
  Search,
  Plus,
  Sparkles,
  LayoutTemplate,
  SlidersHorizontal,
  MoreHorizontal,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export function DocumentPreview({ item, variant = 0 }) {
  return (
    <div className={`iw-preview preview-${variant % 4}`} aria-hidden="true">
      <span
        className={`iw-category ${item.type === "Social post" ? "social" : ""}`}
      >
        {item.type === "Social post" ? "Social" : "SEO content"}
      </span>
      <div className="iw-paper">
        {variant % 4 === 0 && (
          <div className="paper-cover">
            <span>LunchLink</span>
            <strong>
              Better lunches.
              <br />
              Better workdays.
            </strong>
            <div className="paper-cover-grid">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <strong>
          {variant % 4 === 1
            ? "A little inspiration for your next team lunch."
            : item.title}
        </strong>
        <p>
          {item.description ||
            "Thoughtful catering for every team. Discover practical ideas for your next office lunch."}
        </p>
        {variant % 4 === 2 ? (
          <div className="paper-callout">
            <b>Content brief</b>
            <p>Audience: workplace teams</p>
            <p>Keyword: {item.keyword}</p>
          </div>
        ) : variant % 4 === 3 ? (
          <div className="paper-columns">
            <div>
              <b>Content strategy</b>
              <span />
              <span />
              <span />
            </div>
            <div>
              <b>Next steps</b>
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          <>
            <h4>
              {variant % 4 === 1
                ? "Made for your team"
                : "Make every meal count"}
            </h4>
            <p>
              Bring people together with office catering that works for
              everyone.
            </p>
            <div className="paper-rule" />
            <div className="paper-rule short" />
          </>
        )}
      </div>
    </div>
  );
}

function WorkspaceAvatar({ small = false }) {
  return (
    <span className={`iw-avatar ${small ? "small" : ""}`} aria-hidden="true">
      L<span />
    </span>
  );
}

function ChannelIcons({ type }) {
  return (
    <span
      className="iw-channels"
      aria-label={
        type === "Social post" ? "Social media" : "Website and search"
      }
    >
      {type === "Social post" ? (
        <>
          <span>
            <Share2 size={13} />
          </span>
          <span>
            <Globe2 size={13} />
          </span>
        </>
      ) : (
        <>
          <span>
            <Globe2 size={13} />
          </span>
          <span>
            <Search size={13} />
          </span>
        </>
      )}
    </span>
  );
}

const statusClass = (s) => s.toLowerCase().replaceAll(" ", "-");
export default function InkwiseDashboard({
  items,
  query,
  onOpen,
  onNavigate,
  onCreate,
  onToast,
}) {
  const [range, setRange] = useState("All content");
  const [status, setStatus] = useState("All statuses");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = items.filter((item) => {
    const date = new Date(item.date + " 12:00:00");
    return (
      (item.title + " " + item.keyword + " " + item.type)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status) &&
      (range !== "This week" ||
        (date >= new Date("2026-09-14T00:00:00") &&
          date <= new Date("2026-09-20T23:59:59"))) &&
      (range !== "Published" || item.status === "Published")
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, totalPages - 1);
  const rows = filtered.slice(currentPage * 6, currentPage * 6 + 6);
  const recent = items
    .filter((item) =>
      (item.title + " " + item.keyword)
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 4);
  return (
    <>
      <div className="iw-heading-row">
        <h1>Good morning, LunchLink!</h1>
        <div className="iw-tools">
          <label className="iw-period">
            <CalendarDays size={17} />
            <select
              aria-label="Content date range"
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                setPage(0);
              }}
            >
              <option>All content</option>
              <option>This week</option>
              <option>Published</option>
            </select>
            <ChevronDown size={13} />
          </label>
          <button
            className="iw-tool"
            aria-label="Open content calendar"
            onClick={() => onNavigate("Content calendar")}
          >
            <CalendarDays size={17} />
            <span>Calendar</span>
          </button>
          <button
            className="iw-tool"
            aria-label="Open content library"
            onClick={() => onNavigate("Content library")}
          >
            <LayoutTemplate size={17} />
            <span>Library</span>
          </button>
          <button
            className="iw-ai-button"
            aria-label="Explore AI visibility"
            title="AI visibility"
            onClick={() => onNavigate("AI visibility")}
          >
            <Sparkles size={21} />
          </button>
          <button className="iw-new-button" onClick={onCreate}>
            <Plus size={18} />
            <span>New content</span>
          </button>
        </div>
      </div>
      <div className="iw-dashboard">
        <div className="iw-left-column">
          <section className="iw-panel iw-recent" aria-label="Recent content">
            <div className="iw-section-heading">
              <h2>Recent Content</h2>
              <button
                className="iw-square"
                aria-label="View content library"
                onClick={() => onNavigate("Content library")}
              >
                <ArrowUpRight size={19} />
              </button>
            </div>
            <div className="iw-recent-grid">
              {recent.map((item, i) => (
                <button
                  key={item.id}
                  className="iw-document"
                  onClick={() => onOpen(item)}
                >
                  <DocumentPreview item={item} variant={i} />
                  <h3 title={item.title}>{item.title}</h3>
                  <div className="iw-document-meta">
                    <WorkspaceAvatar small />
                    <span>LunchLink</span>
                    <time>{item.date.replace(", 2026", "")}</time>
                  </div>
                </button>
              ))}
              {!recent.length && (
                <p className="iw-no-recent">No content matches your search.</p>
              )}
            </div>
          </section>
          <section className="iw-panel iw-all-content" aria-label="All content">
            <div className="iw-section-heading">
              <h2>All Content</h2>
              <div className="iw-table-actions">
                <button
                  className={`iw-square ${filtersOpen ? "is-active" : ""}`}
                  aria-label="Filter content"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <SlidersHorizontal size={18} />
                  {status !== "All statuses" && <i />}
                </button>
                <button
                  className="iw-square"
                  aria-label="Open full content library"
                  onClick={() => onNavigate("Content library")}
                >
                  <ArrowUpRight size={19} />
                </button>
              </div>
            </div>
            {filtersOpen && (
              <div className="iw-filter-row">
                <label>
                  Status{" "}
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option>All statuses</option>
                    <option>Published</option>
                    <option>Scheduled</option>
                    <option>Ready for review</option>
                    <option>Draft</option>
                  </select>
                </label>
                <button
                  onClick={() => {
                    setStatus("All statuses");
                    setRange("All content");
                    setPage(0);
                  }}
                >
                  Reset filters
                </button>
                <button
                  aria-label="Close filters"
                  className="iw-square"
                  onClick={() => setFiltersOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="iw-table-scroll">
              <table className="iw-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Workspace</th>
                    <th>Scheduled for</th>
                    <th>Channels</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="iw-title-button"
                          onClick={() => onOpen(item)}
                        >
                          <FileText size={16} />
                          <span title={item.title}>{item.title}</span>
                        </button>
                      </td>
                      <td>
                        <span className="iw-owner">
                          <WorkspaceAvatar small />
                          LunchLink
                        </span>
                      </td>
                      <td>
                        <time>{item.date.replace(", 2026", "")}</time>
                      </td>
                      <td>
                        <ChannelIcons type={item.type} />
                      </td>
                      <td>
                        <span
                          className={`iw-status ${statusClass(item.status)}`}
                        >
                          {item.status === "Ready for review"
                            ? "In review"
                            : item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="iw-row-more"
                          aria-label={`Details for ${item.title}`}
                          onClick={() => onOpen(item)}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <div className="iw-empty">
                <FileText size={27} />
                <h3>No matching content</h3>
                <p>Try a different search or reset the filters.</p>
                <button
                  className="iw-tool"
                  onClick={() => {
                    setStatus("All statuses");
                    setRange("All content");
                    onToast(
                      "Use the search field above to change or clear your search.",
                    );
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
            <div className="iw-pagination">
              <span>
                {filtered.length ? currentPage * 6 + 1 : 0}–
                {Math.min((currentPage + 1) * 6, filtered.length)} of{" "}
                {filtered.length} items
              </span>
              <div>
                <button
                  aria-label="Previous content page"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  aria-label="Next content page"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
        <div className="iw-right-column">
          <section className="iw-panel iw-activity" aria-label="Activity feed">
            <div className="iw-section-heading">
              <h2>Activity Feed</h2>
              <button
                className="iw-square"
                aria-label="View all activity"
                onClick={() => onNavigate("Notifications")}
              >
                <ArrowUpRight size={19} />
              </button>
            </div>
            <p className="iw-feed-label">From your workspace</p>
            <div className="iw-activity-items">
              <button
                className="iw-feed-card"
                onClick={() =>
                  onOpen(
                    items.find((i) =>
                      i.title.toLowerCase().includes("buffet"),
                    ) || items[0],
                  )
                }
              >
                <span className="iw-feed-avatar violet">
                  <FileText size={19} />
                  <i />
                </span>
                <span>
                  <span>
                    <b>LunchLink</b> created content for{" "}
                    <strong>“buffet vs. boxed lunches”</strong>
                  </span>
                  <small>Content library</small>
                </span>
              </button>
              <button
                className="iw-feed-card"
                onClick={() => onNavigate("Social media")}
              >
                <span className="iw-feed-avatar mint">
                  <Share2 size={19} />
                  <i />
                </span>
                <span>
                  <span>
                    <b>Social content</b> is ready with{" "}
                    <strong>28 generated post sets</strong>
                  </span>
                  <small>60 topics planned</small>
                </span>
              </button>
              <button
                className="iw-feed-card"
                onClick={() => onNavigate("Keyword research")}
              >
                <span className="iw-feed-avatar sand">
                  <Search size={19} />
                  <i />
                </span>
                <span>
                  <span>
                    <b>SEO research</b> is tracking{" "}
                    <strong>132 keywords for your website</strong>
                  </span>
                  <small>24 keywords in queue</small>
                </span>
              </button>
            </div>
          </section>
          <section
            className="iw-panel iw-overview"
            aria-label="Workspace overview"
          >
            <div className="iw-section-heading">
              <h2>Workspace Overview</h2>
              <button
                className="iw-square"
                aria-label="View workspace setup"
                onClick={() => onNavigate("Settings")}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
            <button
              className="iw-gauge-button"
              onClick={() => onNavigate("Settings")}
              aria-label="Workspace setup 100 percent, 5 of 5 steps complete"
            >
              <svg
                className="iw-gauge"
                viewBox="0 0 280 165"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="gaugeBlue" x1="0" y1="1" x2="1" y2="0">
                    <stop stopColor="#aebafd" stopOpacity=".04" />
                    <stop offset="1" stopColor="#8797f0" stopOpacity=".30" />
                  </linearGradient>
                  <linearGradient id="gaugeOrange" x1="0" y1="1" x2="0" y2="0">
                    <stop stopColor="#f6d1a0" stopOpacity="0" />
                    <stop offset="1" stopColor="#f0bd81" stopOpacity=".26" />
                  </linearGradient>
                  <linearGradient id="gaugeGreen" x1="0" y1="1" x2="0" y2="0">
                    <stop stopColor="#b5dfa0" stopOpacity="0" />
                    <stop offset="1" stopColor="#9cd988" stopOpacity=".3" />
                  </linearGradient>
                </defs>
                <path
                  d="M 25 145 A 115 115 0 0 1 143 30 L 140 145 Z"
                  fill="url(#gaugeBlue)"
                />
                <path
                  d="M 151 31 A 115 115 0 0 1 204 48 L 140 145 Z"
                  fill="url(#gaugeOrange)"
                />
                <path
                  d="M 213 54 A 115 115 0 0 1 255 145 L 140 145 Z"
                  fill="url(#gaugeGreen)"
                />
                <path
                  className="gauge-blue"
                  d="M 25 145 A 115 115 0 0 1 143 30"
                />
                <path
                  className="gauge-orange"
                  d="M 152 31 A 115 115 0 0 1 203 48"
                />
                <path
                  className="gauge-green"
                  d="M 212 54 A 115 115 0 0 1 255 145"
                />
              </svg>
              <span className="iw-gauge-reading">
                <strong>100%</strong>
                <span>5 / 5 steps complete</span>
              </span>
            </button>
            <div className="iw-overview-legend">
              <button onClick={() => onNavigate("Content library")}>
                <span>
                  <i className="violet-dot" />
                  Published content
                </span>
                <strong>108 assets</strong>
              </button>
              <button onClick={() => onNavigate("Keyword research")}>
                <span>
                  <i className="orange-dot" />
                  Tracked keywords
                </span>
                <strong>132</strong>
              </button>
              <button onClick={() => onNavigate("Social media")}>
                <span>
                  <i className="green-dot" />
                  Social post sets
                </span>
                <strong>28 sets</strong>
              </button>
            </div>
          </section>
        </div>
      </div>
      <footer className="iw-footer">
        <span>
          <span className="iw-footer-logo">Uplift AI</span>
          <span className="iw-footer-separator" />
          LunchLink workspace
        </span>
        <span>Source snapshot · Sample schedules · Session-only changes</span>
      </footer>
    </>
  );
}
