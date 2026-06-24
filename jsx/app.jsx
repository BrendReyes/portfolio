/* ============================================================
   app.jsx — shell, boot, intro, navigation (type / click / keys)
   ============================================================ */
const { useState: uS, useEffect: uE, useRef: uR } = React;

// merge all scenes in display order
const SCENES = { ...window.SCENES_A, ...window.SCENES_B };
const TypedView = window.TypedView;
const CONCEPT_ORDER = ["caching", "auth", "db", "http", "rate", "cors", "lb", "queue", "cicd"];
const CONCEPTS = CONCEPT_ORDER.map((id) => SCENES[id]).filter(Boolean);

const NAV = [
  { id: "about", label: "about" },
  { id: "skills", label: "skills" },
  { id: "projects", label: "projects" },
  { id: "certs", label: "certs" },
  { id: "roadmap", label: "roadmap" },
  { id: "experience", label: "experience" },
];

const ASCII = [
  " ___ ___ ___ _  _ ___",
  "| _ ) _ \\ __| \\| |   \\",
  "| _ \\   / _|| .` | |) |",
  "|___/_|_\\___|_|\\_|___/",
].join("\n");

const BOOT = [
  { t: "cozyOS 4.0.1 — booting…", c: "ac" },
  { t: "[ OK ] mounting /dev/portfolio", c: "ok" },
  { t: "[ OK ] starting phosphor display service", c: "ok" },
  { t: "[ OK ] warming cache layer … hit ratio 0.0%", c: "ok" },
  { t: "[ OK ] opening connection pool (8 conns)", c: "ok" },
  { t: "[ OK ] loading skills/*.viz … 9 modules", c: "ok" },
  { t: "[ OK ] auth · http · cache · db · queues ready", c: "ok" },
  { t: "login: brend (autologin)", c: "dim" },
  { t: "welcome.", c: "ac" },
];

function Boot({ onDone }) {
  const [n, setN] = uS(0);
  uE(() => {
    if (n >= BOOT.length) { const t = setTimeout(onDone, 650); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), n === 0 ? 300 : 150 + Math.random() * 130);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="boot power-on">
      <div className="big">{ASCII}</div>
      {BOOT.slice(0, n).map((l, i) => (
        <div key={i} className={"line " + (l.c || "")}>{l.t}</div>
      ))}
      {n < BOOT.length && <span className="typed-cursor">_</span>}
    </div>
  );
}

// typewriter for the intro
function Typer({ lines, onDone }) {
  const [done, setDone] = uS([]);
  const [cur, setCur] = uS("");
  const [li, setLi] = uS(0);
  const [ci, setCi] = uS(0);
  uE(() => {
    if (li >= lines.length) { onDone && onDone(); return; }
    const full = lines[li].text;
    if (ci <= full.length) {
      const t = setTimeout(() => { setCur(full.slice(0, ci)); setCi(ci + 1); }, 14 + Math.random() * 22);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setDone((d) => [...d, lines[li]]); setCur(""); setCi(0); setLi(li + 1); }, lines[li].pause || 240);
      return () => clearTimeout(t);
    }
  }, [ci, li]);
  return (
    <div>
      {done.map((l, i) => <div key={i} className={l.cls}>{l.text}</div>)}
      {li < lines.length && <div className={lines[li].cls}>{cur}<span className="typed-cursor">_</span></div>}
    </div>
  );
}

function Intro({ onPick }) {
  const [ready, setReady] = uS(false);
  const lines = [
    { text: "$ ./portfolio --start", cls: "cmdline", pause: 350 },
    { text: "Hi, I'm Brend — a backend engineering student.", cls: "lead2", pause: 260 },
    { text: "This is my portfolio, built as a terminal--purely vibecoded... HA!", cls: "sub2", pause: 220 },
    { text: "The main attraction: live visualizations of the backend", cls: "sub2", pause: 60 },
    { text: "concepts I'm learning — caching, auth, databases, HTTP,", cls: "sub2", pause: 60 },
    { text: "rate limiting, CORS, load balancing & queues, basically everything in backend... duh", cls: "sub2", pause: 300 },
    { text: "› type a command, click the menu, or press 1–6.", cls: "hintline", pause: 0 },
  ];
  return (
    <div className="content fadein" style={{ paddingTop: 6 }}>
      <Typer lines={lines} onDone={() => setReady(true)} />
      {ready && (
        <div className="quick fadein">
          {NAV.map((nv, i) => (
            <button key={nv.id} className="tb-btn" onClick={() => onPick(nv.id)}>
              <span className="k">{i + 1}</span> {nv.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemePop({ current, onPick, onClose }) {
  uE(() => {
    const h = () => onClose();
    const t = setTimeout(() => document.addEventListener("click", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("click", h); };
  }, []);
  return (
    <div className="theme-pop" onClick={(e) => e.stopPropagation()}>
      {window.THEME_ORDER.map((name) => {
        const t = window.THEMES[name];
        return (
          <div key={name} className={"tp-row" + (name === current ? " on" : "")} onClick={() => onPick(name)}>
            <span className="sw">{t.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
            {t.label}{name === current ? " ✓" : ""}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [phase, setPhase] = uS("boot");        // boot | intro | nav
  const [view, setView] = uS("about");          // nav id, or "viz"
  const [vizId, setVizId] = uS(null);
  const [theme, setTheme] = uS(window.initTheme());
  const [crt, setCrt] = uS(true);
  const [themeOpen, setThemeOpen] = uS(false);
  const [cmd, setCmd] = uS("");
  const [err, setErr] = uS("");
  const inputRef = uR(null);

  uE(() => { document.body.classList.toggle("crt", crt); }, [crt]);

  const go = (v) => { setErr(""); if (v === "intro") { setPhase("intro"); return; } setPhase("nav"); setView(v); setVizId(null); };
  const openViz = (id) => { setView("viz"); setVizId(id); };

  const setTheme2 = (name) => { window.applyTheme(name); setTheme(name); };
  const cycleTheme = () => {
    const o = window.THEME_ORDER; const i = o.indexOf(theme);
    setTheme2(o[(i + 1) % o.length]);
  };

  // command parser
  const runCmd = (raw) => {
    const s = raw.trim().toLowerCase();
    setCmd("");
    if (!s) return;
    setErr("");
    const navHit = NAV.find((n) => n.id === s || n.label === s);
    if (navHit) return go(navHit.id);
    if (["home", "intro", "start", "clear"].includes(s)) return go("intro");
    if (["help", "?", "ls", "menu"].includes(s)) { setView("about"); setPhase("nav"); return; }
    if (s.startsWith("cd ")) { const x = s.slice(3).trim().replace(/\/$/, ""); const h = NAV.find((n) => n.label === x); if (h) return go(h.id); }
    if (s.startsWith("theme")) {
      const x = s.replace("theme", "").trim();
      if (!x || x === "next") return cycleTheme();
      const match = window.THEME_ORDER.find((t) => t.startsWith(x) || window.THEMES[t].label.startsWith(x));
      if (match) return setTheme2(match);
      setErr("unknown theme: " + x); return;
    }
    if (s === "crt") return setCrt((c) => !c);
    // open a concept by name
    const sc = CONCEPTS.find((c) => c.id === s || c.title.toLowerCase().includes(s));
    if (sc) { setPhase("nav"); openViz(sc.id); return; }
    setErr("command not found: " + s + " — try 'help'");
  };

  // keyboard nav
  uE(() => {
    const onKey = (e) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === "Escape") inputRef.current.blur();
        return;
      }
      if (e.key >= "1" && e.key <= "6") { go(NAV[+e.key - 1].id); }
      else if (e.key === "j") { const i = NAV.findIndex((n) => n.id === view); go(NAV[Math.min((i < 0 ? 0 : i) + 1, NAV.length - 1)].id); }
      else if (e.key === "k") { const i = NAV.findIndex((n) => n.id === view); go(NAV[Math.max((i < 0 ? 0 : i) - 1, 0)].id); }
      else if (e.key === "t") { cycleTheme(); }
      else if (e.key === "/") { e.preventDefault(); inputRef.current && inputRef.current.focus(); }
      else if (e.key === "Escape" && view === "viz") { go("skills"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, theme]);

  if (phase === "boot") return <Boot onDone={() => setPhase("intro")} />;

  const renderMain = () => {
    if (phase === "intro") return <Intro onPick={(v) => go(v)} />;
    if (view === "viz" && vizId) return <VizPlayer scene={SCENES[vizId]} onBack={() => go("skills")} />;
    let el;
    switch (view) {
      case "about": el = <About />; break;
      case "skills": el = <SkillsIndex concepts={CONCEPTS} onOpen={openViz} />; break;
      case "projects": el = <Projects />; break;
      case "certs": el = <Certs />; break;
      case "roadmap": el = <Roadmap />; break;
      case "experience": el = <Experience />; break;
      default: el = <About />;
    }
    return <TypedView key={view} id={view} animate={!window.TW_SEEN.has(view)}>{el}</TypedView>;
  };

  const activeNav = phase === "nav" ? (view === "viz" ? "skills" : view) : null;

  return (
    <div className="app">
      <div className="titlebar">
        <div className="dots"><span className="dot r" /><span className="dot y" /><span className="dot g" /></div>
        <div className="tb-title"><b>brend@cozyOS</b>:~/portfolio</div>
        <div className="spacer" />
        <div className="tb-meta">
          <button className="tb-btn" onClick={() => setCrt((c) => !c)}>CRT <span className="k">{crt ? "on" : "off"}</span></button>
          <div style={{ position: "relative" }}>
            <button className="tb-btn" onClick={(e) => { e.stopPropagation(); setThemeOpen((o) => !o); }}>
              theme <span className="k">{window.THEMES[theme].label}</span> ▾
            </button>
            {themeOpen && <ThemePop current={theme} onPick={(n) => { setTheme2(n); setThemeOpen(false); }} onClose={() => setThemeOpen(false)} />}
          </div>
        </div>
      </div>

      <div className="body">
        <div className="panel menu">
          <div className="panel-t">menu</div>
          <pre className="ascii">{ASCII}</pre>
          <div className="mlabel">navigate</div>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id} className={activeNav === n.id ? "active" : ""} onClick={() => go(n.id)}>
                <span className="idx">{i + 1}</span>
                <span className="arrow">›</span>
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
          <div className="mfoot">
            <span className="dotpulse">◆</span> open to backend internships<br />
            <a href="https://github.com/BrendReyes" target="_blank" rel="noreferrer" className="mlink">github</a> · <a href="mailto:brendreyes1234w@gmail.com" className="mlink">email</a><br />
            <span className="muted" style={{ fontSize: 10.5 }}>j/k move · 1-6 jump · / search · t theme</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-t">{view === "viz" ? "skills / " + (SCENES[vizId] ? SCENES[vizId].title.toLowerCase() : "") : (phase === "intro" ? "session" : view)}</div>
          <div className="panel-body">{renderMain()}</div>
        </div>
      </div>

      <div className="statusbar">
        <span className="prompt">brend@cozyOS</span>
        <form onSubmit={(e) => { e.preventDefault(); runCmd(cmd); }}>
          <input ref={inputRef} value={cmd} placeholder={err || "type a command — try 'skills', 'theme green', 'caching', 'help'"}
            onChange={(e) => { setCmd(e.target.value); setErr(""); }}
            style={err ? { } : {}} />
        </form>
        {err ? <span className="hint" style={{ color: "var(--err)" }}>{err}</span> : (
          <span className="hint">
            <span><span className="k">/</span> focus</span>
            <span><span className="k">t</span> theme</span>
            <span><span className="k">esc</span> back</span>
          </span>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
