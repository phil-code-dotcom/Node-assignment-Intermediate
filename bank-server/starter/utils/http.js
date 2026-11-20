// Low-level helpers for talking HTTP with Node's built-in `http` module.

// An Error that carries an HTTP status code, so any layer can throw
// `new HttpError(404, "Account not found")` and server.js turns it into a response.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Placeholder for unfinished code: answers "501 Not Implemented".
// Delete each todo(...) call as you implement that piece.
export function todo(what) {
  throw new HttpError(501, `Not implemented yet: ${what}`);
}

// ✅ Given. Read it carefully: sendHtml below works the same way.
export function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

// TODO (Part 4): send an HTML string with the right status and Content-Type.
// Hint: Content-Type should be "text/html; charset=utf-8".
export function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

// TODO (Bonus): reply with status 303 and a `Location` header, and no body.
export function redirect(res, location) {
  res.writeHead(303, { Location: location });
  res.end();
}

const MAX_BODY_BYTES = 1_000_000;

// TODO (Part 2): read the whole request body and return it as a string.
// The body arrives as a STREAM of Buffer chunks, so you can't just read `req.body`
// (that's an Express thing!). Either:
//   - use `for await (const chunk of req) { ... }`, or
//   - listen for req.on("data", ...) and req.on("end", ...) inside a Promise.
// Then Buffer.concat(chunks).toString("utf8").
// Extra: if the total size passes MAX_BODY_BYTES, throw new HttpError(413, "Request body too large").
export async function readBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    // stop early if the body is too big
    if (total > MAX_BODY_BYTES) {
      throw new HttpError(413, "Request body too large");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

// TODO (Part 2): read the body and JSON.parse it.
//  - An empty body should return {}.
//  - Invalid JSON must become a 400 error, not a 500 crash.
export async function readJsonBody(req) {
  const raw = await readBody(req);

  // no body at all
  if (raw.trim() === "") return {};

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }

  // the controllers expect an object like { "amount": 500 }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new HttpError(400, "JSON body must be an object");
  }

  return data;
}
// TODO (Bonus): HTML forms send `application/x-www-form-urlencoded`, e.g. "amount=500".
// Hint: new URLSearchParams(rawBody) can parse that for you.
export async function readFormBody(req) {
  const raw = await readBody(req);
  // "amount=500" -> { amount: "500" }
  return Object.fromEntries(new URLSearchParams(raw));
}
