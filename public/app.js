async function api(url, method, data, token) {
  const res = await fetch('/api/auth' + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: data ? JSON.stringify(data) : undefined,
  });
  const json = await res.json();
  return { ok: res.ok, ...json };
}
function show(r) {
  const el = document.getElementById('msg');
  el.textContent = r.message;
  el.className = r.ok ? 'ok' : 'err';
}
