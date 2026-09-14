import React, { useState } from "react";
import {
  Search,
  Sparkles,
  ArrowUpRight,
  Plus,
  Globe2,
  FileText,
  CircleHelp,
  CircleCheck,
  Target,
  TrendingUp,
  Layers3,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { Stat } from "./ContentSections";
const keywords = [
  { name: "office snack delivery", volume: 900, difficulty: 42 },
  { name: "healthy salad catering guide", volume: 480, difficulty: 38 },
  { name: "vegan office catering options", volume: 70, difficulty: 26 },
  { name: "gluten-free catering strategies", volume: 60, difficulty: 30 },
  { name: "allergen labeling best practices", volume: 50, difficulty: 32 },
];
export function KeywordPage({ onCreate, onLibrary }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All opportunities");
  const rows = keywords.filter(
    (k) =>
      k.name.includes(search.toLowerCase()) &&
      (filter !== "Lower difficulty" || k.difficulty <= 32),
  );
  return (
    <div className="cs-page">
      <div className="cs-page-intro">
        <div>
          <h2>Find your next opportunity.</h2>
          <p>Turn the questions people ask into content they find.</p>
        </div>
        <button className="cs-button filled" onClick={onCreate}>
          <Plus size={15} />
          Plan an article
        </button>
      </div>
      <section className="cs-stats" aria-label="Keyword analytics">
        <Stat
          label="Tracked keywords"
          value="132"
          description="Source workspace snapshot"
          icon={Search}
          color="purple"
          values={[5, 7, 8, 9, 13]}
        />
        <Stat
          label="In your queue"
          value="24"
          description="Ready for content planning"
          icon={Layers3}
          values={[4, 8, 6, 12]}
        />
        <Stat
          label="Monthly searches"
          value="1,560"
          description="Across these 5 opportunities"
          icon={TrendingUp}
          color="blue"
          values={keywords.map((k) => k.volume)}
        />
        <Stat
          label="Lower difficulty"
          value="3"
          description="Keywords with difficulty ≤ 32"
          icon={Target}
          color="gold"
          values={[26, 30, 32]}
        />
      </section>
      <div className="cs-library-layout">
        <section className="panel cs-research-main">
          <div className="cs-research-heading">
            <h3>Keyword opportunities</h3>
            <span>5 source keywords</span>
          </div>
          <div className="cs-research-toolbar">
            <label className="cs-search">
              <Search size={16} />
              <input
                aria-label="Search keywords"
                placeholder="Search opportunities…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Keyword difficulty filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All opportunities</option>
              <option>Lower difficulty</option>
            </select>
          </div>
          <div className="cs-keyword-table">
            <div className="cs-keyword-row header">
              <span>Keyword</span>
              <span>Search demand</span>
              <span>Difficulty</span>
              <span />
            </div>
            {rows.map((k) => (
              <div className="cs-keyword-row" key={k.name}>
                <span>
                  <strong>{k.name}</strong>
                  <small>LunchLink · Monthly search volume</small>
                </span>
                <span className="cs-demand">
                  <strong>{k.volume}</strong>
                  <span>
                    <i style={{ width: `${(k.volume / 900) * 100}%` }} />
                  </span>
                </span>
                <span
                  className={
                    "cs-difficulty " + (k.difficulty <= 32 ? "low" : "")
                  }
                >
                  <i />
                  {k.difficulty}
                  <small>/100</small>
                </span>
                <button
                  className="cs-icon-button"
                  aria-label={`Plan content for ${k.name}`}
                  onClick={() => onCreate(k.name)}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="cs-empty">
                <Search size={25} />
                <h3>No matching keywords</h3>
                <button
                  className="cs-button"
                  onClick={() => {
                    setSearch("");
                    setFilter("All opportunities");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
          <div className="cs-library-footer">
            Search volume and difficulty from the captured workspace.
          </div>
        </section>
        <aside className="cs-library-aside">
          <section className="panel cs-breakdown">
            <div className="cs-section-heading">
              <h3>A good place to start</h3>
              <Sparkles size={17} />
            </div>
            <div className="cs-opportunity-icon">
              <Target size={32} />
            </div>
            <h3 className="cs-opportunity-title">
              Vegan office catering options
            </h3>
            <p className="cs-research-copy">
              The lowest difficulty among these opportunities, with 70 monthly
              searches.
            </p>
            <div className="cs-opportunity-values">
              <span>
                <strong>70</strong>Monthly searches
              </span>
              <span>
                <strong>26</strong>Keyword difficulty
              </span>
            </div>
            <button
              className="cs-button full"
              onClick={() => onCreate("vegan office catering options")}
            >
              Plan this topic <ArrowUpRight size={14} />
            </button>
          </section>
          <button className="cs-calendar-link" onClick={onLibrary}>
            <span className="cs-soft-icon purple">
              <FileText size={19} />
            </span>
            <h3>Give your research a next step.</h3>
            <p>
              Check the content you already have before starting something new.
            </p>
            <span>
              Explore your library <ArrowUpRight size={14} />
            </span>
          </button>
        </aside>
      </div>
      <div className="cs-page-footer">
        <span>
          <i />
          LunchLink workspace
        </span>
        <span>Historical source data · Decorative metric mini-charts</span>
      </div>
    </div>
  );
}
export function VisibilityPage({ onKeywords }) {
  return (
    <div className="cs-page">
      <div className="cs-page-intro">
        <div>
          <h2>Be part of the answer.</h2>
          <p>See where your brand appears in AI search.</p>
        </div>
        <span className="cs-snapshot-label">
          <Clock3 size={13} />
          Last scan · Aug 29, 2026
        </span>
      </div>
      <section className="cs-stats">
        <Stat
          label="Visibility score"
          value="6%"
          description="Your recorded baseline"
          icon={Sparkles}
          color="purple"
          values={[6]}
        />
        <Stat
          label="Citations"
          value="6"
          description="In the last source scan"
          icon={Globe2}
          color="green"
          values={[6]}
        />
        <Stat
          label="Monitored prompts"
          value="53"
          description="Across AI search engines"
          icon={Search}
          color="blue"
          values={[53]}
        />
        <Stat
          label="Competitors"
          value="5"
          description="In your comparison set"
          icon={Layers3}
          color="gold"
          values={[5]}
        />
      </section>
      <div className="cs-ai-layout">
        <section className="panel cs-ai-baseline">
          <div className="cs-section-heading">
            <h3>Your visibility baseline</h3>
            <span>Source snapshot</span>
          </div>
          <div className="cs-visibility-ring">
            <svg
              viewBox="0 0 260 220"
              aria-label="6 percent AI visibility"
              role="img"
            >
              <path
                d="M37 176a105 105 0 1 1 186 0"
                fill="none"
                stroke="#eeecf6"
                strokeWidth="24"
                strokeLinecap="round"
              />
              <path
                d="M37 176a105 105 0 1 1 186 0"
                fill="none"
                stroke="#b5ade7"
                strokeWidth="24"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="6 100"
              />
              <path
                d="M58 164a81 81 0 1 1 144 0"
                fill="none"
                stroke="#e1deef"
                strokeWidth="2"
                strokeDasharray="1 6"
              />
            </svg>
            <div>
              <Sparkles size={22} />
              <strong>
                6<span>%</span>
              </strong>
              <p>AI visibility score</p>
            </div>
          </div>
          <div className="cs-ai-note">
            <CircleCheck size={17} />
            <div>
              <strong>Your baseline is recorded.</strong>
              <p>
                A second scan will help you see how your visibility changes over
                time.
              </p>
            </div>
          </div>
        </section>
        <section className="panel cs-ai-prompts">
          <div className="cs-research-heading">
            <h3>Questions your audience asks</h3>
            <span>Sample tracked prompts</span>
          </div>
          {[
            "What is corporate catering GTA?",
            "What are vegan corporate catering options?",
            "How much does corporate catering cost in Toronto?",
            "How to choose a corporate caterer?",
            "What is breakfast catering for corporate meetings?",
          ].map((q, i) => (
            <div className="cs-prompt" key={q}>
              <span className="cs-soft-icon purple">
                <Search size={14} />
              </span>
              <div>
                <strong>{q}</strong>
                <span>LunchLink · AI search</span>
              </div>
              <span className="cs-prompt-tag">Tracked</span>
            </div>
          ))}
          <div className="cs-ai-tracking">
            <span>
              <i />
              53 monitored prompts
            </span>
            <span>Captured workspace data</span>
          </div>
        </section>
        <section className="panel cs-ai-next">
          <div className="cs-section-heading">
            <h3>Your next steps</h3>
            <Sparkles size={17} />
          </div>
          <div className="cs-ai-next-row">
            <span className="cs-soft-icon gold">
              <FileText size={17} />
            </span>
            <div>
              <h4>Content readiness</h4>
              <p>LLM readiness has not been scored in this snapshot.</p>
            </div>
            <span className="cs-neutral-pill">Not scored</span>
          </div>
          <button className="cs-ai-next-row" onClick={onKeywords}>
            <span className="cs-soft-icon green">
              <Target size={17} />
            </span>
            <div>
              <h4>Find a relevant content opportunity</h4>
              <p>Use keyword research to plan your next helpful article.</p>
            </div>
            <ArrowUpRight size={18} />
          </button>
        </section>
      </div>
      <div className="cs-page-footer">
        <span>
          <i />
          LunchLink workspace
        </span>
        <span>
          Historical results · New scans require a connected workspace
        </span>
      </div>
    </div>
  );
}
