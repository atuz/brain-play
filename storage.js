import {readHostConfiguration} from './host-config.js?v=27';
// Stable save identifiers. Never reuse an identifier for a different game.
export const gameCodes = Object.freeze({
  '2048': 'g001', twentyfour: 'g002', link: 'g003', stars: 'g004',
  lights: 'g005', fifteen: 'g006', pipes: 'g007', nonogram: 'g008',
  guess: 'g009', domino: 'g010', machine: 'g011',
});
const prefix = 'brain-play:v1:';
const settings = ['preferences', 'sound', 'animations'];
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const slotPattern = /^(?:state|best)(?::(?:classic|fibonacci):[345]|:daily:\d{8})?$|^(?:options|solved|records|completed)$/;

function address(key) {
  if (settings.includes(key)) return ['settings', key];
  if (key === 'solved:24') return ['g002', 'solved'];
  if (key === 'domino:records') return ['g010', 'records'];
  const match = /^(game|best|options|solved):([^:]+)(.*)$/.exec(key);
  if (!match || !Object.hasOwn(gameCodes, match[2])) return null;
  const slot = (match[1] === 'game' ? 'state' : match[1]) + match[3];
  return slotPattern.test(slot) ? [gameCodes[match[2]], slot] : null;
}

export function validSave(value) {
  return object(value) && value.version === 1 && object(value.games) && object(value.settings)
    && Object.keys(value).every(key => ['version', 'games', 'settings'].includes(key))
    && Object.entries(value.games).every(([code, slots]) => /^g\d{3}$/.test(code) && object(slots)
      && Object.keys(slots).every(slot => slotPattern.test(slot)))
    && Object.keys(value.settings).every(key => settings.includes(key));
}

// nativeSave is injected at document start by the App. In App mode writes only
// update this in-memory snapshot; the host receives it when the player returns.
export function createStorage({ storage, nativeSave } = {}) {
  const native = nativeSave !== undefined;
  let data = validSave(nativeSave) ? clone(nativeSave) : { version: 1, games: {}, settings: {} };
  function readLocal(key, fallback) {
    try { return JSON.parse(storage?.getItem(prefix + key)) ?? fallback; } catch { return fallback; }
  }
  function write(key, value) {
    if (!native) {
      try { storage.setItem(prefix + key, JSON.stringify(value)); return true; } catch { return false; }
    }
    try {
      const saved = clone(value);
      if (key === 'completed') {
        for (const [id, code] of Object.entries(gameCodes)) {
          if (Object.hasOwn(saved, id)) (data.games[code] ??= {}).completed = saved[id];
          else if (data.games[code]) delete data.games[code].completed;
        }
        return true;
      }
      const target = address(key);
      if (!target) return false;
      const [group, slot] = target;
      (group === 'settings' ? data.settings : data.games[group] ??= {})[slot] = saved;
      return true;
    } catch { return false; }
  }
  function read(key, fallback = null) {
    if (!native) return readLocal(key, fallback);
    if (key === 'completed') return Object.fromEntries(Object.entries(gameCodes)
      .filter(([, code]) => data.games[code]?.completed !== undefined)
      .map(([id, code]) => [id, clone(data.games[code].completed)]));
    const target = address(key);
    if (!target) return fallback;
    const [group, slot] = target;
    const value = (group === 'settings' ? data.settings : data.games[group])?.[slot];
    return value == null ? fallback : clone(value);
  }
  function remove(key) {
    if (!native) { try { storage.removeItem(prefix + key); } catch {} return; }
    if (key === 'completed') { for (const slots of Object.values(data.games)) delete slots.completed; return; }
    const target = address(key);
    if (!target) return;
    const [group, slot] = target;
    if (group === 'settings') delete data.settings[slot];
    else if (data.games[group]) delete data.games[group][slot];
  }
  // First use of the new App adopts existing WebView progress. Once a native
  // snapshot exists it is authoritative, even if browser data is newer.
  if (native && nativeSave === null) {
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(prefix)) {
          const short = key.slice(prefix.length), value = readLocal(short, undefined);
          if (value !== undefined) write(short, value);
        }
      }
    } catch {}
  }
  return { native, read, write, remove, snapshot: () => clone(data) };
}

const host = typeof window === 'undefined' ? {} : window;
let local;
try { local = host.localStorage; } catch {}
const configuration=host.location?readHostConfiguration(host.location.href,host):{capabilities:{},config:{}};
const supported = configuration.capabilities.save!==false&&host.__brainPlayStorage?.version === 1
  && new URL(host.location.href).searchParams.get('app') !== '0'
  && typeof host.webkit?.messageHandlers?.brainPlay?.postMessage === 'function';
export const storage = createStorage({ storage: local,
  nativeSave: supported ? host.__brainPlayStorage.save : undefined });
const initial=configuration.config;
export const read=(key,fallback)=>storage.read(key,Object.hasOwn(initial,key)?initial[key]:fallback);
export const { write, remove } = storage;
