(() => {
  const form = document.querySelector('#pinForm');
  const input = document.querySelector('#pinInput');
  const error = document.querySelector('#pinError');
  const submit = form.querySelector('button');
  let loaded = false;
  let unlocked = false;
  let localAttempts = 0;
  let localBlockedUntil = 0;

  async function loadScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(new Error('Unable to load the app. Please retry.')); };
      document.body.append(script);
    });
  }
  async function unlock() {
    if (!loaded) {
      await loadScript('export.js');
      await loadScript('script.js');
      loaded = true;
    }
    unlocked = true;
    document.querySelector('#pinGate').hidden = true;
    document.querySelector('#app').hidden = false;
    input.value = '';
    document.querySelector('#usdAmount').focus();
  }
  function lock() {
    unlocked = false;
    document.querySelector('#app').hidden = true;
    document.querySelector('#pinGate').hidden = false;
    input.value = '';
    input.focus();
  }
  document.querySelector('#lockBtn').addEventListener('click', async () => {
    lock();
    if (window.LAWE_SERVER_AUTH) {
      try {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (!res.ok) throw new Error();
      } catch { error.textContent = 'Unable to end the server session. Retry when connected.'; }
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    submit.disabled = true;
    try {
      if (window.LAWE_SERVER_AUTH) {
        const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: input.value }) });
        if (!res.ok) {
          const message = await res.json();
          throw new Error(message.error || 'Unable to sign in.');
        }
      } else {
        if (Date.now() < localBlockedUntil) throw new Error('Try again in one minute.');
        if (!window.checkLocalPin) await loadScript('local-pin.js');
        if (!await window.checkLocalPin(input.value)) {
          if (++localAttempts >= 5) { localBlockedUntil = Date.now() + 60000; localAttempts = 0; }
          throw new Error('PIN هەڵەیە');
        }
        localAttempts = 0;
      }
      await unlock();
    } catch (e) { error.textContent = e.message; input.select(); }
    finally { submit.disabled = false; }
  });
  // Recheck a server session after returning to the tab, and once per minute.
  async function checkSession() {
    if (!window.LAWE_SERVER_AUTH || !unlocked) return;
    try {
      const res = await fetch('/api/session', { cache: 'no-store' });
      if (!res.ok || !(await res.json()).authenticated) lock();
    } catch { lock(); }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void checkSession(); });
  setInterval(() => { void checkSession(); }, 60000);
  input.focus();
})();
