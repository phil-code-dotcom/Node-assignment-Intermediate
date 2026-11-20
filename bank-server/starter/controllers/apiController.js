// JSON API handlers. Every handler receives (req, res, { params, query }):
//   params: values from the path,   e.g. /api/accounts/7 -> { id: "7" }   (always strings!)
//   query:  a URLSearchParams,      e.g. ?minBalance=500 -> query.get("minBalance") === "500"
import * as store from "../data/accounts.js";
import { sendJson, readJsonBody, HttpError, todo } from "../utils/http.js";
import { parseId, parseAmount, parseOwner } from "../utils/validate.js";

// GET /api/accounts
// TODO (Part 1): support ?minBalance=50000. If it's present but not an integer -> 400.
export function listAccounts(req, res, { query }) {
  const raw = query.get("minBalance");
  let minBalance;

  if (raw !== null) {
    minBalance = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(minBalance)) {
      throw new HttpError(400, "minBalance must be an integer");
    }
  }

  sendJson(res, 200, store.listAccounts({ minBalance }));
}

// ✅ Given: GET /api/accounts/:id
export function getAccount(req, res, { params }) {
  sendJson(res, 200, store.findAccount(parseId(params.id)));
}

// TODO (Part 2): POST /api/accounts   body: { "owner": "Ada", "initialDeposit": 5000 }
//  - initialDeposit is optional (default 0)
//  - respond 201 Created, with a `Location: /api/accounts/<new id>` header and the new account as JSON
export async function createAccount(req, res) {
  const { owner, initialDeposit } = await readJsonBody(req);
  const cleanOwner = parseOwner(owner);

  // initialDeposit is optional, 0 is fine
  let initial = 0;
  if (initialDeposit !== undefined && initialDeposit !== 0) {
    initial = parseAmount(initialDeposit, "initialDeposit");
  }

  const account = store.createAccount({
    owner: cleanOwner,
    initialDeposit: initial,
  });
  res.setHeader("Location", `/api/accounts/${account.id}`);
  sendJson(res, 201, account);
}

// ✅ Given: POST /api/accounts/:id/deposit   body: { "amount": 500 }
// (It won't work until you finish readJsonBody and parseAmount.)
export async function deposit(req, res, { params }) {
  const id = parseId(params.id);
  const { amount } = await readJsonBody(req);
  sendJson(res, 200, store.deposit(id, parseAmount(amount)));
}

// TODO (Part 2): POST /api/accounts/:id/withdraw   body: { "amount": 500 }
export async function withdraw(req, res, { params }) {
  const id = parseId(params.id);
  const { amount } = await readJsonBody(req);
  sendJson(res, 200, store.withdraw(id, parseAmount(amount)));
}

// TODO (Part 3): POST /api/transfers   body: { "fromId": 1, "toId": 2, "amount": 500 }
export async function transfer(req, res) {
  const { fromId, toId, amount } = await readJsonBody(req);
  const result = store.transfer(
    parseId(fromId, "fromId"),
    parseId(toId, "toId"),
    parseAmount(amount),
  );
  sendJson(res, 200, result);
}

// TODO (Part 3): GET /api/accounts/:id/transactions
export function listTransactions(req, res, { params }) {
  sendJson(res, 200, store.listTransactions(parseId(params.id)));
}

// TODO (Part 3): DELETE /api/accounts/:id
// On success respond 204 No Content: res.writeHead(204) then res.end() with NO body.
export function closeAccount(req, res, { params }) {
  store.closeAccount(parseId(params.id));
  res.writeHead(204);
  res.end();
}
