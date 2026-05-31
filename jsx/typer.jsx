/* ============================================================
   typer.jsx — per-tab first-visit typewriter reveal
   • Types the command line first (prompt stays, command types)
   • Reveals every element progressively, top to bottom — containers
     collapse (display:none) until reached, so nodes/boxes/lines draw
     in node-by-node alongside their text rather than as empty shells
   • Hold Space/Enter = fast-forward · tap Space/Enter = skip
   • First visit per session animates; revisit is instant
   ============================================================ */

const TW_SEEN = new Set();   // tabs already animated this session
const TW_SPEED = 2;          // 1 (slow) .. 10 (fast)

function twBaseDelay() { return Math.max(3, 24 - TW_SPEED * 3); } // ~18ms at 2

function TypedViewImpl({ id, animate, children }) {
  const wrapRef = React.useRef(null);
  const [typing, setTyping] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!animate) return;
    TW_SEEN.add(id);                       // mark immediately (revisit = instant)
    const wrap = wrapRef.current;
    if (!wrap) return;
    const content = wrap.querySelector(".content") || wrap;

    const S = { cancelled: false, boost: false };
    let finished = false;
    let caret = null;
    const ALL_TEXT = [];   // {node, full}
    const ALL_EL = [];     // elements hidden during typing
    const ops = [];        // ordered reveal/text operations

    // ---------- preprocess (synchronous, before paint) ----------
    // hide every descendant element so the structure collapses, then
    // empty every text run; we replay both in document order.
    const tw = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    // elements that reveal as a whole with a slide-up animation (not char-typed inside)
    const RISE_SEL = ".pcard, .prov-logo";                                  // big cards / logos
    const BOX_SEL = ".box, .kv, .concept-card, .cert-row, .course-cell, .tl-item, .exp"; // text boxes — subtle
    const riseRoots = Array.from(content.querySelectorAll(RISE_SEL));
    const boxRoots = Array.from(content.querySelectorAll(BOX_SEL));
    const allAtomic = riseRoots.concat(boxRoots);
    const insideAtomic = (node) => allAtomic.some((r) => r !== node && r.contains(node));

    while ((n = tw.nextNode())) {
      if (n.nodeType === 1) {
        if (insideAtomic(n)) continue;        // descendant of an atomic unit — leave intact
        if (riseRoots.indexOf(n) !== -1) {
          n.style.display = "none";          // hide the whole unit; its subtree rides along
          ALL_EL.push(n);
          ops.push({ kind: "rise", node: n });
          continue;
        }
        if (boxRoots.indexOf(n) !== -1) {
          n.style.display = "none";
          ALL_EL.push(n);
          ops.push({ kind: "boxrise", node: n });
          continue;
        }
        n.style.display = "none";
        ALL_EL.push(n);
        ops.push({ kind: "reveal", node: n });
      } else if (n.nodeType === 3) {
        if (insideAtomic(n)) continue;        // text inside an atomic unit stays put
        const full = n.nodeValue;
        if (!full || !full.trim()) continue;                       // skip whitespace
        if (n.parentElement && n.parentElement.closest(".p")) continue; // prompt stays put
        ALL_TEXT.push({ node: n, full });
        n.nodeValue = "";
        ops.push({ kind: "text", node: n, full });
      }
    }

    setTyping(true);

    // ---------- helpers ----------
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const removeCaret = () => {
      if (caret && caret.parentNode) { try { caret.parentNode.removeChild(caret); } catch (e) {} }
      caret = null;
    };
    const placeCaret = (node) => {
      removeCaret();
      caret = document.createElement("span");
      caret.className = "tw-caret";
      if (node.parentNode) node.parentNode.insertBefore(caret, node.nextSibling);
    };

    const revealAll = () => {
      S.cancelled = true; finished = true;
      removeCaret();
      ALL_TEXT.forEach((o) => { o.node.nodeValue = o.full; });
      ALL_EL.forEach((el) => { el.style.display = ""; el.classList.remove("tw-rise", "tw-rise-soft"); });
      setTyping(false);
    };

    // ---------- play ----------
    (async () => {
      for (const op of ops) {
        if (S.cancelled) return;
        if (op.kind === "reveal") {
          op.node.style.display = ""; // structure pops in just before its text
          continue;
        }
        if (op.kind === "rise") {
          op.node.style.display = "";
          op.node.classList.add("tw-rise");
          op.node.addEventListener("animationend", () => op.node.classList.remove("tw-rise"), { once: true });
          await sleep(S.boost ? 40 : 170); // stagger each card/logo as it slides up
          continue;
        }
        if (op.kind === "boxrise") {
          op.node.style.display = "";
          op.node.classList.add("tw-rise-soft");
          op.node.addEventListener("animationend", () => op.node.classList.remove("tw-rise-soft"), { once: true });
          await sleep(S.boost ? 22 : 80); // subtler, tighter stagger for text boxes
          continue;
        }
        const full = op.full;
        placeCaret(op.node);
        let i = 0;
        while (i < full.length) {
          if (S.cancelled) return;
          const step = S.boost ? 8 : 1;          // chunk while fast-forwarding (beats the 4ms timer floor)
          i = Math.min(full.length, i + step);
          op.node.nodeValue = full.slice(0, i);
          let d = S.boost ? 10 : (full[i - 1] === " " ? twBaseDelay() * 0.4 : twBaseDelay());
          await sleep(d);
        }
      }
      finished = true;
      removeCaret();
      if (!S.cancelled) setTyping(false);
    })();

    // ---------- skip / fast-forward controls ----------
    let pressAt = 0, pressing = false;
    const inField = () => {
      const a = document.activeElement;
      return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
    };
    const isKey = (e) => e.code === "Space" || e.key === " " || e.key === "Enter";
    const onDown = (e) => {
      if (finished || S.cancelled) return;
      if (!isKey(e)) return;
      if (inField()) return;
      if (e.repeat) { e.preventDefault(); return; }
      e.preventDefault();
      pressing = true; pressAt = Date.now(); S.boost = true;
    };
    const onUp = (e) => {
      if (finished) return;
      if (!isKey(e) || !pressing) return;
      pressing = false; S.boost = false;
      if (Date.now() - pressAt < 220) revealAll(); // quick tap = skip
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    return () => {
      S.cancelled = true; finished = true;
      removeCaret();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return (
    <div className="typed-view" ref={wrapRef}>
      {children}
      {typing && (
        <div className="tw-hint">
          <span className="tw-blip" />typing… hold <b>⎵ / ⏎</b> to speed up · tap to skip
        </div>
      )}
    </div>
  );
}

window.TypedView = TypedViewImpl;
window.TW_SEEN = TW_SEEN;
