/* ============================================================
   stage.jsx — generic visualization engine
   A "scene" is pure data. VizPlayer interprets it:
     scene = {
       title, icon, blurb,
       tabs: [{
         name,
         initial?: {...freeform state},
         nodes: [{id,label,sub?,x,y,w?,render?(state)}],   // x,y in 0..100
         edges: [{from,to,dash?,arrow?}],
         steps: [{
           caption, log?:{text,kind?},
           packet?:{from,to,label,kind?}, packets?:[...],
           active?:[id], dim?:[id], set?:{...statePatch}
         }]
       }]
     }
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

function nodeXY(nodes, id) {
  const n = nodes.find((x) => x.id === id);
  return n ? { x: n.x, y: n.y } : { x: 50, y: 50 };
}

function Stage({ nodes, edges, state, activeSet, dimSet, packets, moving }) {
  return (
    <div className="stage">
      <svg className="edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--border-bright)" />
          </marker>
        </defs>
        {(edges || []).map((e, i) => {
          const a = nodeXY(nodes, e.from), b = nodeXY(nodes, e.to);
          return (
            <line key={i} className={"edge" + (e.dash ? " dash" : "")}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              vectorEffect="non-scaling-stroke"
              markerEnd={e.arrow ? "url(#arrow)" : undefined} />
          );
        })}
      </svg>

      {nodes.map((n) => {
        const cls = ["node"];
        if (activeSet.has(n.id)) cls.push("active");
        if (dimSet.has(n.id)) cls.push("dim");
        return (
          <div key={n.id} className={cls.join(" ")}
            style={{ left: n.x + "%", top: n.y + "%", width: n.w ? n.w + "px" : undefined }}>
            <div className="nt">{n.label}</div>
            {n.sub && <div className="ns">{n.sub}</div>}
            {n.render && n.render(state)}
          </div>
        );
      })}

      {packets.map((p) => {
        const pos = moving ? p.to : p.from;
        return (
          <div key={p.id}
            className={"packet " + (p.kind || "") + (moving ? "" : "")}
            style={{
              left: pos.x + "%", top: pos.y + "%",
              transition: moving ? undefined : "none",
            }}>
            {p.label}
          </div>
        );
      })}
    </div>
  );
}

function VizPlayer({ scene, onBack }) {
  const [tabIdx, setTabIdx] = useState(0);
  const tab = scene.tabs[tabIdx];
  const steps = tab.steps;

  const [step, setStep] = useState(0);          // index of current (just-executed) step
  const [started, setStarted] = useState(false);   // false = static ready state, step 1 not yet executed
  const [playing, setPlaying] = useState(false);   // start paused — user presses play to begin
  const [speed, setSpeed] = useState(1);
  const [moving, setMoving] = useState(false);
  const logRef = useRef(null);
  const timer = useRef(null);
  const stageScrollRef = useRef(null);

  // reset when tab changes — static ready state, paused
  useEffect(() => { setStep(0); setStarted(false); setPlaying(false); setMoving(false); }, [tabIdx, scene]);

  // derive accumulated state up to current step (nothing applied until started)
  const state = useMemo(() => {
    let s = { ...(tab.initial || {}) };
    const last = started ? step : -1;
    for (let i = 0; i <= last && i < steps.length; i++) {
      if (steps[i].set) s = { ...s, ...steps[i].set };
    }
    return s;
  }, [tab, step, steps, started]);

  const cur = started ? (steps[step] || {}) : {};   // no effects until started
  const activeSet = useMemo(() => new Set(cur.active || []), [cur]);
  const dimSet = useMemo(() => new Set(cur.dim || []), [cur]);

  // packets for current step (place at from, then move to)
  const packets = useMemo(() => {
    const list = cur.packets || (cur.packet ? [cur.packet] : []);
    return list.map((p, i) => ({
      id: step + "-" + i,
      label: p.label, kind: p.kind,
      from: nodeXY(tab.nodes, p.from),
      to: nodeXY(tab.nodes, p.to),
    }));
  }, [cur, step, tab.nodes]);

  // trigger packet motion on each step (only once started)
  useEffect(() => {
    if (!started) { setMoving(false); return; }
    setMoving(false);
    const t = setTimeout(() => setMoving(true), 60);
    return () => clearTimeout(t);
  }, [step, tabIdx, started]);

  // autoplay
  useEffect(() => {
    if (!playing || !started) return;
    if (step >= steps.length - 1) { setPlaying(false); return; }
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1500 / speed);
    return () => clearTimeout(timer.current);
  }, [playing, started, step, steps.length, speed]);

  // autoscroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [step, tabIdx]);

  // mobile: flag when the diagram can still be scrolled right (drives the fade + chevron hint)
  useEffect(() => {
    const el = stageScrollRef.current;
    if (!el) return;
    const wrap = el.parentElement;
    const update = () => {
      const more = el.scrollWidth - el.clientWidth - el.scrollLeft > 4;
      wrap && wrap.classList.toggle("more", more);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [tabIdx, scene]);

  const atEnd = started && step >= steps.length - 1;
  const restart = () => { setStarted(false); setStep(0); setMoving(false); setPlaying(false); }; // back to ready, paused
  const replay = () => { setStarted(true); setStep(0); setMoving(false); setPlaying(true); };    // rewind and play
  const start = () => { if (!started) { setStarted(true); setPlaying(true); } else { setPlaying((p) => !p); } };
  const next = () => {
    setPlaying(false);
    if (!started) { setStarted(true); return; }     // first next reveals step 1
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => {
    setPlaying(false);
    if (step === 0) { setStarted(false); return; }  // back past step 1 = ready state
    setStep((s) => Math.max(s - 1, 0));
  };

  // log lines = steps 0..step that have logs (none until started)
  const logLines = [];
  const logLast = started ? step : -1;
  for (let i = 0; i <= logLast && i < steps.length; i++) {
    if (steps[i].log) logLines.push({ i, ...steps[i].log });
  }

  return (
    <div className="viz fadein">
      <div className="viz-head">
        <span className="back" onClick={onBack}>← skills</span>
        <h1><span style={{ color: "var(--accent)" }}>{scene.icon} </span>{scene.title}</h1>
      </div>
      {scene.blurb && <p className="muted" style={{ fontSize: "13px", marginTop: "-4px" }}>{scene.blurb}</p>}

      <div className="viz-tabs">
        {scene.tabs.map((t, i) => (
          <button key={i} className={"viz-tab" + (i === tabIdx ? " on" : "")} onClick={() => setTabIdx(i)}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="viz-main">
        <div className="stage-scroll">
          <div className="stage-wrap" ref={stageScrollRef}>
            <Stage nodes={tab.nodes} edges={tab.edges} state={state}
              activeSet={activeSet} dimSet={dimSet} packets={packets} moving={moving} />
          </div>
        </div>
        <div className="log">
          <div className="log-t">▌ event log — {tab.name}</div>
          <div className="log-body" ref={logRef}>
            {logLines.map((l) => (
              <div key={l.i} className={"ll " + (l.kind || "")}>
                <span className="t">{String(l.i + 1).padStart(2, "0")} </span>{l.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="viz-ctrl">
        <button className="ctrl-btn" onClick={restart} title="restart">⏮</button>
        <button className="ctrl-btn" onClick={prev} disabled={!started}>‹ prev</button>
        {atEnd
          ? <button className="ctrl-btn primary" onClick={replay}>↻ replay</button>
          : <button className="ctrl-btn primary" onClick={start}>{playing ? "⏸ pause" : "▶ play"}</button>}
        <button className="ctrl-btn" onClick={next} disabled={atEnd}>next ›</button>
        <div className="speed">
          spd
          {[0.5, 1, 2].map((s) => (
            <button key={s} className={"ctrl-btn" + (speed === s ? " primary" : "")}
              style={{ padding: "2px 7px", fontSize: "11px" }} onClick={() => setSpeed(s)}>{s}×</button>
          ))}
        </div>
        <span className="step-info">step {step + 1} / {steps.length}</span>
        <div className="caption">{cur.caption || ""}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Stage, VizPlayer, nodeXY });
