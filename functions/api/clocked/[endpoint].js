// Cloudflare Pages Function: server-side proxy to the Clocked API.
// The browser never sees CLOCKED_API_KEY. Only the five endpoints CallCheck
// uses are forwarded, request bodies are size-capped, and the client's
// per-attempt request id is reused as the Idempotency-Key so a retry of the
// same attempt is a replay, not a second charge.

const CLOCKED_BASE = "https://clocked.rezolve.ai/clocked/";
const ALLOWED = new Set(["injection", "pii", "extract", "grounding", "decide"]);
const MAX_BODY = 64 * 1024; // CallCheck payloads are a few KB; refuse anything big.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PASS_HEADERS = [
  "x-clocked-credits",
  "x-clocked-model-ms",
  "x-clocked-cost-usd",
  "x-clocked-cost-basis",
  "x-clocked-transport",
  "retry-after",
];

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}

export async function onRequestPost({ request, params, env }) {
  const endpoint = String(params.endpoint || "");
  if (!ALLOWED.has(endpoint)) return json(404, { error: `Unknown endpoint: ${endpoint}` });
  if (!env.CLOCKED_API_KEY) {
    return json(503, { error: "CLOCKED_API_KEY is not configured on this deployment.", code: "no_key" });
  }

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json(413, { error: "Request too large for CallCheck (64 KB cap)." });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { error: "Request too large for CallCheck (64 KB cap)." });
  try {
    JSON.parse(raw);
  } catch {
    return json(400, { error: "Body must be JSON." });
  }

  const clientId = request.headers.get("x-request-id") || "";
  const idem = UUID_RE.test(clientId) ? clientId : crypto.randomUUID();

  const started = Date.now();
  let upstream;
  try {
    upstream = await fetch(CLOCKED_BASE + endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOCKED_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idem,
      },
      body: raw,
    });
  } catch (err) {
    return json(502, { error: "Could not reach Clocked.", detail: String(err && err.message || err) });
  }

  const headers = {
    "content-type": upstream.headers.get("content-type") || "application/json",
    "cache-control": "no-store",
    "x-callcheck-roundtrip-ms": String(Date.now() - started),
    "x-callcheck-idempotency-key": idem,
  };
  for (const h of PASS_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) headers[h] = v;
  }
  headers["access-control-expose-headers"] = Object.keys(headers).join(", ");
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const onRequestGet = () => json(405, { error: "POST only." }, { allow: "POST" });
