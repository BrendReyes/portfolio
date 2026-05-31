/* ============================================================
   scenes-a.jsx — Caching · HTTP · Rate limiting · CORS
   Authored as pure scene data interpreted by VizPlayer.
   ============================================================ */
(function () {
  // ---- small render helpers for dynamic node content ----
  const slots = (s) => (
    <div className="slots">
      {(s.cache || []).map((k) => (
        <div key={k} className={"slot" + (s.hot === k ? " hot" : "") + (s.evict === k ? " evict" : "")}>{k}</div>
      ))}
      {Array.from({ length: Math.max(0, (s.cap || 3) - (s.cache || []).length) }).map((_, i) => (
        <div key={"e" + i} className="slot empty">· empty ·</div>
      ))}
    </div>
  );
  const bucket = (s) => (
    <div className="bucket" title="tokens">
      {Array.from({ length: s.tokens || 0 }).map((_, i) => <div key={i} className="tok" />)}
      {(s.tokens || 0) === 0 && <div className="ns" style={{ color: "var(--err)" }}>empty</div>}
    </div>
  );
  const conns = (id) => (s) => <div className="ns">conns: {(s.conns || {})[id] ?? 0}</div>;

  // ============================================================
  // CACHING
  // ============================================================
  const caching = {
    id: "caching", title: "Caching", icon: "▤",
    blurb: "A cache trades memory for latency — keep hot data close so you skip the slow path.",
    tabs: [
      {
        name: "hit / miss", initial: { cache: [], cap: 3 },
        nodes: [
          { id: "client", label: "Client", sub: "app", x: 13, y: 50 },
          { id: "cache", label: "Cache", sub: "Redis · in-mem", x: 50, y: 50, w: 120, render: slots },
          { id: "db", label: "Database", sub: "Postgres", x: 87, y: 50 },
        ],
        edges: [{ from: "client", to: "cache", arrow: true }, { from: "cache", to: "db", arrow: true, dash: true }],
        steps: [
          { caption: "App asks the cache for user:42 before ever touching the DB.", active: ["client", "cache"], packet: { from: "client", to: "cache", label: "GET 42" }, log: { text: "→ GET user:42" } },
          { caption: "Key isn't in the cache — a MISS. We fall through to the database.", active: ["cache"], log: { text: "✗ cache MISS", kind: "err" }, packet: { from: "cache", to: "db", label: "SELECT" } },
          { caption: "Database does the expensive read and returns the row.", active: ["db", "cache"], packet: { from: "db", to: "cache", label: "row", kind: "data" }, set: { cache: ["42"], hot: "42" }, log: { text: "DB read … 41ms", kind: "info" } },
          { caption: "Cache stores the row, then answers the client. Slow, but only once.", active: ["cache", "client"], packet: { from: "cache", to: "client", label: "200", kind: "data" }, log: { text: "200 OK (miss · 43ms)" } },
          { caption: "Same key requested again.", active: ["client", "cache"], packet: { from: "client", to: "cache", label: "GET 42" }, set: { hot: "42" }, log: { text: "→ GET user:42" } },
          { caption: "Now it's a HIT — served from memory, ~20× faster, DB untouched.", active: ["cache", "client"], packet: { from: "cache", to: "client", label: "200", kind: "ok" }, log: { text: "✓ cache HIT (2ms)", kind: "ok" } },
        ],
      },
      {
        name: "LRU eviction", initial: { cache: [], cap: 3 },
        nodes: [
          { id: "client", label: "Client", x: 14, y: 50 },
          { id: "cache", label: "LRU Cache", sub: "capacity = 3", x: 62, y: 50, w: 130, render: slots },
        ],
        edges: [{ from: "client", to: "cache", arrow: true }],
        steps: [
          { caption: "Cache is empty. We add A.", packet: { from: "client", to: "cache", label: "put A" }, set: { cache: ["A"], hot: "A" }, active: ["cache"], log: { text: "put A → [A]" } },
          { caption: "Add B, then C. Cache is now full (3/3).", packet: { from: "client", to: "cache", label: "put B,C" }, set: { cache: ["A", "B", "C"], hot: "C" }, active: ["cache"], log: { text: "put B, C → [A B C]" } },
          { caption: "We GET A — it becomes the most-recently-used, moving to the front of the line.", packet: { from: "client", to: "cache", label: "get A" }, set: { cache: ["B", "C", "A"], hot: "A" }, active: ["cache"], log: { text: "get A (hit) → recency↑", kind: "ok" } },
          { caption: "Now add D, but we're full. The least-recently-used entry (B) is evicted.", packet: { from: "client", to: "cache", label: "put D" }, set: { cache: ["B", "C", "A"], evict: "B" }, active: ["cache"], log: { text: "put D → evict LRU (B)", kind: "err" } },
          { caption: "D takes B's place. The cache always keeps what you touched most recently.", set: { cache: ["C", "A", "D"], hot: "D", evict: null }, active: ["cache"], log: { text: "→ [C A D]" } },
        ],
      },
      {
        name: "write-through",
        nodes: [
          { id: "client", label: "Client", x: 14, y: 50 },
          { id: "cache", label: "Cache", x: 50, y: 50 },
          { id: "db", label: "Database", x: 86, y: 50 },
        ],
        edges: [{ from: "client", to: "cache", arrow: true }, { from: "cache", to: "db", arrow: true }],
        steps: [
          { caption: "Write-through: the write hits the cache AND the DB before we ack.", active: ["client", "cache"], packet: { from: "client", to: "cache", label: "WRITE" }, log: { text: "→ SET user:42" } },
          { caption: "Cache writes straight through to the database, synchronously.", active: ["cache", "db"], packet: { from: "cache", to: "db", label: "persist" }, log: { text: "persist → DB", kind: "info" } },
          { caption: "Only after the DB confirms do we acknowledge the client.", active: ["db", "client"], packet: { from: "cache", to: "client", label: "ack", kind: "ok" }, log: { text: "✓ durable, cache + DB in sync", kind: "ok" } },
          { caption: "Pro: cache & DB never diverge. Con: every write pays the DB latency.", log: { text: "trade-off: consistency > write speed" } },
        ],
      },
      {
        name: "write-back",
        nodes: [
          { id: "client", label: "Client", x: 14, y: 50 },
          { id: "cache", label: "Cache", sub: "dirty buffer", x: 50, y: 50 },
          { id: "db", label: "Database", x: 86, y: 50 },
        ],
        edges: [{ from: "client", to: "cache", arrow: true }, { from: "cache", to: "db", arrow: true, dash: true }],
        steps: [
          { caption: "Write-back: write only the cache, mark it dirty, ack immediately.", active: ["client", "cache"], packet: { from: "client", to: "cache", label: "WRITE" }, log: { text: "→ SET user:42 (dirty)" } },
          { caption: "Client gets its ack right away — blazing fast writes.", active: ["cache", "client"], packet: { from: "cache", to: "client", label: "ack", kind: "ok" }, log: { text: "✓ acked in 1ms", kind: "ok" } },
          { caption: "Later, the cache flushes dirty entries to the DB in a batch.", active: ["cache", "db"], packet: { from: "cache", to: "db", label: "flush", kind: "data" }, log: { text: "flush dirty → DB (async)", kind: "info" } },
          { caption: "Pro: fast writes & fewer DB hits. Con: a crash before flush loses data.", log: { text: "trade-off: speed > durability", kind: "err" } },
        ],
      },
      {
        name: "CDN",
        nodes: [
          { id: "u1", label: "User · US", x: 12, y: 28 },
          { id: "u2", label: "User · EU", x: 12, y: 74 },
          { id: "edge", label: "CDN Edge", sub: "near user", x: 48, y: 50 },
          { id: "origin", label: "Origin", sub: "far away", x: 87, y: 50 },
        ],
        edges: [{ from: "u1", to: "edge", arrow: true }, { from: "u2", to: "edge", arrow: true }, { from: "edge", to: "origin", arrow: true, dash: true }],
        steps: [
          { caption: "First user requests an asset from a nearby edge node.", active: ["u1", "edge"], packet: { from: "u1", to: "edge", label: "GET /logo" }, log: { text: "→ /logo.png" } },
          { caption: "Edge cache is cold — it fetches once from the distant origin.", active: ["edge", "origin"], packet: { from: "edge", to: "origin", label: "miss" }, log: { text: "edge MISS → origin", kind: "err" } },
          { caption: "Origin responds; the edge caches the asset close to users.", active: ["origin", "edge"], packet: { from: "origin", to: "edge", label: "asset", kind: "data" }, log: { text: "cached at edge (TTL 1h)", kind: "info" } },
          { caption: "A second user nearby gets it instantly — no origin trip.", active: ["u2", "edge"], packet: { from: "edge", to: "u2", label: "HIT", kind: "ok" }, log: { text: "✓ edge HIT — 8ms", kind: "ok" } },
        ],
      },
      {
        name: "TTL expiry", initial: { cache: [], cap: 3 },
        nodes: [
          { id: "client", label: "Client", sub: "app", x: 13, y: 50 },
          { id: "cache", label: "Cache", sub: "TTL = 10s", x: 50, y: 50, w: 120, render: slots },
          { id: "db", label: "Database", sub: "Postgres", x: 87, y: 50 },
        ],
        edges: [{ from: "client", to: "cache", arrow: true }, { from: "cache", to: "db", arrow: true, dash: true }],
        steps: [
          { caption: "Write user:42 with a 10-second TTL. Write-through: the value lands in the cache AND is sent on to the DB.", active: ["client", "cache"], packet: { from: "client", to: "cache", label: "SET ttl=10" }, set: { cache: ["42"], hot: "42" }, log: { text: "→ SET user:42 (TTL 10s)" } },
          { caption: "Write-through persists synchronously to the database before acking — cache and DB agree.", active: ["cache", "db"], packet: { from: "cache", to: "db", label: "persist" }, log: { text: "write-through → DB (durable)", kind: "info" } },
          { caption: "Inside the window, reads are served straight from memory — a HIT.", active: ["client", "cache"], packet: { from: "cache", to: "client", label: "200", kind: "ok" }, set: { hot: "42" }, log: { text: "✓ HIT — TTL 6s left (2ms)", kind: "ok" } },
          { caption: "The clock runs out. At TTL = 0 the entry is considered stale and evicted automatically.", active: ["cache"], set: { evict: "42" }, log: { text: "⏳ TTL expired → evict user:42", kind: "err" } },
          { caption: "The slot is now empty — the cache no longer knows the key.", active: ["cache"], set: { cache: [], hot: null, evict: null }, log: { text: "cache → [ empty ]" } },
          { caption: "The next read is a MISS, so we fall through to the database again.", active: ["client", "cache"], packet: { from: "cache", to: "db", label: "SELECT" }, log: { text: "✗ MISS (expired) → DB", kind: "err" } },
          { caption: "The DB returns a fresh row and the cache repopulates with a brand-new TTL.", active: ["db", "cache"], packet: { from: "db", to: "cache", label: "row", kind: "data" }, set: { cache: ["42"], hot: "42" }, log: { text: "refill user:42 (TTL reset 10s)", kind: "info" } },
          { caption: "This time we write-back: update the cache with a fresh TTL, mark it dirty, and ack instantly.", active: ["client", "cache"], packet: { from: "cache", to: "client", label: "ack", kind: "ok" }, set: { hot: "42" }, log: { text: "✓ write-back acked in 1ms (dirty, TTL 10s)", kind: "ok" } },
          { caption: "The dirty entry flushes to the DB later, in the background — while the TTL keeps ticking down toward the next expiry.", active: ["cache", "db"], packet: { from: "cache", to: "db", label: "flush", kind: "data" }, log: { text: "flush dirty → DB (async) · TTL bounds staleness", kind: "info" } },
        ],
      },
    ],
  };

  // ============================================================
  // HTTP LIFECYCLE
  // ============================================================
  const http = {
    id: "http", title: "HTTP Lifecycle", icon: "⇄",
    blurb: "What actually happens between typing a URL and seeing a page.",
    tabs: [
      {
        name: "request round-trip",
        nodes: [
          { id: "br", label: "Browser", x: 13, y: 50 },
          { id: "srv", label: "Server", sub: "app + router", x: 87, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "Browser opens a connection and sends a request line + headers.", active: ["br"], packet: { from: "br", to: "srv", label: "GET /api/posts" }, log: { text: "→ GET /api/posts HTTP/1.1" } },
          { caption: "Server routes the path, runs a handler, queries data.", active: ["srv"], log: { text: "route → handler → query", kind: "info" } },
          { caption: "Server sends back a status line, headers, then the body.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "200 + JSON", kind: "data" }, log: { text: "← 200 OK · 14KB JSON", kind: "ok" } },
          { caption: "Browser parses the response and renders. Round-trip done.", active: ["br"], log: { text: "✓ parsed & rendered", kind: "ok" } },
        ],
      },
      {
        name: "DNS + TLS",
        nodes: [
          { id: "br", label: "Browser", x: 13, y: 50 },
          { id: "dns", label: "DNS Resolver", x: 50, y: 18 },
          { id: "srv", label: "Server", x: 87, y: 50 },
        ],
        edges: [{ from: "br", to: "dns", arrow: true, dash: true }, { from: "br", to: "srv", arrow: true }],
        steps: [
          { caption: "First, resolve the hostname to an IP via DNS.", active: ["br", "dns"], packet: { from: "br", to: "dns", label: "site.com?" }, log: { text: "DNS query site.com" } },
          { caption: "Resolver returns the A record.", active: ["dns", "br"], packet: { from: "dns", to: "br", label: "93.184.x.x", kind: "data" }, log: { text: "→ 93.184.216.34", kind: "info" } },
          { caption: "TLS handshake begins: ClientHello offers ciphers.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "ClientHello" }, log: { text: "TLS: ClientHello" } },
          { caption: "Server replies with its certificate and chosen cipher.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "cert + key", kind: "data" }, log: { text: "TLS: ServerHello + cert", kind: "info" } },
          { caption: "Keys exchanged & verified — the channel is now encrypted.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "🔒 encrypted", kind: "ok" }, log: { text: "✓ secure channel established", kind: "ok" } },
        ],
      },
      {
        name: "status codes",
        nodes: [
          { id: "br", label: "Browser", x: 13, y: 50 },
          { id: "srv", label: "Server", x: 87, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "2xx — success. The request worked and the body is your data.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "200 OK", kind: "ok" }, log: { text: "2xx success · 200, 201, 204", kind: "ok" } },
          { caption: "3xx — redirect. 'It moved, go here instead.'", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "301 →", kind: "data" }, log: { text: "3xx redirect · 301, 304", kind: "info" } },
          { caption: "4xx — you broke it. Bad input, missing, or not allowed.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "404", kind: "err" }, log: { text: "4xx client error · 400, 401, 403, 404, 429", kind: "err" } },
          { caption: "5xx — the server broke it. Crash, timeout, downstream failure.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "500", kind: "err" }, log: { text: "5xx server error · 500, 502, 503", kind: "err" } },
        ],
      },
    ],
  };

  // ============================================================
  // RATE LIMITING
  // ============================================================
  const rate = {
    id: "rate", title: "Rate Limiting", icon: "⏚",
    blurb: "Protect a service from bursts and abuse by capping how fast callers may go.",
    tabs: [
      {
        name: "token bucket", initial: { tokens: 3 },
        nodes: [
          { id: "client", label: "Client", x: 14, y: 50 },
          { id: "bkt", label: "Bucket", sub: "cap 3 · +1/s", x: 50, y: 50, w: 110, render: bucket },
          { id: "srv", label: "Server", x: 86, y: 50 },
        ],
        edges: [{ from: "client", to: "bkt", arrow: true }, { from: "bkt", to: "srv", arrow: true }],
        steps: [
          { caption: "The bucket holds 3 tokens. Each request must spend one.", active: ["bkt"], set: { tokens: 3 }, log: { text: "bucket full · 3 tokens" } },
          { caption: "Request arrives, spends a token — allowed.", active: ["client", "bkt", "srv"], packet: { from: "client", to: "srv", label: "req ✓", kind: "ok" }, set: { tokens: 2 }, log: { text: "req 1 → allow (2 left)", kind: "ok" } },
          { caption: "A burst of two more drains the bucket to empty.", active: ["client", "bkt", "srv"], packet: { from: "client", to: "srv", label: "req ✓", kind: "ok" }, set: { tokens: 0 }, log: { text: "req 2,3 → allow (0 left)", kind: "ok" } },
          { caption: "Next request finds no tokens — rejected with 429.", active: ["client", "bkt"], packet: { from: "bkt", to: "client", label: "429", kind: "err" }, set: { tokens: 0 }, log: { text: "req 4 → 429 Too Many Requests", kind: "err" } },
          { caption: "Tokens refill at a steady rate, so bursts smooth out over time.", active: ["bkt"], set: { tokens: 1 }, log: { text: "+1 token/s → recovering", kind: "info" } },
        ],
      },
      {
        name: "leaky bucket", initial: { tokens: 0 },
        nodes: [
          { id: "client", label: "Clients", x: 14, y: 50 },
          { id: "q", label: "Queue", sub: "leaks 1/s", x: 50, y: 50, w: 110, render: bucket },
          { id: "srv", label: "Server", x: 86, y: 50 },
        ],
        edges: [{ from: "client", to: "q", arrow: true }, { from: "q", to: "srv", arrow: true }],
        steps: [
          { caption: "Requests pour into a fixed-size queue.", active: ["client", "q"], packet: { from: "client", to: "q", label: "burst" }, set: { tokens: 3 }, log: { text: "queue fills: 3" } },
          { caption: "The queue 'leaks' to the server at a constant rate — smooth output.", active: ["q", "srv"], packet: { from: "q", to: "srv", label: "drip", kind: "ok" }, set: { tokens: 2 }, log: { text: "leak 1/s → server", kind: "ok" } },
          { caption: "If input outpaces the leak and the queue is full…", active: ["client", "q"], packet: { from: "client", to: "q", label: "overflow", kind: "err" }, set: { tokens: 3 }, log: { text: "queue full!", kind: "err" } },
          { caption: "…excess requests overflow and are dropped. Output stays constant.", active: ["q"], packet: { from: "q", to: "client", label: "drop", kind: "err" }, log: { text: "overflow → drop", kind: "err" } },
        ],
      },
      {
        name: "sliding window", initial: { count: 0 },
        nodes: [
          { id: "client", label: "Client", x: 16, y: 50 },
          { id: "win", label: "Window", sub: "≤ 3 / 10s", x: 55, y: 50, w: 120, render: (s) => <div className="ns" style={{ color: s.count > 3 ? "var(--err)" : "var(--accent)" }}>count: {s.count}/3</div> },
        ],
        edges: [{ from: "client", to: "win", arrow: true }],
        steps: [
          { caption: "We count requests within a rolling 10-second window.", active: ["win"], set: { count: 0 }, log: { text: "window reset · 0/3" } },
          { caption: "Each request increments the counter while inside the window.", active: ["client", "win"], packet: { from: "client", to: "win", label: "req", kind: "ok" }, set: { count: 1 }, log: { text: "1/3 allow", kind: "ok" } },
          { caption: "Two more — still under the limit.", active: ["client", "win"], packet: { from: "client", to: "win", label: "req", kind: "ok" }, set: { count: 3 }, log: { text: "3/3 allow", kind: "ok" } },
          { caption: "The 4th in the window exceeds the cap — 429.", active: ["client", "win"], packet: { from: "win", to: "client", label: "429", kind: "err" }, set: { count: 4 }, log: { text: "4th → 429 (limit hit)", kind: "err" } },
          { caption: "As old requests age out of the window, capacity frees up again.", active: ["win"], set: { count: 1 }, log: { text: "older reqs expire → 1/3", kind: "info" } },
        ],
      },
    ],
  };

  // ============================================================
  // CORS
  // ============================================================
  const cors = {
    id: "cors", title: "CORS", icon: "⊞",
    blurb: "The browser's rule for when JS on one origin may read responses from another.",
    tabs: [
      {
        name: "simple request",
        nodes: [
          { id: "br", label: "Browser", sub: "app.com", x: 14, y: 50 },
          { id: "srv", label: "API", sub: "api.com", x: 86, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "JS on app.com fetches api.com — a cross-origin GET.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "GET +Origin" }, log: { text: "→ GET  Origin: app.com" } },
          { caption: "Server responds with the data AND an allow header.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "200 +ACAO", kind: "data" }, log: { text: "← 200  Access-Control-Allow-Origin: app.com", kind: "info" } },
          { caption: "The browser sees its origin is allowed and hands JS the response.", active: ["br"], packet: { from: "srv", to: "br", label: "✓ allowed", kind: "ok" }, log: { text: "✓ response exposed to JS", kind: "ok" } },
        ],
      },
      {
        name: "preflight (OPTIONS)",
        nodes: [
          { id: "br", label: "Browser", sub: "app.com", x: 14, y: 50 },
          { id: "srv", label: "API", sub: "api.com", x: 86, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "A PUT with custom headers is 'non-simple' — the browser asks permission first.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "OPTIONS" }, log: { text: "→ OPTIONS (preflight)" } },
          { caption: "Server replies 204 listing which methods & headers it allows.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "204 allow", kind: "data" }, log: { text: "← 204  Allow-Methods: PUT  Allow-Headers: …", kind: "info" } },
          { caption: "Preflight passed — only now does the real request go out.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "PUT (real)" }, log: { text: "→ PUT /resource" } },
          { caption: "Server processes it and returns the result.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "200", kind: "ok" }, log: { text: "✓ 200 OK", kind: "ok" } },
        ],
      },
      {
        name: "blocked origin",
        nodes: [
          { id: "br", label: "Browser", sub: "evil.com", x: 14, y: 50 },
          { id: "srv", label: "API", sub: "api.com", x: 86, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "Request goes out from an origin the server doesn't trust.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "GET +Origin" }, log: { text: "→ GET  Origin: evil.com" } },
          { caption: "Server runs the code and responds — but WITHOUT an allow header for this origin.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "200 (no ACAO)", kind: "data" }, log: { text: "← 200  (no matching Allow-Origin)", kind: "info" } },
          { caption: "The browser blocks JS from reading the response. CORS is enforced client-side.", active: ["br"], packet: { from: "srv", to: "br", label: "✗ blocked", kind: "err" }, log: { text: "✗ CORS error — response hidden from JS", kind: "err" } },
          { caption: "Note: CORS isn't auth. The server still ran — use real authz too.", log: { text: "⚠ CORS ≠ authorization", kind: "err" } },
        ],
      },
    ],
  };

  window.SCENES_A = { caching, http, rate, cors };
})();
