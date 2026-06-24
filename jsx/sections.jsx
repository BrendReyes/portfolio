/* ============================================================
   sections.jsx — About · Skills index · Projects · Roadmap · Experience
   Personal details below are PLACEHOLDERS — swap in real info.
   ============================================================ */

// ascii progress bar
function bar(pct, width = 16) {
  const f = Math.round(pct / 100 * width);
  return "█".repeat(f) + "░".repeat(width - f);
}

function Meter({ label, pct, note }) {
  return (
    <div className="meter">
      <span className="ml">{label}</span>
      <span className="track"><b>{"█".repeat(Math.round(pct / 100 * 18))}</b>{"░".repeat(18 - Math.round(pct / 100 * 18))}</span>
      <span className="mv">{note}</span>
    </div>);

}

function IdPhoto() {
  const [loaded, setLoaded] = React.useState(false);
  const ref = React.useRef(null);
  // if the image is already cached, onLoad may not fire — catch it on mount
  React.useEffect(() => { if (ref.current && ref.current.complete) setLoaded(true); }, []);
  return (
    <div className={"id-photo crt-cam" + (loaded ? " is-loaded" : "")}>
      <img ref={ref} src="assets/brend.jpg" alt="Brend Reyes"
        onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
      {!loaded &&
      <div className="id-skel">
        <span className="id-skel-txt">decoding<i></i></span>
      </div>}
    </div>);

}

function About() {
  return (
    <div className="content fadein">
      <div className="id-card">
        <IdPhoto />
        <div className="id-meta">
          <div className="cmdline"><span className="p">~/portfolio $</span> whoami</div>
          <h1>Brend Reyes</h1>
          <p className="lead">Backend Engineering &amp; System Design student — <span style={{ color: "var(--accent)" }}>slow learner, but hungry.</span></p>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 18 }}>
        <div>
          <p>Hi! I'm a CS student specializing in Backend Engineering and System Design. I'm passionate about learning how to plan and build apps that scale from zero to thousands — or millions — of users.</p>
          <p>I came to the party late, but I'm not giving up. I'll keep showing up as a hungry learner, even when the progress is slow.</p>

          <h2>currently</h2>
          <div className="kv">
            <span className="k">building</span><span className="v">PureTube — filters YouTube Shorts by topic via the YouTube Data API</span>
            <span className="k">learning</span><span className="v">Docker &amp; CI/CD pipelines</span>
            <span className="k">next up</span><span className="v">Pub/Sub · Observability</span>
            <span className="k">open to</span><span className="v">backend internships &amp; junior roles</span>
          </div>

          <h2>toolbox</h2>
          <div className="chips">
            {["Go", "Python", "Postgres", "Redis", "Docker", "Linux", "Git", "GitHub", "C#", "Java", "JavaScript", "TypeScript", "Prometheus", "Grafana", "Sentry"].map((t) =>
            <span key={t} className="chip">{t}</span>
            )}
          </div>
        </div>

        <div className="box">
          <div className="bt">▌ system.info</div>
          <div className="kv" style={{ marginBottom: 16 }}>
            <span className="k">who</span><span className="v">CS Student · 3rd year</span>
            <span className="k">focus</span><span className="v">Backend · System Design</span>
            <span className="k">stack</span><span className="v">Go · Python · Postgres</span>
            <span className="k">tools</span><span className="v">Docker · Redis · Linux</span>
            <span className="k">motto</span><span className="v">stay hungry, keep shipping</span>
          </div>
          <div className="bt">▌ proficiency <span className="muted" style={{ textTransform: "none", letterSpacing: 0 }}>(self-rated)</span></div>
          {window.PROFICIENCY.map((m) => <Meter key={m.label} label={m.label} pct={m.pct} note={m.note} />)}
        </div>
      </div>

      <hr className="rule" />
      <p className="muted">Type <span className="kbd">skills</span> or press <span className="kbd">2</span> to explore the backend concept visualizations →</p>
    </div>);

}

// self-rated skill bars — edit pct (0-100) / note freely
window.PROFICIENCY = [
{ label: "Go", pct: 68, note: "comfortable" },
{ label: "Python", pct: 68, note: "comfortable" },
{ label: "SQL & Databases", pct: 68, note: "comfortable" },
{ label: "APIs & HTTP", pct: 68, note: "comfortable" },
{ label: "Linux & Git", pct: 68, note: "comfortable" },
{ label: "DSA", pct: 68, note: "comfortable" },
{ label: "System Design", pct: 45, note: "learning" },
{ label: "JavaScript / TS", pct: 45, note: "learning" }];


function SkillsIndex({ concepts, onOpen }) {
  return (
    <div className="content fadein">
      <div className="cmdline"><span className="p">~/portfolio $</span> ls skills/</div>
      <h1>Backend concepts, visualized</h1>
      <p className="muted">Current core ideas for system design I have been learning and familiar with, visualize in high-level, more to come in future...</p>
      <div className="concept-grid" style={{ marginTop: 18 }}>
        {concepts.map((c, i) =>
        <div key={c.id} className="concept-card" onClick={() => onOpen(c.id)}>
            <div className="cc-ico">{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="cc-title">{c.title}</div>
              <div className="cc-desc">{c.blurb}</div>
            </div>
            <div className="cc-n">{String(i + 1).padStart(2, "0")}</div>
          </div>
        )}
      </div>
    </div>);
}

const PROJECTS = [
{ id: "puretube", title: "PureTube", status: "wip", desc: "An app that filters your feed down to a specific topic from YouTube Shorts, using the YouTube Data API.", stack: ["Go", "YouTube API", "Redis"], link: null, img: "assets/puretube.png", w: 719, h: 745 },
{ id: "til", title: "TIL — Today I Learned", status: "live", desc: "A CLI + TUI tool for logging and reviewing programming discoveries. Entries persist to SQLite and resurface through an SM-2 spaced-repetition review system.", stack: ["Go", "SQLite", "Cobra", "Bubbletea", "sqlc", "Goose"], link: "https://github.com/BrendReyes/TIL", img: "assets/til.gif", poster: "assets/til-poster.png", w: 1000, h: 700 }, // landscape
{ id: "pdforge", title: "PDForge", status: "live", desc: "A CLI tool for PDF file management built on pdfcpu, structured as a Cobra command tree for composable subcommands.", stack: ["Go", "Cobra", "pdfcpu"], link: "https://github.com/BrendReyes/pdforge", img: "assets/pdforge.gif", poster: "assets/pdforge-poster.png", w: 1100, h: 1500 }]; // tall portrait


function ProjectCard({ p }) {
  const [hover, setHover] = React.useState(false);
  const [token, setToken] = React.useState(0); // bump on each hover to restart the gif
  const isGif = p.img && p.img.endsWith(".gif");
  const statusColor = p.status === "wip" ? "var(--warn)" : "var(--accent-2)";
  const file = isGif ? "demo.gif" : p.img ? "screens.png" : "preview";
  // gif: static poster while idle, animated gif (forced to restart) while hovered
  const gifSrc = hover ? p.img + "?play=" + token : p.poster || p.img;
  // non-clickable card when there's no repo link yet (e.g. work in progress)
  const Root = p.link ? "a" : "div";
  const linkProps = p.link ? { href: p.link, target: "_blank", rel: "noreferrer" } : {};
  return (
    <Root
      className={"pcard" + (isGif ? " pcard--gif" : "") + (p.link ? "" : " pcard--nolink")}
      style={{ width: 380, maxWidth: "100%" }}
      {...linkProps}
      onMouseEnter={() => {setHover(true);setToken((t) => t + 1);}}
      onMouseLeave={() => setHover(false)}>
      <div className="pcard-bar">
        <span className="dots"><i></i><i></i><i></i></span>
        <span className="path">~/{p.id} ▸ {file}</span>
      </div>
      <div className="pcard-media" style={{ aspectRatio: p.w + " / " + p.h }}>
        {isGif ?
        <img className="shot" src={gifSrc} alt={p.title} /> :
        p.img ?
        <img className="shot" src={p.img} alt={p.title} /> :
        <div className="pcard-cover"><span className="hint">no preview yet</span></div>}
        {isGif &&
        <span className="pcard-badge"><span className="pb-dot"></span>live demo · hover to play</span>}
        <div className="pcard-overlay">
          <div className="od">{p.desc}</div>
          <div className="ostk">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
          <div className="oprompt"><span className="pp">~/portfolio $</span> {p.link ? "open " + p.id : "building " + p.id + "\u2026"}<span className="cur">_</span></div>
        </div>
      </div>
      <div className="pcard-foot">
        <span className="st" style={{ background: statusColor }}></span>
        <span className="pt">{p.title}</span>
        {p.link ?
        <span className="ext">GitHub ↗</span> :
        <span className="ext wip-tag">in progress</span>}
      </div>
    </Root>);

}

function Projects() {
  return (
    <div className="content fadein">
      <div className="cmdline"><span className="p">~/portfolio $</span> ls projects/</div>
      <h1>Selected work</h1>
      <p className="muted">A few things I've built. Hover a card to run its demo — click to open the repo.</p>
      <div className="proj-cards" style={{ marginTop: 20 }}>
        {PROJECTS.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
      <p className="muted" style={{ marginTop: 20, fontSize: 12.5 }}>More on my GitHub — <a href="https://github.com/BrendReyes" target="_blank" rel="noreferrer">github.com/BrendReyes</a></p>
    </div>);

}

const ROADMAP = [
{ when: "May 2025", state: "done", title: "Database Certification", desc: "First formal milestone — relational modeling, SQL, and the fundamentals of how data is stored and queried." },
{ when: "Jul 2025", state: "done", title: "Chose the Backend path", desc: "Finally committed to specializing in Backend Engineering & System Design." },
{ when: "Aug 2025", state: "done", title: "Python", desc: "Picked up Python as a primary language for building and scripting." },
{ when: "Oct 2025", state: "done", title: "OOP", desc: "Object-oriented design — classes, abstraction, and structuring larger programs." },
{ when: "Nov 2025", state: "done", title: "Linux + Python Certification", desc: "Linux course (the shell, files, processes) and a Python certification." },
{ when: "Jan 2026", state: "done", title: "Git, DSA & BookBot", desc: "Version control with Git, data structures & algorithms, and BookBot — my first text-analysis project." },
{ when: "Feb 2026", state: "done", title: "Go, HTTP clients & more", desc: "Python Asteroids game, started Go, built HTTP clients, and a Pokedex CLI." },
{ when: "Mar 2026", state: "done", title: "SQL course", desc: "Deeper SQL — joins, indexes, and writing queries that scale." },
{ when: "Apr 2026", state: "done", title: "Blog Aggregator", desc: "An RSS blog aggregator — feeds, persistence, and scheduled fetching in Go." },
{ when: "May 2026", state: "done", title: "HTTP servers & PureTube", desc: "Built HTTP servers and kicked off development of PureTube, my YouTube Shorts topic filter." },
{ when: "Jun 2026", state: "done", title: "File servers, CDNs", desc: "Learned how file servers & CDNs store, serve, and cache static assets." },
{ when: "Jun 2026 · now", state: "now", title: "Docker & CI/CD", desc: "Containerizing apps with Docker, and automating build–test–deploy pipelines with CI/CD & GitHub Actions — wrapping up both this month." },
{ when: "Jul 2026", state: "todo", title: "Pub/Sub Architecture", desc: "Event-driven messaging — decoupling services with message queues and publish/subscribe so work happens asynchronously." },
{ when: "Aug 2026", state: "todo", title: "Observability & AWS", desc: "Logging and observability with Grafana, plus first steps into AWS." },
{ when: "Sep 2026", state: "todo", title: "Kubernetes", desc: "Orchestrating containers at scale — scheduling, scaling, and self-healing." },
{ when: "Oct 2026", state: "todo", title: "JavaScript & TypeScript", desc: "Rounding out the stack with typed, modern JS." },
{ when: "Nov 2026", state: "todo", title: "To be decided…", desc: "The road keeps going. Whatever's next, I'll stay hungry." }];


function Roadmap() {
  return (
    <div className="content fadein">
      <div className="cmdline"><span className="p">~/portfolio $</span> cat roadmap.md</div>
      <h1>The journey</h1>
      <p className="muted" style={{ fontWeight: "400", width: "630px" }}>Where I've been, where I am, and what's planned. <span className="dotpulse" style={{ color: "var(--accent)" }}>◆</span> = current focus.</p>

      <div className="capstone">
        <div className="cap-top">
          <span className="cap-tag">▌ capstone project</span>
          <span className="cap-status"><span className="cap-dot" />in progress</span>
        </div>
        <div className="cap-name">PureTube<span className="cap-cursor">_</span></div>
        <div className="cap-tagline">Filtering YouTube Shorts down to a single topic via the YouTube Data API — my long-running build that spans the milestones below.</div>
      </div>

      <div className="timeline" style={{ marginTop: 22 }}>
        {ROADMAP.map((r, i) =>
        <div key={i} className={"tl-item " + (r.state === "done" ? "done" : r.state === "now" ? "now" : "")}>
            <div className="tl-when">{r.when}</div>
            <div className="tl-title">{r.title}
              <span className="st">{r.state === "done" ? "done" : r.state === "now" ? "in progress" : "planned"}</span>
            </div>
            <div className="tl-desc">{r.desc}</div>
          </div>
        )}
      </div>
    </div>);

}

const EXP = [
{
  role: "Front-End / Back-End Developer Intern", org: "@ Philippine Food Bank Foundation Inc.", when: "May 2025 – Sep 2025 · Remote",
  bullets: [
  "Sole frontend developer on a 3-person team building a donor & beneficiary management platform for a nonprofit — owned the entire UI layer end-to-end.",
  "Refactored duplicated UI into a shared React + Vite component library for consistent rendering across mobile, tablet, and desktop.",
  "Centralized Supabase API calls into a service layer and integrated AuthContext for role-based UI across Admin, Donor, and Beneficiary roles.",
  "Integrated Supabase real-time subscriptions to sync client–server state live, replacing polling with instant UI updates across sessions.",
  "Collaborated with backend and QA to validate schema contracts and surface inconsistencies before production."]

}];


function Experience() {
  return (
    <div className="content fadein">
      <div className="cmdline"><span className="p">~/portfolio $</span> cat experience.log</div>
      <h1>Experience</h1>
      <div style={{ marginTop: 18 }}>
        {EXP.map((e, i) =>
        <div key={i} className="exp">
            <span className="when">{e.when}</span>
            <div className="role">{e.role} <span className="org">{e.org}</span></div>
            <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        )}
      </div>
      <hr className="rule" />
      <p className="muted">More at <a href="https://github.com/BrendReyes" target="_blank" rel="noreferrer">github.com/BrendReyes</a> · <a href="mailto:brendreyes1234w@gmail.com">brendreyes1234w@gmail.com</a></p>
    </div>);

}

/* ============================================================
   Certifications & courses — grouped by provider
   ============================================================ */
const ITS_CERTS = [
{ t: "ITS Databases", iss: "Certiport", when: "May 2025" },
{ t: "ITS Python", iss: "Certiport", when: "Nov 2025" }];


const BOOTDEV = [
{ t: "Learn Python", s: "done" },
{ t: "Learn Linux", s: "done" },
{ t: "Build BookBot", s: "done" },
{ t: "Learn Git", s: "done" },
{ t: "Object-Oriented Programming", s: "done" },
{ t: "Algorithms & Data Structures", s: "done" },
{ t: "Learn Go", s: "done" },
{ t: "Learn HTTP Clients in Go", s: "done" },
{ t: "Build a Pokedex", s: "done" },
{ t: "Learn SQL", s: "done" },
{ t: "Build a Blog Aggregator", s: "done" },
{ t: "Learn HTTP Servers", s: "done" },
{ t: "Learn File Servers & CDNs", s: "done" },
{ t: "Learn Docker", s: "wip" },
{ t: "Learn CI/CD", s: "wip" }];


function Certs() {
  const bdDone = BOOTDEV.filter((c) => c.s === "done").length;
  const bdWip = BOOTDEV.filter((c) => c.s === "wip").length;
  return (
    <div className="content fadein">
      <div className="cmdline"><span className="p">~/portfolio $</span> ls certs/</div>
      <h1>Certifications &amp; courses</h1>
      <p className="muted">Proof of work — formal certifications and the self-study courses I grind through. Grouped by where they came from.</p>

      {/* ---- Certiport / ITS ---- */}
      <div className="prov">
        <div className="prov-head">
          <div className="prov-logo its"><img src="assets/its-logo.png" alt="Information Technology Specialist" /></div>
          <div className="prov-id">
            <div className="prov-name">Information Technology Specialist</div>
            <div className="prov-meta">Certiport · industry certification · <b className="ac2">{ITS_CERTS.length} earned</b></div>
          </div>
          <span className="prov-tag">certification</span>
        </div>
        <div className="cert-list">
          {ITS_CERTS.map((c) =>
          <div key={c.t} className="cert-row">
              <span className="cert-seal">✓</span>
              <div className="cert-main">
                <div className="cert-t">{c.t}</div>
                <div className="cert-iss">{c.iss}</div>
              </div>
              <span className="cert-when">{c.when}</span>
              <span className="cert-status">certified</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- boot.dev ---- */}
      <div className="prov">
        <div className="prov-head">
          <div className="prov-logo bd"><img src="assets/bootdev-logo.png" alt="boot.dev" /></div>
          <div className="prov-id">
            <div className="prov-name">boot.dev</div>
            <div className="prov-meta">self-study · backend career path · <b className="ac2">{bdDone} completed</b> · <b className="ac">{bdWip} in progress</b></div>
          </div>
          <span className="prov-tag">courses</span>
        </div>
        <div className="course-grid">
          {BOOTDEV.map((c) =>
          <div key={c.t} className={"course-cell" + (c.s === "wip" ? " wip" : "")}>
              <span className="cdot" />
              <span className="ct">{c.t}</span>
              <span className="cstat">{c.s === "wip" ? "in progress" : "✓"}</span>
            </div>
          )}
        </div>
      </div>

      <hr className="rule" />
      <p className="muted">Verify the boot.dev grind on my profile → <a href="https://www.boot.dev/u/wryhour25" target="_blank" rel="noreferrer">boot.dev/u/wryhour25</a></p>
    </div>);

}

Object.assign(window, { About, SkillsIndex, Projects, Roadmap, Experience, Certs, PROJECTS });