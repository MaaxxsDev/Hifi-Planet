// BASE_URL spiegelt immer den "base"-Wert aus vite.config.js wider (mit
// abschließendem Slash, z.B. "/hifi/" lokal oder "/" auf IONOS).
export const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });

  // Bewusst unabhängig vom Content-Type-Header versucht: der Header kann durch
  // eine versehentliche Server-Ausgabe vor den PHP-header()-Aufrufen verloren
  // gehen, obwohl der Body trotzdem gültiges JSON enthält. Ohne das würde ein
  // eigentlich erfolgreicher Request still `null` liefern statt die echten Daten.
  const rawText = await res.text();
  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      // Antwort war kein gültiges JSON - unten anhand von res.ok/rawText behandelt.
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Fehler ${res.status}`);
  }
  if (data === null && rawText) {
    throw new Error('Unerwartete Server-Antwort (kein gültiges JSON)');
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
