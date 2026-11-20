// Server-side rendering with nothing but template strings.

// TODO (Part 4): this currently does NOTHING, which makes every page unsafe.
// Text that came from a user (like an account owner's name) must be escaped
// before it goes into HTML. Otherwise an owner named
//   <script>alert('hacked')</script>
// runs JavaScript in every visitor's browser (an XSS attack).
// Replace these 5 characters:  &  <  >  "  '
// with:                        &amp;  &lt;  &gt;  &quot;  &#39;
// (Do & FIRST. Why? Try it in the other order and see.)
export function escapeHtml(value) {
  // & must be replaced first, or the & in &lt; etc. would be replaced again
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ✅ Given: 150000 cents -> "1,500.00"
export function formatMoney(cents) {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ✅ Given: wraps a page body in the full HTML document.
export function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} · Node Bank</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <header>
      <a href="/" class="brand">Node Bank</a>
      <nav><a href="/">Home</a> <a href="/accounts">Accounts</a></nav>
    </header>
    <main>
${body}
    </main>
  </body>
</html>`;
}
