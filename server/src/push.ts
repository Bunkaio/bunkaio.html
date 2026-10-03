import type { Env } from './types';

/**
 * Notifications push (Web Push, protocole VAPID) vers les appareils de l'admin.
 * - Les clés VAPID sont générées une fois par le Worker et gardées dans le KV (jamais dans le dépôt).
 * - Les notifications sont envoyées SANS contenu chiffré : l'appareil reçoit un simple signal, puis son
 *   service worker vient lire le dernier événement (route protégée par le token admin). Aucune donnée
 *   client ne transite donc par les serveurs de push d'Apple/Google/Mozilla.
 */
const VAPID_KEY = 'push-vapid';
const SUB_PREFIX = 'pushsub:';
const LAST_KEY = 'push-last';

interface VapidKeys { publicKey: string; privateJwk: JsonWebKey }
export interface PushEvent { title: string; body: string; url: string }

const b64u = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64u = (s: string): Uint8Array => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));

export async function getVapid(env: Env): Promise<VapidKeys> {
  const raw = await env.ACCOUNTS_KV.get(VAPID_KEY);
  if (raw) return JSON.parse(raw) as VapidKeys;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const publicKey = b64u((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer);
  const privateJwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
  const keys: VapidKeys = { publicKey, privateJwk };
  await env.ACCOUNTS_KV.put(VAPID_KEY, JSON.stringify(keys));
  return keys;
}

/** JWT VAPID (ES256) pour l'origine du service de push. */
export async function vapidAuthHeader(env: Env, endpoint: string): Promise<string> {
  const keys = await getVapid(env);
  const aud = new URL(endpoint).origin;
  const header = b64u(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:contact@bunkaio.com' })));
  const key = await crypto.subtle.importKey('jwk', keys.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${payload}`));
  return `vapid t=${header}.${payload}.${b64u(sig)}, k=${keys.publicKey}`;
}

async function subKey(endpoint: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return SUB_PREFIX + [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function saveSubscription(env: Env, sub: { endpoint?: unknown }): Promise<boolean> {
  if (typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || sub.endpoint.length > 1000) return false;
  await env.ACCOUNTS_KV.put(await subKey(sub.endpoint), JSON.stringify({ endpoint: sub.endpoint, at: new Date().toISOString() }), { expirationTtl: 365 * 86400 });
  return true;
}
export async function removeSubscription(env: Env, endpoint: string): Promise<void> {
  await env.ACCOUNTS_KV.delete(await subKey(endpoint));
}

export async function getLastPush(env: Env): Promise<PushEvent | null> {
  try { return JSON.parse((await env.ACCOUNTS_KV.get(LAST_KEY)) ?? 'null') as PushEvent | null; } catch { return null; }
}

/** Enregistre l'événement puis réveille chaque appareil abonné. Jamais bloquant pour l'appelant. */
export async function notifyAdmin(env: Env, ev: PushEvent): Promise<void> {
  try {
    await env.ACCOUNTS_KV.put(LAST_KEY, JSON.stringify({ ...ev, at: new Date().toISOString() }), { expirationTtl: 7 * 86400 });
    const keys = (await env.ACCOUNTS_KV.list({ prefix: SUB_PREFIX, limit: 50 })).keys;
    for (const k of keys) {
      const raw = await env.ACCOUNTS_KV.get(k.name);
      if (!raw) continue;
      const { endpoint } = JSON.parse(raw) as { endpoint: string };
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: await vapidAuthHeader(env, endpoint), TTL: '86400', Urgency: 'normal', 'Content-Length': '0' } });
        if (res.status === 404 || res.status === 410) await env.ACCOUNTS_KV.delete(k.name);
        else if (!res.ok) console.error('[push] envoi refusé', res.status);
      } catch (err) {
        console.error('[push] envoi impossible', err);
      }
    }
  } catch (err) {
    console.error('[push] notification en échec', err);
  }
}

export { fromB64u };
