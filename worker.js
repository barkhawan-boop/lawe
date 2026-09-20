const encoder = new TextEncoder();
const SESSION_SECONDS = 8 * 60 * 60;
const cookieName = 'lawe_session';
const publicAssets = new Set(['/', '/index.html', '/styles.css', '/auth.js', '/auth-mode.js', '/assets/myapps-logo.jpg', '/assets/sarchia-baran.ttf', '/theme.js']);
const protectedAssets = new Set(['/script.js', '/export.js', '/vendor/exceljs.min.js', '/vendor/exceljs.LICENSE']);

function respond(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', ...extra
  }});
}
async function key(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
function hex(bytes) { return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join(''); }
async function authenticated(request, env) {
  if (!env.SESSION_SECRET || (!env.APP_PIN && !env.BOSS_PIN)) return false;
  const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token) return false;
  const [expiry, nonce, signature] = token.split('.');
  if (!/^\d+$/.test(expiry) || !/^[a-f0-9]{32}$/.test(nonce || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  const now = Math.floor(Date.now() / 1000);
  if (+expiry <= now || +expiry > now + SESSION_SECONDS) return false;
  return crypto.subtle.verify('HMAC', await key(env.SESSION_SECRET),
    Uint8Array.from(signature.match(/../g), h => parseInt(h, 16)), encoder.encode(expiry + '.' + nonce));
}
function cookie(value, age, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return cookieName + '=' + value + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=' + age + secure;
}
async function readSmallJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1024) { await reader.cancel(); throw new Error('Request too large'); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(buffer));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lending' && await authenticated(request, env)) { if (!env.lawe_cash_desk) return respond('{"error":"Database not configured"}',503); if (request.method === 'GET') { const q=await env.lawe_cash_desk.prepare('SELECT id,person,phone,usd,iqd,fib,super_qi AS superQi,direction FROM lending_records ORDER BY created_at DESC').all(); return respond(JSON.stringify({records:q.results})); } if (request.method === 'POST') { const x=await request.json(); const id=crypto.randomUUID(); await env.lawe_cash_desk.prepare('INSERT INTO lending_records (id,person,phone,usd,iqd,fib,super_qi,direction) VALUES (?,?,?,?,?,?,?,?)').bind(id,x.person,x.phone||'',Number(x.usd)||0,Number(x.iqd)||0,Number(x.fib)||0,Number(x.superQi)||0,x.direction).run(); return respond(JSON.stringify({id}),201); } }
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/session' && request.method === 'GET') {
        return respond(JSON.stringify({ authenticated: await authenticated(request, env) }));
      }
      if (request.method !== 'POST') return respond('{"error":"Method not allowed"}', 405);
      if (request.headers.get('Origin') !== url.origin) return respond('{"error":"Invalid origin"}', 403);
      if (url.pathname === '/api/logout') return respond('{}', 200, { 'Set-Cookie': cookie('', 0, request) });
      if (url.pathname !== '/api/login') return respond('{"error":"Not found"}', 404);
      if ((!env.APP_PIN && !env.BOSS_PIN) || !env.SESSION_SECRET || !env.LOGIN_LIMITER) return respond('{"error":"PIN service is not configured"}', 503);
      const limit = await env.LOGIN_LIMITER.limit({ key: 'login:' + (request.headers.get('CF-Connecting-IP') || 'local') });
      if (!limit.success) return respond('{"error":"Too many attempts. Try again in one minute."}', 429, { 'Retry-After': '60' });
      let input;
      try { input = await readSmallJson(request); } catch { return respond('{"error":"Invalid request"}', 400); }
      if (typeof input?.pin !== 'string' || !/^\d{4}$/.test(input.pin)) return respond('{"error":"Incorrect PIN"}', 401);
      const expected = await crypto.subtle.digest('SHA-256', encoder.encode(input.pin === env.BOSS_PIN ? env.BOSS_PIN : env.APP_PIN));
      const actual = await crypto.subtle.digest('SHA-256', encoder.encode(input.pin));
      if (!crypto.subtle.timingSafeEqual(expected, actual)) return respond('{"error":"Incorrect PIN"}', 401);
      const payload = Math.floor(Date.now() / 1000 + SESSION_SECONDS) + '.' + hex(crypto.getRandomValues(new Uint8Array(16)));
      const signature = hex(await crypto.subtle.sign('HMAC', await key(env.SESSION_SECRET), encoder.encode(payload)));
      return respond('{}', 200, { 'Set-Cookie': cookie(payload + '.' + signature, SESSION_SECONDS, request) });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return respond('{"error":"Method not allowed"}', 405);
    if (!publicAssets.has(url.pathname) && !protectedAssets.has(url.pathname)) return respond('{"error":"Not found"}', 404);
    if (protectedAssets.has(url.pathname) && !await authenticated(request, env)) return respond('{"error":"PIN required"}', 401);
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'same-origin');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    return new Response(asset.body, { status: asset.status, headers });
  }
};




