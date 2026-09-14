// Convenience lock for static hosting only; not included in Cloudflare assets.
window.checkLocalPin = async function(pin) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  return hex === "15fc36b3e80b9d7f87f7dc90cd7a2845c5d8501c30f03379fcf14154f1680380";
}
