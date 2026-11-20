// HTML page handlers: build the whole page on the server and send it as a string.
// No React, no template engine: just template literals and sendHtml().
import { readFile } from "node:fs/promises";
import * as store from "../data/accounts.js";
import { sendHtml, readFormBody, redirect, todo } from "../utils/http.js";
import { parseId, parseAmount } from "../utils/validate.js";
import { layout, escapeHtml, formatMoney } from "../views/layout.js";

// ✅ Given: GET /   Use it as the pattern for the other pages.
// (It won't work until you finish sendHtml.)
export function home(req, res) {
  const accounts = store.listAccounts();
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  sendHtml(
    res,
    200,
    layout(
      "Home",
      `<h1>Welcome to Node Bank</h1>
      <p>We look after <strong>${accounts.length}</strong> accounts holding
         <strong>${formatMoney(total)}</strong> in total.</p>
      <p><a href="/accounts">View all accounts →</a></p>`,
    ),
  );
}

// TODO (Part 4): GET /accounts
// Render a <table> with one row per account: id, owner (a link to /accounts/<id>), balance.
// Hint: build the rows with accounts.map(a => `<tr>...</tr>`).join("")
// ⚠️ Always wrap user data in escapeHtml(...).
export function accountList(req, res) {
  const accounts = store.listAccounts();

  const rows = accounts
    .map(
      (a) => `<tr>
          <td>${a.id}</td>
          <td><a href="/accounts/${a.id}">${escapeHtml(a.owner)}</a></td>
          <td class="num">${formatMoney(a.balance)}</td>
        </tr>`,
    )
    .join("");

  sendHtml(
    res,
    200,
    layout(
      "Accounts",
      `<h1>Accounts</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Owner</th><th class="num">Balance</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`,
    ),
  );
}

// TODO (Part 4): GET /accounts/:id
// Show the owner's name, the balance (use formatMoney) and a table of transactions.
// An unknown id must give a 404 page (findAccount already throws for you).
// Bonus: add two <form method="POST"> elements that post `amount` to
//        /accounts/<id>/deposit and /accounts/<id>/withdraw
export function accountDetail(req, res, { params }) {
  const id = parseId(params.id);
  // findAccount throws a 404 for an unknown id
  const account = store.findAccount(id);
  const transactions = store.listTransactions(id);

  const rows = transactions
    .map(
      (t) => `<tr>
          <td>${t.id}</td>
          <td>${escapeHtml(t.type)}</td>
          <td class="num">${formatMoney(t.amount)}</td>
          <td class="num">${formatMoney(t.balanceAfter)}</td>
          <td>${escapeHtml(t.createdAt)}</td>
        </tr>`,
    )
    .join("");

  // layout() already escapes the title
  sendHtml(
    res,
    200,
    layout(
      account.owner,
      `<h1>${escapeHtml(account.owner)}</h1>
      <p class="balance">Balance: <strong>${formatMoney(account.balance)}</strong></p>

      <div class="forms">
        <form method="POST" action="/accounts/${id}/deposit">
          <label>Deposit (cents)
            <input type="number" name="amount" min="1" required />
          </label>
          <button type="submit">Deposit</button>
        </form>
        <form method="POST" action="/accounts/${id}/withdraw">
          <label>Withdraw (cents)
            <input type="number" name="amount" min="1" required />
          </label>
          <button type="submit">Withdraw</button>
        </form>
      </div>

      <h2>Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Type</th>
            <th class="num">Amount</th><th class="num">Balance after</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`,
    ),
  );
}

// TODO (Bonus): POST /accounts/:id/deposit  (from an HTML form)
// Read the form body, deposit, then redirect(res, `/accounts/${id}`).
// Why redirect? Look up the "Post/Redirect/Get" pattern, then try refreshing the page without it.
export async function depositForm(req, res, { params }) {
  const id = parseId(params.id);
  const form = await readFormBody(req);
  store.deposit(id, parseAmount(form.amount));
  redirect(res, `/accounts/${id}`);
}

// TODO (Bonus): POST /accounts/:id/withdraw  (from an HTML form)
export async function withdrawForm(req, res, { params }) {
  const id = parseId(params.id);
  const form = await readFormBody(req);
  store.withdraw(id, parseAmount(form.amount));
  redirect(res, `/accounts/${id}`);
}

// TODO (Part 4): GET /styles.css
// Read ../public/styles.css from disk with readFile and send it with Content-Type "text/css; charset=utf-8".
// Hint: new URL("../public/styles.css", import.meta.url) gives the file's location
// no matter which folder you started node from.
export async function styles(req, res) {
  const css = await readFile(new URL("../public/styles.css", import.meta.url));
  res.writeHead(200, {
    "Content-Type": "text/css; charset=utf-8",
    "Content-Length": css.length,
  });
  res.end(css);
}
