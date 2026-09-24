import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  BarChart3,
  Eye,
  Link2,
  Filter,
  Hash,
  MessageCircle,
  PieChart,
  Globe2,
  Layers,
  GitBranch,
  Search,
  Download,
  X,
  ArrowUpRight,
  Plus,
  Minus,
  Check,
  ChevronRight,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { MentionsPage } from "./MentionsPage";
import { resolveBrandDomain } from "./brand-domains";
import { reportMetrics } from "./ai-insights-data";
import {
  pct,
  norm,
  unique,
  brandRows,
  bucketRows,
  sentimentData,
  sourceRows,
  topicRows,
  fanoutRows,
  domainOf,
} from "./insight-pages-data";
import "./insight-pages.css";
const colors = [
  "var(--d2-purple-ink,#8b80cd)",
  "#85b4cf",
  "#91b67d",
  "#d4b674",
  "#cc8fa5",
  "#7cacaa",
];
const num = (v) => (Number.isFinite(v) ? v.toFixed(1) : "—");
function LinkedAnswer({text}) {
  const pieces=[], pattern=/\[([^\]]{1,220})\]\((https?:\/\/[^\s)]+)\)/g;
  let end=0, match;
  while ((match=pattern.exec(text))) {
    if(match.index>end)pieces.push(text.slice(end,match.index));
    try {
      const url=new URL(match[2]);
      if(!url.username&&!url.password)pieces.push(<a key={match.index} href={url.href} target="_blank" rel="noopener noreferrer">{match[1]} ↗</a>);
      else pieces.push(match[0]);
    } catch { pieces.push(match[0]); }
    end=pattern.lastIndex;
  }
  if(end<text.length)pieces.push(text.slice(end));
  return <>{pieces}</>;
}
function exportRows(name, rows) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Card({
  title,
  note,
  icon: Icon = Activity,
  actions,
  footer,
  children,
  className = "",
}) {
  return (
    <section className={`ip-card ${className}`}>
      <header>
        <Icon size={17} />
        <h3>{title}</h3>
        {note && <span>{note}</span>}
        <div className="ip-actions">{actions}</div>
      </header>
      <div className="ip-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
function Empty({ children = "No observations match these filters." }) {
  return (
    <div className="ip-empty">
      <Activity size={24} />
      <p>{children}</p>
    </div>
  );
}
function SearchField({ value, onChange, label }) {
  return (
    <label className="ip-search">
      <Search size={14} />
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Switch({ value, onChange, labels = ["Line chart", "Bar chart"] }) {
  return (
    <div className="ip-switch">
      {labels.map((l, i) => (
        <button
          key={l}
          aria-label={l}
          aria-pressed={value === i}
          onClick={() => onChange(i)}
        >
          {i ? <BarChart3 size={15} /> : <Activity size={15} />}
        </button>
      ))}
    </div>
  );
}
function Table({ headers, children }) {
  return (
    <div
      className="ip-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={headers.filter((h) => typeof h === "string").join(", ")}
    >
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Chart({ series, mode = 0, percent = false, onPoint }) {
  const dates = unique(
      series.flatMap((s) => s.points.map((p) => p.date)),
    ).sort(),
    max = percent
      ? 100
      : Math.max(
          1,
          ...series.flatMap((s) => s.points.map((p) => p.value || 0)),
        );
  if (!dates.length) return <Empty />;
  const x = (i) =>
      52 + (dates.length === 1 ? 252 : (i / (dates.length - 1)) * 504),
    y = (v) => 190 - (v / max) * 150;
  return (
    <div className="ip-chart">
      <svg
        viewBox="0 0 620 230"
        role="img"
        aria-label={series
          .map(
            (s) =>
              s.name +
              ": " +
              s.points.map((p) => p.date + " " + num(p.value)).join(", "),
          )
          .join("; ")}
      >
        {(percent || max > 4
          ? [0, 0.25, 0.5, 0.75, 1]
          : Array.from({ length: Math.ceil(max) + 1 }, (_, i) => i / max)
        ).map((t) => (
          <g key={t}>
            <line x1="48" x2="585" y1={y(max * t)} y2={y(max * t)} />
            <text x="5" y={y(max * t) + 4}>
              {Math.round(max * t)}
              {percent ? "%" : ""}
            </text>
          </g>
        ))}
        {series.map((s, j) => {
          const points = s.points.filter((p) => p.value !== null);
          return (
            <g key={s.name} style={{ color: colors[j % colors.length] }}>
              {!mode && (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  points={points
                    .map((p) => `${x(dates.indexOf(p.date))},${y(p.value)}`)
                    .join(" ")}
                />
              )}
              {points.map((p) => (
                <g
                  key={p.date}
                  onClick={() => onPoint?.(p.date, s.name)}
                  role={onPoint ? "button" : undefined}
                  tabIndex={onPoint ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onPoint && ["Enter", " "].includes(e.key)) {
                      e.preventDefault();
                      onPoint(p.date, s.name);
                    }
                  }}
                >
                  <title>
                    {s.name} · {p.date}: {num(p.value)}
                    {percent ? "%" : ""}
                  </title>
                  {mode ? (
                    <rect
                      x={x(dates.indexOf(p.date)) - 15 + j * 12}
                      y={y(p.value)}
                      width={Math.max(
                        5,
                        Math.min(28, 350 / (dates.length * series.length)),
                      )}
                      height={190 - y(p.value)}
                      rx="3"
                      fill="currentColor"
                    />
                  ) : (
                    <circle
                      cx={x(dates.indexOf(p.date))}
                      cy={y(p.value)}
                      r="4"
                      fill="currentColor"
                    />
                  )}
                </g>
              ))}
            </g>
          );
        })}
        {dates
          .filter(
            (_, i) =>
              i === 0 ||
              i === dates.length - 1 ||
              i === Math.floor(dates.length / 2),
          )
          .map((d) => (
            <text key={d} x={x(dates.indexOf(d))} y="216" textAnchor="middle">
              {d.slice(5)}
            </text>
          ))}
      </svg>
      {series.length > 1 && (
        <div className="ip-legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <i style={{ background: colors[i % colors.length] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
function Brand({ name, business, rows }) {
  return (
    <span className="ip-brand">
      <BrandLogo
        name={name}
        domain={
          name === business.name
            ? business.domain
            : resolveBrandDomain(
                name,
                rows.flatMap((r) => r.sources || []),
              )
        }
      />
      {name}
    </span>
  );
}
function Drawer({ detail, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="ip-drawer" onCancel={onClose}>
      <header>
        <div>
          <span>AI Insights</span>
          <h2>{detail.title}</h2>
        </div>
        <button aria-label="Close details" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="ip-drawer-body">{detail.content}</div>
    </dialog>
  );
}
function AnswerList({ rows, business, brand, onAnswer }) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("All responses"),
    [group, setGroup] = useState(true),
    [sort, setSort] = useState("Created"),
    [direction, setDirection] = useState(-1),
    [page, setPage] = useState(0);
  let list = rows.filter(
    (r) =>
      `${r.prompt} ${r.answer} ${r.engine}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "All responses" ||
        (filter === "Mentioned" && r.mentioned) ||
        (filter === "Not mentioned" && !r.mentioned) ||
        (filter === "Cited" && r.cited)),
  );
  const val = (r) =>
    sort === "Created"
      ? Date.parse(r.at)
      : sort === "Position"
        ? (r.position ?? Infinity)
        : sort === "Mentioned"
          ? +r.mentioned
          : sort === "Cited"
            ? +r.cited
            : sort === "Sources"
              ? (r.sources || []).length
              : (r.competitors || []).length;
  list.sort((a, b) => direction * (val(a) - val(b)));
  const pages = Math.max(1, Math.ceil(list.length / 20)),
    current = Math.min(page, pages - 1),
    slice = list.slice(current * 20, current * 20 + 20),
    groups = group ? unique(slice.map((r) => r.prompt)) : ["All responses"];
  const setSorting = (s) => {
    setSort(s);
    setDirection(sort === s ? -direction : -1);
  };
  return (
    <Card
      title="All Responses"
      icon={MessageCircle}
      note={`${list.length} collected answers`}
      actions={
        <>
          <SearchField
            label="Search responses"
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(0);
            }}
          />
          <button aria-pressed={group} onClick={() => setGroup(!group)}>
            Group: {group ? "Prompt" : "None"}
          </button>
          <select
            aria-label="Response filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          >
            {["All responses", "Mentioned", "Not mentioned", "Cited"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
          <button onClick={() => exportRows("ai-responses", list)}>
            <Download size={14} />
            Export
          </button>
        </>
      }
      footer={
        <>
          <span>
            {list.length ? current * 20 + 1 : 0}–
            {Math.min((current + 1) * 20, list.length)} of {list.length}{" "}
            responses
          </span>
          <span>
            <button disabled={!current} onClick={() => setPage(current - 1)}>
              Previous
            </button>
            <button
              disabled={current + 1 >= pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </button>
          </span>
        </>
      }
    >
      <Table
        headers={[
          "AI response",
          ...[
            "Mentioned",
            "Cited",
            "Position",
            "Mentions",
            "Sources",
            "Created",
          ].map((h) => (
            <button onClick={() => setSorting(h)}>
              {h} {sort === h ? (direction === 1 ? "↑" : "↓") : "↕"}
            </button>
          )),
        ]}
      >
        {groups.map((g) => (
          <React.Fragment key={g}>
            {group && (
              <tr className="ip-group">
                <td colSpan="7">
                  <strong>{g}</strong>
                  <span>
                    {list.filter((r) => r.prompt === g).length} responses
                  </span>
                </td>
              </tr>
            )}
            {slice
              .filter((r) => !group || r.prompt === g)
              .map((r) => (
                <tr key={r.id}>
                  <td>
                    <button className="ip-response" onClick={() => onAnswer(r)}>
                      <small>{r.engine}</small>
                      <span>{r.answer}</span>
                    </button>
                  </td>
                  <td>
                    <span
                      className={r.mentioned ? "ip-positive" : "ip-negative"}
                    >
                      {r.mentioned ? "● Yes" : "● No"}
                    </span>
                  </td>
                  <td>{r.cited === null ? "—" : r.cited ? "● Yes" : "No"}</td>
                  <td>{r.position ? "#" + r.position : "—"}</td>
                  <td>
                    <button
                      className="ip-logo-stack"
                      onClick={() => onAnswer(r)}
                      aria-label="View mentioned brands"
                    >
                      {(r.mentioned
                        ? [brand, ...(r.competitors || [])]
                        : r.competitors || []
                      )
                        .slice(0, 4)
                        .map((n) => (
                          <BrandLogo
                            key={n}
                            name={n}
                            domain={
                              n === business.name
                                ? business.domain
                                : resolveBrandDomain(n, r.sources || [])
                            }
                          />
                        ))}
                      {(r.competitors || []).length > 4 &&
                        "+" + ((r.competitors || []).length - 4)}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => onAnswer(r)}>
                      {unique(r.sources || []).length} sources
                    </button>
                  </td>
                  <td>{new Date(r.at).toLocaleDateString()}</td>
                </tr>
              ))}
          </React.Fragment>
        ))}
      </Table>
      {!list.length && <Empty />}
    </Card>
  );
}
function SentimentPage({
  rows,
  business,
  brand,
  cadence,
  annotations,
  reviews,
  onReview,
  onAnswer,
  onDetail,
}) {
  const [model, setModel] = useState("All models"),
    [opponent, setOpponent] = useState(""),
    [mode, setMode] = useState(1),
    [attrMode, setAttrMode] = useState(0),
    [showAll, setShowAll] = useState(false);
  const relevant = brandRows(rows, brand, business.name),
    selected = relevant.filter(
      (r) => model === "All models" || r.engine === model,
    ),
    summary = sentimentData(selected),
    metrics = reportMetrics(rows, business.name),
    own = metrics.find((b) => b.name === brand),
    rival = metrics.find(
      (b) =>
        b.name === (opponent || metrics.find((b) => b.name !== brand)?.name),
    );
  const attrs = rows.flatMap((r) =>
      (annotations[r.id]?.attributes || [])
        .filter((a) => a.brand === brand)
        .map((a) => ({ ...a, row: r })),
    ),
    labels = unique(attrs.map((a) => a.label)),
    facts = rows.flatMap((r) =>
      (annotations[r.id]?.facts || [])
        .filter((f) => f.brand === brand)
        .map((f) => ({ ...f, row: r, key: JSON.stringify([r.id, f.quote]) })),
    ),
    verified = facts.filter(
      (f) => reviews[f.key]?.verdict && reviews[f.key].verdict !== "Unreviewed",
    ).length;
  const quotes = selected
    .map((r) => ({
      row: r,
      quote: r.brandAssessment?.[brand]?.sentimentEvidence,
    }))
    .filter((r) => r.quote);
  return (
    <>
      <Card
        title="Brand Perception"
        icon={MessageCircle}
        note="Evidence from collected AI answers"
        actions={
          <select
            aria-label="Perception model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option>All models</option>
            {unique(rows.map((r) => r.engine)).map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        }
        footer={
          <>
            <button
              onClick={() =>
                onDetail({
                  title: "Perception evidence",
                  content: quotes.map((q, i) => (
                    <blockquote key={i}>
                      <p>{q.quote}</p>
                      <button onClick={() => onAnswer(q.row)}>
                        {q.row.engine} · View full answer
                      </button>
                    </blockquote>
                  )),
                })
              }
            >
              Sources &amp; evidence
            </button>
            <span>{summary.count} assessed mentions · 0–100 score</span>
          </>
        }
      >
        <div className="ip-perception">
          <div>
            <svg
              viewBox="0 0 120 120"
              aria-label={`Sentiment score ${num(summary.score)}`}
            >
              <circle
                cx="60"
                cy="60"
                r="49"
                fill="none"
                stroke="var(--d2-line)"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
                r="49"
                fill="none"
                stroke="var(--ip-green)"
                strokeWidth="9"
                strokeDasharray={`${(summary.score || 0) * 3.079} 308`}
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="60" textAnchor="middle">
                {num(summary.score)}
              </text>
              <text className="ip-ring-label" x="60" y="80" textAnchor="middle">
                / 100
              </text>
            </svg>
            <div className="ip-legend">
              {summary.counts.map((n, i) => (
                <span key={i}>
                  {summary.count ? pct((n / summary.count) * 100) : "—"}{" "}
                  {["pos", "neu", "neg"][i]}
                </span>
              ))}
            </div>
          </div>
          <div>
            {quotes.length ? (
              quotes.slice(0, 3).map((q, i) => (
                <blockquote key={i}>
                  <p>{q.quote}</p>
                  <button onClick={() => onAnswer(q.row)}>
                    {q.row.engine} · Read answer <ArrowUpRight size={12} />
                  </button>
                </blockquote>
              ))
            ) : (
              <Empty>
                No sentiment excerpts have been assessed for this selection.
              </Empty>
            )}
          </div>
        </div>
      </Card>
      <div className="ip-grid">
        <Card
          title="Sentiment Score"
          note="Brand sentiment over time"
          actions={<Switch value={mode} onChange={setMode} />}
          footer="Positive = 100 · Neutral = 50 · Negative = 0; unassessed excluded"
        >
          <div className="ip-stat">
            <span>Sentiment score</span>
            <strong>{num(sentimentData(relevant).score)}</strong>
          </div>
          <Chart
            percent
            mode={mode}
            series={[
              {
                name: "Sentiment",
                points: bucketRows(relevant, cadence).map(([date, rs]) => ({
                  date,
                  value: sentimentData(rs).score,
                })),
              },
            ]}
          />
        </Card>
        <Card
          title="Head-to-Head"
          icon={BarChart3}
          note="Visibility, position & sentiment"
          actions={
            <select
              aria-label="Compare competitor"
              value={rival?.name || ""}
              onChange={(e) => setOpponent(e.target.value)}
            >
              {metrics
                .filter((m) => m.name !== brand)
                .map((m) => (
                  <option key={m.name}>{m.name}</option>
                ))}
            </select>
          }
        >
          <div className="ip-headtohead">
            <div>
              <Brand name={brand} business={business} rows={rows} />
              <strong>{pct(own?.visibility)}</strong>
            </div>
            <div>
              {rival && (
                <Brand name={rival.name} business={business} rows={rows} />
              )}
              <strong>{pct(rival?.visibility)}</strong>
            </div>
          </div>
          <div className="ip-versus">
            <i
              style={{
                width: `${(own?.visibility || 0) + (rival?.visibility || 0) ? ((own?.visibility || 0) / ((own?.visibility || 0) + (rival?.visibility || 0))) * 100 : 50}%`,
              }}
            />
          </div>
          <Table headers={["Metric", brand, rival?.name || "Competitor"]}>
            <tr>
              <td>Visibility</td>
              <td>{pct(own?.visibility)}</td>
              <td>{pct(rival?.visibility)}</td>
            </tr>
            <tr>
              <td>Average position</td>
              <td>{num(own?.position)}</td>
              <td>{num(rival?.position)}</td>
            </tr>
            <tr>
              <td>Sentiment</td>
              <td>{num(own?.sentiment)}</td>
              <td>{num(rival?.sentiment)}</td>
            </tr>
          </Table>
          <div className="ip-known">
            <strong>Known for</strong>
            {unique(attrs.map((a) => a.label))
              .slice(0, 6)
              .map((l) => (
                <button
                  key={l}
                  onClick={() =>
                    onDetail({
                      title: l,
                      content: attrs
                        .filter((a) => a.label === l)
                        .map((a, i) => (
                          <blockquote key={i}>
                            <p>{a.quote}</p>
                            <button onClick={() => onAnswer(a.row)}>
                              Read evidence
                            </button>
                          </blockquote>
                        )),
                    })
                  }
                >
                  {l}
                </button>
              ))}
            {!attrs.length && (
              <p>Analyze descriptions to extract supported attributes.</p>
            )}
          </div>
        </Card>
        <Card
          title="Attributes"
          icon={Layers}
          note="What AI says about the selected brand"
          actions={
            <Switch
              value={attrMode}
              onChange={setAttrMode}
              labels={["Attribute treemap", "Attribute list"]}
            />
          }
          footer={`${labels.length} attributes · sized by supporting excerpts`}
        >
          <div className={attrMode ? "ip-attribute-list" : "ip-treemap"}>
            {labels.map((l) => {
              const matches = attrs.filter((a) => a.label === l),
                positive = matches.filter(
                  (a) => a.sentiment === "Positive",
                ).length;
              return (
                <button
                  key={l}
                  style={{
                    flexGrow: matches.length,
                    background:
                      positive >= matches.length / 2
                        ? "var(--ip-green-soft)"
                        : "var(--ip-amber-soft)",
                  }}
                  onClick={() =>
                    onDetail({
                      title: l,
                      content: matches.map((a, i) => (
                        <blockquote key={i}>
                          <p>{a.quote}</p>
                          <small>{a.sentiment}</small>
                          <button onClick={() => onAnswer(a.row)}>
                            Read answer
                          </button>
                        </blockquote>
                      )),
                    })
                  }
                >
                  <span>{l}</span>
                  <strong>{pct((matches.length / attrs.length) * 100)}</strong>
                </button>
              );
            })}
          </div>
          {!labels.length && (
            <Empty>
              Analyze collected descriptions to extract attributes with quoted
              evidence.
            </Empty>
          )}
        </Card>
        <Card
          title="Brand Facts"
          icon={Check}
          note="Review claims made in AI answers"
          footer={
            <>
              <span>
                {verified} of {facts.length} reviewed
              </span>
              <button onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show fewer" : `Show all ${facts.length}`}
              </button>
            </>
          }
        >
          <div className="ip-facts">
            {facts.slice(0, showAll ? facts.length : 4).map((f) => (
              <article key={f.key}>
                <small>
                  {f.row.engine}{" "}
                  <span>{new Date(f.row.at).toLocaleDateString()}</span>
                </small>
                <p>{f.quote}</p>
                <div>
                  {["Correct", "Incorrect", "Unreviewed"].map((verdict) => (
                    <button
                      key={verdict}
                      aria-pressed={
                        (reviews[f.key]?.verdict || "Unreviewed") === verdict
                      }
                      onClick={() => onReview(f, verdict)}
                    >
                      {verdict === "Unreviewed" ? "Reset" : verdict}
                    </button>
                  ))}
                  <button onClick={() => onAnswer(f.row)}>Evidence ↗</button>
                </div>
              </article>
            ))}
          </div>
          {!facts.length && (
            <Empty>
              No extracted claims yet. Analyze descriptions to prepare facts for
              review.
            </Empty>
          )}
          <p className="ip-note">
            Your review is saved here; it does not change an external AI answer.
          </p>
        </Card>
      </div>
    </>
  );
}
function SourcesPage({ rows, prior, business, cadence, onDetail, onAnswer }) {
  const [q, setQ] = useState(""),
    [includeMedia, setIncludeMedia] = useState(true),
    [sourceSort, setSourceSort] = useState("Used"),
    [group, setGroup] = useState(false),
    [type, setType] = useState("All types"),
    [content, setContent] = useState("All content"),
    [gap, setGap] = useState(false),
    [mode, setMode] = useState(0),
    [limit, setLimit] = useState(25);
  const sources = sourceRows(rows, business.domain, prior),
    filtered = sources
      .filter(
        (s) =>
          (includeMedia || s.type !== "Social") &&
          (type === "All types" || s.type === type) &&
          (content === "All content" || s.contentType === content) &&
          (!gap || s.rows.some((r) => !r.mentioned && r.competitors?.length)) &&
          `${s.url} ${s.domain}`.toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) =>
        sourceSort === "Source"
          ? a.url.localeCompare(b.url)
          : sourceSort === "Change"
            ? (b.growth ?? -Infinity) - (a.growth ?? -Infinity)
            : b.count - a.count,
      );
  const domains = unique(filtered.map((s) => s.domain))
    .map((name) => ({
      name,
      rows: rows.filter((r) => r.sources?.some((u) => domainOf(u) === name)),
    }))
    .sort((a, b) => b.rows.length - a.rows.length);
  const contentTypes = unique(sources.map((s) => s.contentType));
  return (
    <>
      <div className="ip-grid ip-source-grid">
        <Card
          title="Top Domains"
          icon={Globe2}
          note="Citation trends by domain"
          actions={
            <>
              <select
                aria-label="Source type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {["All types", "Owned", "Third-party", "Social"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <Switch value={mode} onChange={setMode} />
            </>
          }
          footer={
            <>
              <span>Top {Math.min(5, domains.length)} domains</span>
              <button aria-pressed={gap} onClick={() => setGap(!gap)}>
                {gap ? "Hide" : "Show"} gap analysis
              </button>
            </>
          }
        >
          <Chart
            mode={mode}
            series={domains
              .slice(0, 5)
              .map((d) => ({
                name: d.name,
                points: bucketRows(rows, cadence).map(([date, rs]) => ({
                  date,
                  value: rs.filter((r) =>
                    r.sources?.some((u) => domainOf(u) === d.name),
                  ).length,
                })),
              }))}
            onPoint={(date, domain) =>
              onDetail({
                title: domain + " · " + date,
                content: (
                  <AnswerList
                    rows={domains
                      .find((d) => d.name === domain)
                      .rows.filter(
                        (r) => bucketRows([r], cadence)[0]?.[0] === date,
                      )}
                    business={business}
                    brand={business.name}
                    onAnswer={onAnswer}
                  />
                ),
              })
            }
          />
        </Card>
        <Card
          title="Content Types"
          icon={Layers}
          note="Formats classified from read source pages"
          footer={`${contentTypes.length} content types`}
        >
          <div className="ip-content-types">
            {contentTypes.map((t) => {
              const count = sources
                  .filter((s) => s.contentType === t)
                  .reduce((sum, s) => sum + s.count, 0),
                total = sources.reduce((sum, s) => sum + s.count, 0);
              return (
                <button
                  key={t}
                  aria-pressed={content === t}
                  onClick={() => setContent(content === t ? "All content" : t)}
                >
                  <span>{t}</span>
                  <i>
                    <b
                      style={{
                        width: `${(count / Math.max(total, 1)) * 100}%`,
                      }}
                    />
                  </i>
                  <strong>{pct((count / Math.max(total, 1)) * 100)}</strong>
                </button>
              );
            })}
          </div>
          <p className="ip-note">
            Use “Classify next 3 sources” to identify formats from public page
            excerpts. Blocked pages stay unclassified.
          </p>
        </Card>
      </div>
      <Card
        title={gap ? "Source Gaps" : "All URLs"}
        icon={Link2}
        note={
          gap
            ? "Citations in answers mentioning competitors but not your brand"
            : "Every cited URL in this selection"
        }
        actions={
          <>
            <label className="ip-media">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
              />
              Include third-party media
            </label>
            <button aria-pressed={group} onClick={() => setGroup(!group)}>
              Group by domain
            </button>
            <button aria-pressed={gap} onClick={() => setGap(!gap)}>
              Gap analysis
            </button>
            <SearchField label="Search sources" value={q} onChange={setQ} />
            <button onClick={() => exportRows("citation-sources", filtered)}>
              Export
            </button>
          </>
        }
        footer={
          <>
            <span>{filtered.length} URLs</span>
            {filtered.length > limit && (
              <button onClick={() => setLimit(limit + 25)}>Show 25 more</button>
            )}
          </>
        }
      >
        <Table
          headers={[
            "#",
            <button onClick={() => setSourceSort("Source")}>Source ↕</button>,
            "Source type",
            "Content type",
            <button onClick={() => setSourceSort("Used")}>Used ↓</button>,
            <button onClick={() => setSourceSort("Change")}>Change ↓</button>,
            "Content",
          ]}
        >
          {(group
            ? domains.map((d) => ({
                url: d.name,
                domain: d.name,
                type: filtered.find((s) => s.domain === d.name)?.type,
                contentType: "Multiple",
                rows: d.rows,
                used: rows.length ? (d.rows.length / rows.length) * 100 : null,
                growth: null,
              }))
            : filtered
          )
            .slice(0, limit)
            .map((s, i) => (
              <tr key={s.url}>
                <td>{i + 1}</td>
                <td>
                  <button
                    className="ip-url"
                    onClick={() =>
                      onDetail({
                        title: s.url,
                        content: (
                          <>
                            <h3>Citing answers</h3>
                            <AnswerList
                              rows={s.rows}
                              business={business}
                              brand={business.name}
                              onAnswer={onAnswer}
                            />
                            {!group && (
                              <a href={s.url} target="_blank" rel="noreferrer">
                                Visit source ↗
                              </a>
                            )}
                          </>
                        ),
                      })
                    }
                  >
                    <BrandLogo name={s.domain} domain={s.domain} />
                    {s.url.replace(/^https?:\/\//, "")}{" "}
                    <ChevronRight size={14} />
                  </button>
                </td>
                <td>
                  <span className="ip-pill">{s.type}</span>
                </td>
                <td>{s.contentType}</td>
                <td>{pct(s.used)}</td>
                <td title="Change in citation rate versus the preceding equal period">
                  {s.growth === null
                    ? "—"
                    : `${s.growth > 0 ? "+" : ""}${s.growth.toFixed(1)} pp`}
                </td>
                <td>
                  <button
                    onClick={() =>
                      onDetail({
                        title: "Citation evidence · " + s.domain,
                        content: (
                          <>
                            {s.metadata?.excerpt && (
                              <blockquote>
                                <strong>Source format evidence</strong>
                                <p>{s.metadata.excerpt}</p>
                                <small>{s.metadata.method}</small>
                              </blockquote>
                            )}
                            {s.rows.map((r) => (
                              <blockquote key={r.id}>
                                <p>
                                  {r.citations?.find((c) => c.url === s.url)
                                    ?.excerpt ||
                                    "The collector supplied this URL without an excerpt."}
                                </p>
                                <button onClick={() => onAnswer(r)}>
                                  Open full response
                                </button>
                              </blockquote>
                            ))}
                          </>
                        ),
                      })
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
        </Table>
        {!filtered.length && <Empty />}
      </Card>
    </>
  );
}
function TopicsPage({ rows, business, annotations, onDetail, onAnswer }) {
  const [q, setQ] = useState(""),
    [mode, setMode] = useState(0),
    [sort, setSort] = useState("Lowest score");
  const topics = topicRows(rows, business.name).filter((t) =>
      t.name.toLowerCase().includes(q.toLowerCase()),
    ),
    engines = unique(rows.map((r) => r.engine));
  const detail = (t) =>
    onDetail({
      title: t.name,
      content: (
        <>
          <div className="ip-stat">
            <span>Visibility</span>
            <strong>{pct(t.own?.visibility)}</strong>
          </div>
          <h3>Brand rankings</h3>
          <Table headers={["Brand", "Visibility", "Average position"]}>
            {t.rankings.map((b) => (
              <tr key={b.name}>
                <td>
                  <Brand name={b.name} business={business} rows={rows} />
                </td>
                <td>{pct(b.visibility)}</td>
                <td>{num(b.position)}</td>
              </tr>
            ))}
          </Table>
          <h3>LLM priorities</h3>
          {unique(
            t.rows.flatMap((r) =>
              (annotations[r.id]?.attributes || []).map((a) => a.label),
            ),
          ).map((a) => (
            <span className="ip-pill" key={a}>
              {a}
            </span>
          ))}
          <AnswerList
            rows={t.rows}
            business={business}
            brand={business.name}
            onAnswer={onAnswer}
          />
        </>
      ),
    });
  return (
    <>
      <div className="ip-grid">
        <Card
          title="Topic Position Rankings"
          icon={Hash}
          note="Average explicit rank by AI engine"
          footer="Lower position is better; unranked answers are excluded"
        >
          <Table headers={["Topic", ...engines]}>
            {topics.map((t) => (
              <tr key={t.name}>
                <td>
                  <button onClick={() => detail(t)}>{t.name}</button>
                </td>
                {engines.map((e) => {
                  const vals = t.rows.filter(
                    (r) => r.engine === e && r.position > 0,
                  );
                  const mean = vals.length
                    ? vals.reduce((s, r) => s + r.position, 0) / vals.length
                    : null;
                  return (
                    <td key={e}>
                      <span
                        className="ip-heat"
                        style={{
                          "--intensity": mean ? Math.max(0.1, 1 / mean) : 0,
                        }}
                      >
                        {mean ? "#" + num(mean) : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </Table>
        </Card>
        <Card
          title="Topic Distribution"
          icon={Layers}
          note="Sized by prompts · colored by visibility"
          actions={
            <Switch
              value={mode}
              onChange={setMode}
              labels={["Topic treemap", "Topic list"]}
            />
          }
          footer={`${topics.length} topics · High / medium / low visibility`}
        >
          <div className={mode ? "ip-attribute-list" : "ip-treemap"}>
            {topics.map((t) => (
              <button
                key={t.name}
                style={{
                  flexGrow: t.prompts,
                  background:
                    t.own?.visibility >= 40
                      ? "var(--ip-green-soft)"
                      : t.own?.visibility >= 15
                        ? "var(--ip-amber-soft)"
                        : "var(--ip-red-soft)",
                }}
                onClick={() => detail(t)}
              >
                <span>{t.name}</span>
                <strong>{pct(t.own?.visibility)}</strong>
                <small>{t.prompts} prompts</small>
              </button>
            ))}
          </div>
          {!topics.length && <Empty />}
        </Card>
      </div>
      <Card
        title="Topic Rankings"
        icon={Hash}
        note="Brands ordered by visibility within each topic"
        actions={
          <SearchField label="Search topics" value={q} onChange={setQ} />
        }
      >
        <Table
          headers={[
            "Topics",
            ...Array.from({ length: 10 }, (_, i) => "#" + (i + 1)),
          ]}
        >
          {topics.map((t) => (
            <tr key={t.name}>
              <td>
                <button className="ip-topic-name" onClick={() => detail(t)}>
                  {t.name}
                  <span className="ip-pill">
                    {t.rankings[0]?.own && t.own?.visibility > 0
                      ? "Leading"
                      : "Needs work"}
                  </span>
                </button>
              </td>
              {Array.from({ length: 10 }, (_, i) => {
                const b = t.rankings.filter((b) => b.mentions > 0)[i];
                return (
                  <td key={i}>
                    {b ? (
                      <button
                        aria-label={`${b.name}: ${pct(b.visibility)}`}
                        title={`${b.name}: ${pct(b.visibility)}`}
                        onClick={() => detail(t)}
                      >
                        <BrandLogo
                          name={b.name}
                          domain={
                            b.own
                              ? business.domain
                              : resolveBrandDomain(
                                  b.name,
                                  rows.flatMap((r) => r.sources || []),
                                )
                          }
                        />
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </Table>
      </Card>
      <Card
        title="Topic Analysis"
        note="Visibility and competitive position"
        actions={
          <select
            value={sort}
            aria-label="Sort topic analysis"
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Lowest score</option>
            <option>Highest score</option>
          </select>
        }
      >
        {[...topics]
          .sort(
            (a, b) =>
              (sort === "Lowest score" ? 1 : -1) *
              ((a.own?.visibility || 0) - (b.own?.visibility || 0)),
          )
          .map((t) => (
            <details className="ip-topic-analysis" key={t.name}>
              <summary>
                <strong>{t.name}</strong>
                <span>{pct(t.own?.visibility)}</span>
              </summary>
              <div className="ip-known">
                <strong>Observed attributes</strong>
                {unique(
                  t.rows.flatMap((r) =>
                    (annotations[r.id]?.attributes || []).map((a) => a.label),
                  ),
                ).map((l) => (
                  <span className="ip-pill" key={l}>
                    {l}
                  </span>
                ))}
              </div>
              {t.rankings.slice(0, 4).map((b) => (
                <div className="ip-ranking-line" key={b.name}>
                  <Brand name={b.name} business={business} rows={rows} />
                  <span>#{num(b.position)}</span>
                  <strong>{pct(b.visibility)}</strong>
                </div>
              ))}
              <button onClick={() => detail(t)}>
                Show all brands and prompts <ArrowUpRight size={14} />
              </button>
            </details>
          ))}
      </Card>
    </>
  );
}
function FanoutPage({ rows, business, library, onTrack, onAnswer, onDetail }) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(0),
    [sort, setSort] = useState("Prompt");
  const items = fanoutRows(rows, library),
    filtered = items
      .filter((i) => i.prompt.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) =>
        sort === "Prompt"
          ? a.prompt.localeCompare(b.prompt)
          : b.count - a.count,
      ),
    current = Math.min(page, Math.max(0, Math.ceil(filtered.length / 10) - 1)),
    queries = items.flatMap((i) => i.queries),
    names = reportMetrics(rows, business.name).map((b) => b.name);
  return (
    <>
      <div className="ip-fanout-heading">
        <h2>Query fanouts</h2>
        <p>The extra searches AI makes to answer your prompts.</p>
        <div>
          <span>
            Distinct query fanouts
            <strong>{unique(queries.map((q) => norm(q.text))).length}</strong>
          </span>
          <span>
            Total occurrences
            <strong>{queries.reduce((n, q) => n + q.count, 0)}</strong>
          </span>
        </div>
      </div>
      <Card
        title="Query Fanouts by Prompt"
        icon={GitBranch}
        note="Queries explicitly returned by your collector"
        actions={
          <>
            <SearchField
              label="Search fanout prompts"
              value={q}
              onChange={(v) => {
                setQ(v);
                setPage(0);
              }}
            />
            <button onClick={() => exportRows("query-fanouts", filtered)}>
              Export
            </button>
          </>
        }
        footer={
          <>
            <span>{filtered.length} prompts</span>
            <span>
              <button disabled={!current} onClick={() => setPage(current - 1)}>
                Previous
              </button>
              <button
                disabled={(current + 1) * 10 >= filtered.length}
                onClick={() => setPage(current + 1)}
              >
                Next
              </button>
            </span>
          </>
        }
      >
        <Table
          headers={[
            <button onClick={() => setSort("Prompt")}>Prompt ↕</button>,
            <button onClick={() => setSort("Count")}>
              Fanout query count ↕
            </button>,
            "Fanout tracking coverage",
          ]}
        >
          {filtered.slice(current * 10, current * 10 + 10).map((item) => (
            <tr key={item.prompt}>
              <td>
                <details className="ip-fanout-detail">
                  <summary>{item.prompt}</summary>
                  <div>
                    {item.queries.length ? (
                      item.queries.map((query) => (
                        <div className="ip-fanout-query" key={query.text}>
                          <span>
                            {query.text}
                            <small>{query.count} occurrences</small>
                          </span>
                          <button
                            disabled={query.tracked}
                            onClick={() => onTrack(query.text)}
                          >
                            {query.tracked ? "Tracked" : "+ Track query"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No search queries were supplied for this prompt.</p>
                    )}
                    <button
                      onClick={() =>
                        onDetail({
                          title: item.prompt,
                          content: (
                            <AnswerList
                              rows={item.rows}
                              business={business}
                              brand={business.name}
                              onAnswer={onAnswer}
                            />
                          ),
                        })
                      }
                    >
                      Open response analysis ↗
                    </button>
                  </div>
                </details>
              </td>
              <td>{item.count}</td>
              <td>
                <span className="ip-pill">{pct(item.coverage)}</span>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <div className="ip-grid">
        <Card
          title="Brands / products"
          icon={Layers}
          note="Tracked brands found in generated queries"
        >
          {names.map((name) => {
            const matching = queries.filter((q) =>
              (" " + norm(q.text) + " ").includes(" " + norm(name) + " "),
            );
            return (
              <details className="ip-topic-analysis" key={name}>
                <summary>
                  <Brand name={name} business={business} rows={rows} />
                  <span>
                    {unique(matching.map((q) => norm(q.text))).length} queries ·{" "}
                    {matching.reduce((n, q) => n + q.count, 0)} occurrences
                  </span>
                </summary>
                {matching.map((q, i) => (
                  <p key={i}>{q.text}</p>
                ))}
              </details>
            );
          })}
        </Card>
        <Card
          title="Search query coverage"
          icon={Search}
          note="Tracked questions from your prompt library"
        >
          <div className="ip-stat">
            <span>Active tracked fanouts</span>
            <strong>
              {
                unique(
                  queries.filter((q) => q.tracked).map((q) => norm(q.text)),
                ).length
              }{" "}
              / {unique(queries.map((q) => norm(q.text))).length}
            </strong>
          </div>
          <p className="ip-note">
            Track a query to add it to your active prompt library. Collection
            starts only when you run or schedule that prompt. Fanouts are
            provider-reported search queries, not private model reasoning.
          </p>
        </Card>
      </div>
    </>
  );
}
function LocationPage({ rows, prior, business, onDetail, onAnswer }) {
  const [metric, setMetric] = useState("Visibility"),
    [zoom, setZoom] = useState(1),
    [world, setWorld] = useState(null);
  useEffect(() => {
    fetch("/world-regions.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setWorld)
      .catch(() => {});
  }, []);
  const places = unique(rows.map((r) => r.location || "Not specified")),
    known = places.filter((p) => !["Not specified", "Unknown", ""].includes(p));
  const value = (rs) =>
    metric === "Visibility"
      ? rs.length
        ? (rs.filter((r) => r.mentioned).length / rs.length) * 100
        : null
      : metric === "Sentiment"
        ? sentimentData(rs).score
        : rs.length;
  const regions = places.map((name) => ({
    name,
    rows: rows.filter((r) => (r.location || "Not specified") === name),
  }));
  const open = (r) =>
    onDetail({
      title: r.name,
      content: (
        <AnswerList
          rows={r.rows}
          business={business}
          brand={business.name}
          onAnswer={onAnswer}
        />
      ),
    });
  const path = (coords) =>
    coords
      .map(
        (ring) =>
          ring
            .map(
              ([lon, lat], i) =>
                (i ? "L" : "M") +
                ((lon + 180) * 2).toFixed(1) +
                "," +
                ((90 - lat) * 2).toFixed(1),
            )
            .join(" ") + " Z",
      )
      .join(" ");
  return (
    <Card
      title="Location"
      icon={Globe2}
      note="Geographic breakdown across tracked regions"
      actions={
        <select
          aria-label="Location metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          {["Visibility", "Sentiment", "Responses"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      }
      footer={`${known.length} named regions · ${unique(rows.map((r) => r.prompt)).length} prompts · ${rows.length} responses`}
    >
      <div className="ip-location">
        <div className="ip-map">
          <svg
            viewBox="0 0 720 360"
            role="img"
            aria-label="World map of explicitly recorded collection regions"
          >
            <g
              transform={`translate(${360 * (1 - zoom)} ${180 * (1 - zoom)}) scale(${zoom})`}
            >
              {world?.features?.map((f, i) => {
                const name = f.properties.ADMIN || f.properties.name,
                  region = regions.find(
                    (r) =>
                      norm(r.name) === norm(name) ||
                      norm(r.name) === norm(f.properties.NAME),
                  );
                return (
                  <path
                    key={i}
                    d={
                      f.geometry.type === "Polygon"
                        ? path(f.geometry.coordinates)
                        : f.geometry.coordinates.map(path).join(" ")
                    }
                    className={region ? "is-tracked" : ""}
                    onClick={() => region && open(region)}
                    tabIndex={region ? 0 : undefined}
                    role={region ? "button" : undefined}
                    onKeyDown={(e) => {
                      if (region && e.key === "Enter") open(region);
                    }}
                  >
                    <title>
                      {name}
                      {region
                        ? ": " + num(value(region.rows))
                        : " · No regional observations"}
                    </title>
                  </path>
                );
              })}
            </g>
          </svg>
          {!known.length && (
            <div className="ip-map-empty">
              <Globe2 size={28} />
              <strong>No regional measurements yet</strong>
              <p>
                Current answers do not include a verified collection location.
                They remain in “Not specified” below.
              </p>
            </div>
          )}
          <div className="ip-map-controls">
            <button
              aria-label="Zoom in map"
              disabled={zoom >= 3}
              onClick={() => setZoom(Math.min(3, zoom + 0.5))}
            >
              <Plus size={16} />
            </button>
            <button
              aria-label="Zoom out map"
              disabled={zoom <= 1}
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            >
              <Minus size={16} />
            </button>
            <button onClick={() => setZoom(1)}>World view</button>
          </div>
        </div>
        <Table headers={["Region", metric, "Change"]}>
          {regions.map((r) => {
            const before = prior.filter(
                (a) => (a.location || "Not specified") === r.name,
              ),
              v = value(r.rows),
              previous = value(before);
            return (
              <tr key={r.name}>
                <td>
                  <button onClick={() => open(r)}>{r.name} ↗</button>
                </td>
                <td>{metric === "Visibility" ? pct(v) : num(v)}</td>
                <td>
                  {before.length && previous !== null && v !== null
                    ? `${v - previous > 0 ? "+" : ""}${(v - previous).toFixed(1)}${metric === "Visibility" ? " pp" : ""}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </Card>
  );
}
export function InsightPages({
  tab,
  rows,
  prior,
  business,
  brand,
  cadence,
  annotations,
  reviews,
  library,
  onReview,
  onTrack,
  evidence,
  onClearEvidence,
}) {
  const [detail, setDetail] = useState(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setDetail(null);
    setNotice("");
  }, [tab, business.domain]);
  const answer = (r) =>
    setDetail({
      title: r.prompt,
      content: (
        <>
          <p className="ip-note">
            {r.engine} · {new Date(r.at).toLocaleString()} · {r.method}
          </p>
          <div className="ip-answer-text"><LinkedAnswer text={r.answer}/></div>
          <h3>Cited sources</h3>
          {unique(r.sources || [])
            .filter(domainOf)
            .map((url) => (
              <p key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url} ↗
                </a>
              </p>
            ))}
          <h3>Measurement evidence</h3>
          {Object.entries(r.brandAssessment || {}).map(([name, m]) => (
            <blockquote key={name}>
              <strong>{name}</strong>
              <p>{m.mentionEvidence || "No mention excerpt"}</p>
              <small>
                {m.sentiment} · Position {m.position || "unranked"}
              </small>
            </blockquote>
          ))}
        </>
      ),
    });
  useEffect(() => {
    if (evidence) answer(evidence);
  }, [evidence]);
  const shared = {
    rows,
    prior,
    business,
    brand,
    cadence,
    plan,
    annotations,
    reviews,
    library,
    onDetail: setDetail,
    onAnswer: answer,
    onReview: async (f, v) => {
      try {
        await onReview(f, v);
        setNotice("Fact review saved.");
      } catch (e) {
        setNotice(e.message);
      }
    },
    onTrack: async (text) => {
      try {
        await onTrack(text);
        setNotice("Query added to active prompt tracking.");
      } catch (e) {
        setNotice(e.message);
      }
    },
  };
  return (
    <div className={tab === 1 ? "mp-root" : "ip-pages"}>
      {notice && (
        <p className="ip-notice" role="status">
          {notice}
        </p>
      )}
      {tab === 1 ? (
        <MentionsPage {...shared} />
      ) : tab === 2 ? (
        <SentimentPage {...shared} />
      ) : tab === 3 ? (
        <SourcesPage {...shared} />
      ) : tab === 4 ? (
        <TopicsPage {...shared} />
      ) : tab === 5 ? (
        <FanoutPage {...shared} />
      ) : (
        <LocationPage {...shared} />
      )}
      {detail && (
        <Drawer
          key={detail.title}
          detail={detail}
          onClose={() => {
            setDetail(null);
            onClearEvidence?.();
          }}
        />
      )}
    </div>
  );
}
