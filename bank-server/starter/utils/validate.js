import { HttpError, todo } from "./http.js";

// ✅ Given, as an example of how the other validators should work.
// Route params arrive as strings ("42"). Turn them into a positive integer or 400.
export function parseId(value, name = "id") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${name} must be a positive integer`);
  }
  return id;
}

// TODO (Part 2): amounts are whole CENTS, so only positive integers are valid.
//   500    -> 500
//   "500"  -> 500   (HTML forms send everything as strings)
//   0, -5, 10.5, "ten", undefined -> throw HttpError 400
export function parseAmount(value, name = "amount") {
  const message = `${name} must be a positive whole number of cents`;

  // only numbers and strings are allowed (true, null, arrays are not)
  if (typeof value !== "number" && typeof value !== "string") {
    throw new HttpError(400, message);
  }

  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, message);
  }
  return amount;
}

// TODO (Part 2): owner must be a string of 2-100 characters (after trimming).
// Return the trimmed string, or throw HttpError 400.
export function parseOwner(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "owner must be a string");
  }

  const owner = value.trim();
  if (owner.length < 2 || owner.length > 100) {
    throw new HttpError(400, "owner must be 2-100 characters");
  }
  return owner;
}
