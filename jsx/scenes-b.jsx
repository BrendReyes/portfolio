/* ============================================================
   scenes-b.jsx — Load balancing · Queues · Auth · Databases
   ============================================================ */
(function () {
  const conns = (id) => (s) => <div className="ns" style={{ marginTop: 4 }}>conns: {(s.conns || {})[id] ?? 0}</div>;

  // ============================================================
  // LOAD BALANCING
  // ============================================================
  const lb = {
    id: "lb", title: "Load Balancing", icon: "⑃",
    blurb: "Spread traffic across many servers so no single box melts.",
    tabs: [
      {
        name: "round-robin",
        nodes: [
          { id: "c", label: "Clients", x: 13, y: 50 },
          { id: "lb", label: "Load Balancer", x: 45, y: 50 },
          { id: "s1", label: "web-1", x: 84, y: 22 },
          { id: "s2", label: "web-2", x: 84, y: 50 },
          { id: "s3", label: "web-3", x: 84, y: 78 },
        ],
        edges: [
          { from: "c", to: "lb", arrow: true },
          { from: "lb", to: "s1", arrow: true }, { from: "lb", to: "s2", arrow: true }, { from: "lb", to: "s3", arrow: true },
        ],
        steps: [
          { caption: "Requests arrive at the load balancer, not the servers directly.", active: ["c", "lb"], packet: { from: "c", to: "lb", label: "req 1" }, log: { text: "→ request 1" } },
          { caption: "Round-robin sends request 1 to web-1.", active: ["lb", "s1"], packet: { from: "lb", to: "s1", label: "→1", kind: "ok" }, log: { text: "route → web-1", kind: "ok" } },
          { caption: "Request 2 goes to the next server in the rotation.", active: ["lb", "s2"], packet: { from: "lb", to: "s2", label: "→2", kind: "ok" }, log: { text: "route → web-2", kind: "ok" } },
          { caption: "Request 3 to web-3.", active: ["lb", "s3"], packet: { from: "lb", to: "s3", label: "→3", kind: "ok" }, log: { text: "route → web-3", kind: "ok" } },
          { caption: "Request 4 wraps back to web-1 — simple, even, stateless.", active: ["lb", "s1"], packet: { from: "lb", to: "s1", label: "→4", kind: "ok" }, log: { text: "route → web-1 (wrap)", kind: "info" } },
        ],
      },
      {
        name: "least connections", initial: { conns: { s1: 3, s2: 1, s3: 2 } },
        nodes: [
          { id: "c", label: "Clients", x: 13, y: 50 },
          { id: "lb", label: "Load Balancer", x: 45, y: 50 },
          { id: "s1", label: "web-1", x: 84, y: 22, render: conns("s1") },
          { id: "s2", label: "web-2", x: 84, y: 50, render: conns("s2") },
          { id: "s3", label: "web-3", x: 84, y: 78, render: conns("s3") },
        ],
        edges: [{ from: "c", to: "lb", arrow: true }, { from: "lb", to: "s1", arrow: true }, { from: "lb", to: "s2", arrow: true }, { from: "lb", to: "s3", arrow: true }],
        steps: [
          { caption: "Servers carry uneven load — web-1 has 3 open connections, web-2 only 1.", active: ["s1", "s2", "s3"], log: { text: "state: w1=3 w2=1 w3=2" } },
          { caption: "A new request arrives. Round-robin would ignore load — least-connections won't.", active: ["c", "lb"], packet: { from: "c", to: "lb", label: "req" }, log: { text: "→ new request" } },
          { caption: "The LB picks the least-busy server: web-2.", active: ["lb", "s2"], packet: { from: "lb", to: "s2", label: "→ w2", kind: "ok" }, set: { conns: { s1: 3, s2: 2, s3: 2 } }, log: { text: "route → web-2 (fewest conns)", kind: "ok" } },
          { caption: "Better for long-lived or uneven requests where some take much longer.", active: ["s1", "s2", "s3"], log: { text: "load balanced by real usage", kind: "info" } },
        ],
      },
      {
        name: "health checks", initial: { conns: { s1: 0, s2: 0, s3: 0 } },
        nodes: [
          { id: "c", label: "Clients", x: 13, y: 50 },
          { id: "lb", label: "Load Balancer", x: 45, y: 50 },
          { id: "s1", label: "web-1", sub: "healthy", x: 84, y: 22 },
          { id: "s2", label: "web-2", sub: "down", x: 84, y: 50 },
          { id: "s3", label: "web-3", sub: "healthy", x: 84, y: 78 },
        ],
        edges: [{ from: "c", to: "lb", arrow: true }, { from: "lb", to: "s1", arrow: true }, { from: "lb", to: "s2", arrow: true, dash: true }, { from: "lb", to: "s3", arrow: true }],
        steps: [
          { caption: "The LB pings each server on an interval to check it's alive.", active: ["lb", "s1", "s3"], packet: { from: "lb", to: "s1", label: "ping" }, log: { text: "health check · /healthz" } },
          { caption: "web-2 fails its check — it's marked unhealthy and pulled from rotation.", active: ["lb", "s2"], dim: ["s2"], packet: { from: "s2", to: "lb", label: "timeout", kind: "err" }, log: { text: "✗ web-2 unhealthy → removed", kind: "err" } },
          { caption: "Live traffic now only routes to healthy nodes — users never notice.", active: ["lb", "s1"], dim: ["s2"], packet: { from: "lb", to: "s1", label: "→ w1", kind: "ok" }, log: { text: "route → web-1 (w2 skipped)", kind: "ok" } },
          { caption: "When web-2 recovers and passes again, it's quietly added back.", active: ["s1", "s2", "s3"], packet: { from: "s2", to: "lb", label: "200 ✓", kind: "ok" }, log: { text: "✓ web-2 healthy → restored", kind: "ok" } },
        ],
      },
    ],
  };

  // ============================================================
  // MESSAGE QUEUES / PUB-SUB
  // ============================================================
  const queue = {
    id: "queue", title: "Queues & Pub/Sub", icon: "⇶",
    blurb: "Decouple producers from consumers so work happens reliably and asynchronously.",
    tabs: [
      {
        name: "work queue",
        nodes: [
          { id: "p", label: "Producer", sub: "API", x: 12, y: 50 },
          { id: "q", label: "Queue", sub: "jobs", x: 45, y: 50 },
          { id: "w1", label: "Worker A", x: 84, y: 28 },
          { id: "w2", label: "Worker B", x: 84, y: 72 },
        ],
        edges: [{ from: "p", to: "q", arrow: true }, { from: "q", to: "w1", arrow: true }, { from: "q", to: "w2", arrow: true }],
        steps: [
          { caption: "Instead of doing slow work inline, the API enqueues a job and returns fast.", active: ["p", "q"], packet: { from: "p", to: "q", label: "job: email", kind: "data" }, log: { text: "enqueue → send_email" } },
          { caption: "Each job is delivered to exactly ONE worker — they compete for work.", active: ["q", "w1"], packet: { from: "q", to: "w1", label: "→ A", kind: "ok" }, log: { text: "Worker A picks up job", kind: "ok" } },
          { caption: "More jobs spread across idle workers, scaling throughput horizontally.", active: ["q", "w2"], packet: { from: "q", to: "w2", label: "→ B", kind: "ok" }, log: { text: "Worker B picks up next", kind: "ok" } },
          { caption: "A worker ACKs when done. If it crashes first, the job is redelivered.", active: ["w1", "q"], packet: { from: "w1", to: "q", label: "ack", kind: "ok" }, log: { text: "✓ ack — at-least-once delivery", kind: "info" } },
        ],
      },
      {
        name: "pub / sub",
        nodes: [
          { id: "pub", label: "Publisher", x: 12, y: 50 },
          { id: "t", label: "Topic", sub: "order.created", x: 45, y: 50 },
          { id: "s1", label: "Email svc", x: 85, y: 20 },
          { id: "s2", label: "Inventory", x: 85, y: 50 },
          { id: "s3", label: "Analytics", x: 85, y: 80 },
        ],
        edges: [{ from: "pub", to: "t", arrow: true }, { from: "t", to: "s1", arrow: true }, { from: "t", to: "s2", arrow: true }, { from: "t", to: "s3", arrow: true }],
        steps: [
          { caption: "One event is published to a topic — the publisher doesn't know who listens.", active: ["pub", "t"], packet: { from: "pub", to: "t", label: "order.created", kind: "data" }, log: { text: "publish → order.created" } },
          { caption: "Unlike a work queue, EVERY subscriber gets its own copy (fan-out).", active: ["t", "s1", "s2", "s3"], packets: [{ from: "t", to: "s1", label: "copy", kind: "ok" }, { from: "t", to: "s2", label: "copy", kind: "ok" }, { from: "t", to: "s3", label: "copy", kind: "ok" }], log: { text: "fan-out → 3 subscribers", kind: "ok" } },
          { caption: "Each service reacts independently: send email, reserve stock, log a metric.", active: ["s1", "s2", "s3"], log: { text: "email · inventory · analytics react", kind: "info" } },
          { caption: "Add a new subscriber later and it just works — zero publisher changes.", active: ["t"], log: { text: "loosely coupled, extensible", kind: "ok" } },
        ],
      },
    ],
  };

  // ============================================================
  // AUTHENTICATION
  // ============================================================
  const roleTag = (s) => <div className="ns" style={{ marginTop: 4, color: s.role === "admin" ? "var(--ok)" : "var(--fg-dim)" }}>role: {s.role || "user"}</div>;

  const auth = {
    id: "auth", title: "Authentication", icon: "⚿",
    blurb: "Proving who a caller is — and keeping them logged in — without leaking secrets.",
    tabs: [
      {
        name: "register",
        nodes: [
          { id: "br", label: "Browser", x: 14, y: 50 },
          { id: "srv", label: "Server", sub: "API", x: 50, y: 50 },
          { id: "db", label: "Users DB", x: 84, y: 26 },
          { id: "store", label: "Session store", sub: "Redis", x: 84, y: 74 },
        ],
        edges: [{ from: "br", to: "srv", arrow: true }, { from: "srv", to: "db", arrow: true }, { from: "srv", to: "store", arrow: true }],
        steps: [
          { caption: "A new user submits their email + password over HTTPS.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "register" }, log: { text: "→ POST /register { email, password }" } },
          { caption: "The server generates a random per-user salt and runs argon2id — the raw password is never stored.", active: ["srv"], log: { text: "salt + argon2id(password) → hash", kind: "info" } },
          { caption: "Only the salted hash is persisted. A breach leaks hashes, not passwords.", active: ["srv", "db"], packet: { from: "srv", to: "db", label: "save user", kind: "data" }, log: { text: "INSERT user (email, hash)", kind: "data" } },
          { caption: "Log the new user straight in by creating a server-side session.", active: ["srv", "store"], packet: { from: "srv", to: "store", label: "save sid", kind: "data" }, log: { text: "store session abc123", kind: "info" } },
          { caption: "Respond 201 Created with the session cookie — registration done.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "201 + Set-Cookie", kind: "ok" }, log: { text: "← 201 Created · Set-Cookie: sid", kind: "ok" } },
          { caption: "argon2id is deliberately slow & memory-hard, so cracking a stolen hash stays expensive.", active: ["db"], log: { text: "✓ never store plaintext · hashing is one-way", kind: "ok" } },
        ],
      },
      {
        name: "sessions",
        nodes: [
          { id: "br", label: "Browser", x: 14, y: 50 },
          { id: "srv", label: "Server", x: 52, y: 50 },
          { id: "store", label: "Session store", sub: "Redis", x: 87, y: 50 },
        ],
        edges: [{ from: "br", to: "srv", arrow: true }, { from: "srv", to: "store", arrow: true }],
        steps: [
          { caption: "User logs in with credentials.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "login" }, log: { text: "→ POST /login" } },
          { caption: "Server verifies, then creates a session row and stores it server-side.", active: ["srv", "store"], packet: { from: "srv", to: "store", label: "save sid", kind: "data" }, log: { text: "store session abc123", kind: "info" } },
          { caption: "It returns only an opaque session ID in a cookie — no data inside.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "Set-Cookie sid", kind: "ok" }, log: { text: "← Set-Cookie: sid=abc123", kind: "ok" } },
          { caption: "Each later request sends the cookie; the server looks the session up.", active: ["br", "srv", "store"], packet: { from: "br", to: "srv", label: "cookie" }, log: { text: "→ request + cookie → lookup", kind: "info" } },
          { caption: "Stateful: easy to revoke (delete the row) but needs a shared store to scale.", active: ["store"], log: { text: "revoke = delete session row", kind: "ok" } },
        ],
      },
      {
        name: "JWT",
        nodes: [
          { id: "br", label: "Browser", x: 16, y: 50 },
          { id: "srv", label: "Server", sub: "stateless", x: 84, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "User logs in.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "login" }, log: { text: "→ POST /login" } },
          { caption: "Server signs a token containing the claims (user id, role, expiry).", active: ["srv"], log: { text: "sign JWT { sub, role, exp }", kind: "info" } },
          { caption: "The signed token goes to the client — nothing stored server-side.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "JWT", kind: "ok" }, log: { text: "← header.payload.signature", kind: "ok" } },
          { caption: "Client sends it in the Authorization header on each request.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "Bearer JWT" }, log: { text: "→ Authorization: Bearer …" } },
          { caption: "Server just verifies the signature — no DB hit. Scales effortlessly…", active: ["srv"], packet: { from: "srv", to: "br", label: "200", kind: "ok" }, log: { text: "✓ verify signature (no lookup)", kind: "ok" } },
          { caption: "…but you can't easily revoke a valid token before it expires.", active: ["srv"], log: { text: "⚠ revocation is hard → keep exp short", kind: "err" } },
        ],
      },
      {
        name: "OAuth flow",
        nodes: [
          { id: "br", label: "User", x: 14, y: 50 },
          { id: "app", label: "Your App", x: 50, y: 22 },
          { id: "idp", label: "Provider", sub: "Google", x: 84, y: 60 },
        ],
        edges: [{ from: "br", to: "app", arrow: true }, { from: "app", to: "idp", arrow: true, dash: true }, { from: "br", to: "idp", arrow: true }],
        steps: [
          { caption: "User clicks 'Sign in with Google'. Your app never sees their password.", active: ["br", "app"], packet: { from: "br", to: "app", label: "login w/ Google" }, log: { text: "→ start OAuth" } },
          { caption: "App redirects the user to the provider to authenticate & consent.", active: ["app", "idp"], packet: { from: "app", to: "idp", label: "redirect", kind: "data" }, log: { text: "redirect → provider /authorize", kind: "info" } },
          { caption: "User logs in at the provider and approves the requested scopes.", active: ["br", "idp"], packet: { from: "br", to: "idp", label: "approve", kind: "ok" }, log: { text: "user consents", kind: "ok" } },
          { caption: "Provider redirects back with a short-lived auth code.", active: ["idp", "app"], packet: { from: "idp", to: "app", label: "code", kind: "data" }, log: { text: "← ?code=xyz" } },
          { caption: "App exchanges the code (server-to-server) for access + refresh tokens.", active: ["app", "idp"], packet: { from: "app", to: "idp", label: "code→tokens", kind: "ok" }, log: { text: "✓ exchange → access + refresh token", kind: "ok" } },
        ],
      },
      {
        name: "token refresh",
        nodes: [
          { id: "br", label: "Client", x: 16, y: 50 },
          { id: "srv", label: "Auth Server", x: 84, y: 50 },
        ],
        edges: [{ from: "br", to: "srv" }],
        steps: [
          { caption: "Access tokens are short-lived (minutes) to limit damage if leaked.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "API + access", kind: "ok" }, log: { text: "→ request w/ access token" } },
          { caption: "After expiry, the API rejects the stale token.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "401 expired", kind: "err" }, log: { text: "← 401 token expired", kind: "err" } },
          { caption: "Client silently presents its long-lived refresh token.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "refresh", kind: "data" }, log: { text: "→ POST /refresh" } },
          { caption: "Server issues a fresh access token — the user never sees a logout.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "new access", kind: "ok" }, log: { text: "✓ new access token (seamless)", kind: "ok" } },
        ],
      },
      {
        name: "authorization",
        nodes: [
          { id: "br", label: "Client", x: 16, y: 50, render: roleTag },
          { id: "srv", label: "API", sub: "RBAC check", x: 52, y: 50 },
          { id: "res", label: "Admin route", sub: "admin only", x: 86, y: 50 },
        ],
        edges: [{ from: "br", to: "srv", arrow: true }, { from: "srv", to: "res", arrow: true }],
        steps: [
          { caption: "Authentication proved WHO they are. Authorization decides what they may DO.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "GET /admin" }, set: { role: "user" }, log: { text: "→ GET /admin (+ session)" } },
          { caption: "The server resolves the caller's role from their session.", active: ["srv"], log: { text: "role = user", kind: "info" } },
          { caption: "This route is admin-only and the role doesn't match → access denied.", active: ["srv", "br"], packet: { from: "srv", to: "br", label: "403", kind: "err" }, log: { text: "✗ 403 Forbidden (needs: admin)", kind: "err" } },
          { caption: "Now an admin calls the exact same endpoint.", active: ["br", "srv"], packet: { from: "br", to: "srv", label: "GET /admin" }, set: { role: "admin" }, log: { text: "→ GET /admin (admin session)" } },
          { caption: "The role matches the requirement, so the request reaches the resource.", active: ["srv", "res"], packet: { from: "srv", to: "res", label: "allow → 200", kind: "ok" }, log: { text: "✓ authorized → 200 OK", kind: "ok" } },
          { caption: "Authenticate once; authorize on every protected action — never trust the client's word.", active: ["res"], log: { text: "authz = per-request permission check", kind: "info" } },
        ],
      },
    ],
  };

  // ============================================================
  // DATABASE PATTERNS
  // ============================================================
  const idxScan = (s) => <div className="ns" style={{ color: "var(--err)", marginTop: 4 }}>scan {s.scanned || 0} rows</div>;
  const idxSeek = (s) => <div className="ns" style={{ color: "var(--ok)", marginTop: 4 }}>read {s.read || 0} rows</div>;

  const rlsRows = [{ id: 1, o: "A" }, { id: 2, o: "B" }, { id: 3, o: "A" }, { id: 4, o: "B" }];
  const rlsTbl = (s) => (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
      {rlsRows.map((r) => {
        const vis = !s.who || s.who === r.o;
        return (
          <div key={r.id} className="ns" style={{ fontSize: 11, padding: "1px 6px", border: "1px solid var(--border)", opacity: vis ? 1 : 0.16, color: vis ? "var(--ok)" : "var(--fg-faint)", background: vis ? "color-mix(in srgb, var(--ok) 12%, transparent)" : "transparent" }}>
            doc#{r.id} · owner {r.o}
          </div>
        );
      })}
    </div>
  );

  const db = {
    id: "db", title: "Database Patterns", icon: "▦",
    blurb: "How thoughtful schema, indexes, and topology turn slow queries fast — and keep them fast at scale.",
    tabs: [
      {
        name: "indexing", initial: { scanned: 0, read: 0 },
        nodes: [
          { id: "q", label: "Query", sub: "WHERE email=?", x: 15, y: 50 },
          { id: "scan", label: "No index", sub: "full table scan", x: 52, y: 24, render: idxScan },
          { id: "idx", label: "B-tree index", sub: "on email", x: 52, y: 76, render: idxSeek },
          { id: "row", label: "Row", x: 86, y: 50 },
        ],
        edges: [{ from: "q", to: "scan", arrow: true }, { from: "q", to: "idx", arrow: true }, { from: "scan", to: "row", arrow: true, dash: true }, { from: "idx", to: "row", arrow: true }],
        steps: [
          { caption: "Without an index, the DB checks every row one by one — O(n).", active: ["q", "scan"], packet: { from: "q", to: "scan", label: "find", kind: "err" }, set: { scanned: 1000000 }, log: { text: "seq scan · 1,000,000 rows", kind: "err" } },
          { caption: "On a big table that's painfully slow and reads tons of pages.", active: ["scan", "row"], packet: { from: "scan", to: "row", label: "920ms", kind: "err" }, log: { text: "match found in 920ms", kind: "err" } },
          { caption: "A B-tree index keeps values sorted, so lookups are O(log n).", active: ["q", "idx"], packet: { from: "q", to: "idx", label: "seek", kind: "ok" }, set: { read: 3 }, log: { text: "index seek · ~3 page reads", kind: "ok" } },
          { caption: "Same answer in a fraction of the time — the win compounds with size.", active: ["idx", "row"], packet: { from: "idx", to: "row", label: "1.2ms", kind: "ok" }, log: { text: "✓ match found in 1.2ms", kind: "ok" } },
          { caption: "Cost: indexes use space & slow writes. Index what you filter/join on — not everything.", log: { text: "trade-off: faster reads / slower writes", kind: "info" } },
        ],
      },
      {
        name: "query plan",
        nodes: [
          { id: "q", label: "SQL", sub: "JOIN + WHERE", x: 14, y: 50 },
          { id: "planner", label: "Planner", sub: "cost-based", x: 50, y: 50 },
          { id: "exec", label: "Executor", x: 86, y: 50 },
        ],
        edges: [{ from: "q", to: "planner", arrow: true }, { from: "planner", to: "exec", arrow: true }],
        steps: [
          { caption: "The planner doesn't run your SQL literally — it finds the cheapest plan.", active: ["q", "planner"], packet: { from: "q", to: "planner", label: "parse" }, log: { text: "→ parse + analyze" } },
          { caption: "It estimates cost of options: which index, join order, hash vs nested-loop.", active: ["planner"], log: { text: "compare plans by est. cost", kind: "info" } },
          { caption: "Filter early, join less: push WHERE down so fewer rows reach the join.", active: ["planner"], packet: { from: "planner", to: "exec", label: "best plan", kind: "ok" }, log: { text: "chosen: index scan → hash join", kind: "ok" } },
          { caption: "Read it yourself with EXPLAIN ANALYZE — watch for 'Seq Scan' on big tables.", active: ["exec"], log: { text: "✓ EXPLAIN ANALYZE is your friend", kind: "ok" } },
        ],
      },
      {
        name: "replication",
        nodes: [
          { id: "app", label: "App", x: 13, y: 50 },
          { id: "primary", label: "Primary", sub: "writes", x: 48, y: 50 },
          { id: "r1", label: "Replica 1", sub: "reads", x: 85, y: 25 },
          { id: "r2", label: "Replica 2", sub: "reads", x: 85, y: 75 },
        ],
        edges: [{ from: "app", to: "primary", arrow: true }, { from: "primary", to: "r1", arrow: true, dash: true }, { from: "primary", to: "r2", arrow: true, dash: true }],
        steps: [
          { caption: "All writes go to a single primary to keep one source of truth.", active: ["app", "primary"], packet: { from: "app", to: "primary", label: "WRITE" }, log: { text: "→ INSERT (primary only)" } },
          { caption: "The primary streams its changes to read replicas.", active: ["primary", "r1", "r2"], packets: [{ from: "primary", to: "r1", label: "replicate", kind: "data" }, { from: "primary", to: "r2", label: "replicate", kind: "data" }], log: { text: "stream WAL → replicas", kind: "info" } },
          { caption: "Heavy read traffic is spread across replicas — the primary stays free for writes.", active: ["app", "r1"], packet: { from: "r1", to: "app", label: "rows", kind: "ok" }, log: { text: "reads ← replicas", kind: "ok" } },
          { caption: "Watch for replication lag: a read replica may be milliseconds behind.", active: ["r1", "r2"], log: { text: "⚠ eventual consistency / lag", kind: "err" } },
        ],
      },
      {
        name: "sharding",
        nodes: [
          { id: "app", label: "App", x: 13, y: 50 },
          { id: "router", label: "Shard router", sub: "hash(user_id)", x: 46, y: 50 },
          { id: "sh1", label: "Shard A", sub: "ids 0–33%", x: 85, y: 22 },
          { id: "sh2", label: "Shard B", sub: "ids 34–66%", x: 85, y: 50 },
          { id: "sh3", label: "Shard C", sub: "ids 67–99%", x: 85, y: 78 },
        ],
        edges: [{ from: "app", to: "router", arrow: true }, { from: "router", to: "sh1", arrow: true }, { from: "router", to: "sh2", arrow: true }, { from: "router", to: "sh3", arrow: true }],
        steps: [
          { caption: "When one DB can't hold it all, split rows across shards by a key.", active: ["app", "router"], packet: { from: "app", to: "router", label: "user 8421" }, log: { text: "→ query user_id=8421" } },
          { caption: "The router hashes the key to pick exactly one shard.", active: ["router"], log: { text: "hash(8421) % 3 → shard B", kind: "info" } },
          { caption: "Only that shard is touched — each holds a fraction of the data & load.", active: ["router", "sh2"], packet: { from: "router", to: "sh2", label: "→ B", kind: "ok" }, log: { text: "route → Shard B", kind: "ok" } },
          { caption: "Scales writes horizontally. Cost: cross-shard joins & re-sharding are hard.", active: ["sh1", "sh2", "sh3"], log: { text: "⚠ pick the shard key carefully", kind: "err" } },
        ],
      },
      {
        name: "row-level security", initial: { who: null },
        nodes: [
          { id: "ua", label: "User A", x: 14, y: 28 },
          { id: "ub", label: "User B", x: 14, y: 72 },
          { id: "pol", label: "RLS policy", sub: "user_id = current_user", x: 50, y: 50 },
          { id: "tbl", label: "documents", x: 85, y: 50, w: 118, render: rlsTbl },
        ],
        edges: [{ from: "ua", to: "pol", arrow: true }, { from: "ub", to: "pol", arrow: true }, { from: "pol", to: "tbl", arrow: true }],
        steps: [
          { caption: "Two tenants share ONE table. User A runs a query with no WHERE clause of their own.", active: ["ua", "pol"], packet: { from: "ua", to: "pol", label: "SELECT *" }, set: { who: "A" }, log: { text: "→ A: SELECT * FROM documents" } },
          { caption: "The RLS policy silently appends a filter: USING (user_id = current_user).", active: ["pol"], log: { text: "policy → WHERE user_id = A", kind: "info" } },
          { caption: "So A sees only A's rows — enforced by the database, not the app code.", active: ["pol", "tbl"], packet: { from: "pol", to: "tbl", label: "A's rows", kind: "ok" }, log: { text: "✓ returns A's rows only", kind: "ok" } },
          { caption: "User B runs the identical query…", active: ["ub", "pol"], packet: { from: "ub", to: "pol", label: "SELECT *" }, set: { who: "B" }, log: { text: "→ B: SELECT * FROM documents" } },
          { caption: "…and the same policy transparently scopes them to B's rows instead.", active: ["pol", "tbl"], packet: { from: "pol", to: "tbl", label: "B's rows", kind: "ok" }, log: { text: "✓ returns B's rows only", kind: "ok" } },
          { caption: "Isolation lives in the DB: one policy beats scattering WHERE user_id=? across every query.", active: ["tbl"], log: { text: "tenant isolation, leak-proof by default", kind: "info" } },
        ],
      },
    ],
  };

  window.SCENES_B = { lb, queue, auth, db };
})();
