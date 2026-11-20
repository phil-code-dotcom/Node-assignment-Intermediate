// A tiny hand-written router: a list of routes plus a function that finds the match.
// This is the core of what Express does for you. Here you build it yourself.
import { HttpError, todo } from "./utils/http.js";
import * as api from "./controllers/apiController.js";
import * as pages from "./controllers/pagesController.js";

// The route table. ":id" marks a path parameter.
// ✅ All routes are already listed. Your job is in the controllers and in the functions below.
const routes = [
  // HTML pages
  { method: "GET", path: "/", handler: pages.home },
  { method: "GET", path: "/styles.css", handler: pages.styles },
  { method: "GET", path: "/accounts", handler: pages.accountList },
  { method: "GET", path: "/accounts/:id", handler: pages.accountDetail },
  { method: "POST", path: "/accounts/:id/deposit", handler: pages.depositForm },
  {
    method: "POST",
    path: "/accounts/:id/withdraw",
    handler: pages.withdrawForm,
  },

  // JSON API
  { method: "GET", path: "/api/accounts", handler: api.listAccounts },
  { method: "POST", path: "/api/accounts", handler: api.createAccount },
  { method: "GET", path: "/api/accounts/:id", handler: api.getAccount },
  { method: "DELETE", path: "/api/accounts/:id", handler: api.closeAccount },
  { method: "POST", path: "/api/accounts/:id/deposit", handler: api.deposit },
  { method: "POST", path: "/api/accounts/:id/withdraw", handler: api.withdraw },
  {
    method: "GET",
    path: "/api/accounts/:id/transactions",
    handler: api.listTransactions,
  },
  { method: "POST", path: "/api/transfers", handler: api.transfer },
];

// TODO (Part 1) ⭐ START HERE. Nothing works until this does.
// Compare a route pattern with a real path, segment by segment.
//   matchPath("/accounts/:id", "/accounts/7")    -> { id: "7" }
//   matchPath("/accounts", "/accounts")          -> {}      (match, no params)
//   matchPath("/accounts/:id", "/about")         -> null    (no match)
//   matchPath("/accounts/:id", "/accounts/7/x")  -> null    (different number of segments)
// Hint: "/accounts/7".split("/") -> ["", "accounts", "7"]
export function matchPath(pattern, path) {
  // console.log("Pattern: ", pattern);
  // console.log("Path: ", path);

  const patternParts = pattern.split("/");
  const pathParts = path.split("/");

  // console.log("Pattern-part: ", patternParts);
  // console.log("Path-part: ", pathParts);

  // different number of segments means no match
  if (patternParts.length !== pathParts.length) return null;

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      try {
        // ":id" -> key "id", value is the real segment
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } catch (error) {
        // broken % sequence in the url, so no match
        return null;
      }
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

// TODO (Part 1): "/api/accounts/" and "/api/accounts" should be the same route.
// Remove trailing slashes, but "/" must stay "/".
export function normalizePath(pathname) {
  const cleaned = pathname.replace(/\/+$/, "");
  // "/" becomes "" after removing slashes, so put it back
  return cleaned === "" ? "/" : cleaned;
}

export async function handleRequest(req, res) {
  // req.url is only the path + query, e.g. "/api/accounts?minBalance=500".
  // new URL() needs a full URL to parse it, so we give it a dummy base.
  const url = new URL(req.url, "http://localhost");
  const path = normalizePath(url.pathname);
  const allowedMethods = [];

  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params && route.method === req.method) {
      return route.handler(req, res, { params, query: url.searchParams });
    }
    // path matched but the method did not, so remember this method
    if (params) {
      allowedMethods.push(route.method);
    }
  }

  if (allowedMethods.length > 0) {
    res.setHeader("Allow", allowedMethods.join(", "));
    throw new HttpError(405, `Method not found: ${req.method}`);
  }
  // TODO (Part 1): if the PATH matched some route but the METHOD didn't
  // (e.g. PUT /api/accounts), respond 405 instead of 404, and set an
  // `Allow` header listing the methods that DO work, e.g. "GET, POST".
  throw new HttpError(404, `Route not found: ${req.method} ${path}`);
}