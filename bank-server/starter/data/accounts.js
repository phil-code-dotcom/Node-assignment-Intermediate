// In-memory "database". Data resets every time the server restarts.
//
// Money is stored as an integer number of CENTS (15000 = 150.00) because
// floating-point numbers can't represent most decimals exactly:
//   0.1 + 0.2 === 0.30000000000000004

import { HttpError, todo } from "../utils/http.js";

const accounts = [];
const transactions = [];
let nextAccountId = 1;
let nextTransactionId = 1;

// ✅ Given: call this every time money moves, so there is a history.
function record(accountId, type, amount, balanceAfter, extra = {}) {
  const tx = {
    id: nextTransactionId++,
    accountId,
    type, // "deposit" | "withdrawal" | "transfer_in" | "transfer_out"
    amount,
    balanceAfter,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  transactions.push(tx);
  return tx;
}

// TODO (Part 1): when minBalance is given, return only accounts with balance >= minBalance.
export function listAccounts({ minBalance } = {}) {
  if (minBalance === undefined) return accounts;
  return accounts.filter((a) => a.balance >= minBalance);
}

// ✅ Given
export function findAccount(id) {
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new HttpError(404, `Account ${id} not found`);
  return account;
}

// ✅ Given
export function createAccount({ owner, initialDeposit = 0 }) {
  const account = {
    id: nextAccountId++,
    owner,
    balance: 0,
    createdAt: new Date().toISOString(),
  };
  accounts.push(account);
  if (initialDeposit > 0) deposit(account.id, initialDeposit);
  return account;
}

// ✅ Given: use it as the pattern for withdraw().
export function deposit(id, amount) {
  const account = findAccount(id);
  account.balance += amount;
  record(id, "deposit", amount, account.balance);
  return account;
}

// TODO (Part 2): like deposit, but
//  - throw HttpError 409 "Insufficient funds" if amount > balance
//  - record a "withdrawal" transaction
export function withdraw(id, amount) {
  const account = findAccount(id);
  if (amount > account.balance) {
    throw new HttpError(409, "Insufficient funds");
  }
  account.balance -= amount;
  record(id, "withdrawal", amount, account.balance);
  return account;
}

// TODO (Part 3): move `amount` from one account to another.
//  - same account                -> 400
//  - either account missing      -> 404, and NO money may move
//  - not enough money            -> 409
//  - record "transfer_out" on the sender and "transfer_in" on the receiver,
//    each with { counterpartyId } pointing at the other account
//  - return { from, to, amount }
export function transfer(fromId, toId, amount) {
  if (fromId === toId) {
    throw new HttpError(400, "Cannot transfer to the same account");
  }

  // look up both accounts first (throws 404 if either is missing)
  const from = findAccount(fromId);
  const to = findAccount(toId);

  if (amount > from.balance) {
    throw new HttpError(409, "Insufficient funds");
  }

  // all checks passed, now move the money
  from.balance -= amount;
  to.balance += amount;
  record(fromId, "transfer_out", amount, from.balance, {
    counterpartyId: toId,
  });
  record(toId, "transfer_in", amount, to.balance, {
    counterpartyId: fromId,
  });

  return { from, to, amount };
}

// TODO (Part 3): remove the account. Only allowed when its balance is exactly 0 (otherwise 409).
export function closeAccount(id) {
  const account = findAccount(id);
  if (account.balance !== 0) {
    throw new HttpError(409, "Balance must be 0 to close an account");
  }
  accounts.splice(accounts.indexOf(account), 1);
}

// TODO (Part 3): all transactions for one account, oldest first. 404 if the account doesn't exist.
export function listTransactions(accountId) {
  // findAccount throws a 404 if the account does not exist
  findAccount(accountId);
  return transactions.filter((t) => t.accountId === accountId);
}

// Seed data so there is something to look at on first run. Don't change it:
// the automated tests expect these three accounts.
createAccount({ owner: "Ada Lovelace", initialDeposit: 150_000 });
createAccount({ owner: "Alan Turing", initialDeposit: 72_500 });
createAccount({ owner: "Grace Hopper", initialDeposit: 0 });
