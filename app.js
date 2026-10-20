import { el, read, write, dateSeed, seeded } from './shared.js?v=2';
import { games, preview } from './catalog.js?v=2';
import { languages, setLanguage, getLanguage, t } from './i18n.js?v=2';
import { normalizeCountry, resolvePreferences, updatePreferenceURL } from './preferences.js?v=2';

const main = document.querySelector('#main');
const header = document.querySelector('#app-header');
const preferences = resolvePreferences(location.href, read('preferences', {}), navigator.languages || [navigator.language], Intl.DateTimeFormat().resolvedOptions().locale);
let country = preferences.country;
setLanguage(preferences.language);
history.replaceState(null, '', preferences.url);
let cleanup, currentGame, routeVersion = 0;

function applyDocumentPreferences() {
  document.documentElement.lang = getLanguage();
  document.documentElement.dataset.motion = read('animations', true) ? 'on' : 'off';
  document.querySelector('.skip').textContent = t('跳到主要内容');
}
applyDocumentPreferences();
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); main.scrollIntoView(); });

function headerView(game) {
  header.replaceChildren();
  const back = game
    ? el('a', { class: 'app-back', href: '#/', 'aria-label': '返回' }, [el('span', { text: '←', 'aria-hidden': 'true' })])
    : el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i'), el('i')]);
  header.append(el('div', { class: 'app-title' }, [back, el('h1', { text: game ? game.name : '小小动脑场' })]));
  const actions = el('div', { class: 'app-header-actions' });
  if (game) actions.append(el('button', { type: 'button', class: 'app-icon', text: '?', 'aria-label': '帮助', onclick: () => showHelp(game) }));
  actions.append(el('button', { type: 'button', class: 'app-icon', text: '⚙', 'aria-label': '设置', onclick: showSettings }));
  header.append(actions);
}

function home() {
  headerView();
  document.title = `${t('小小动脑场')} · Brain Play`;
  const grid = el('section', { class: 'home-games', 'aria-label': '游戏' });
  for (const game of games) {
    const card = el('a', { class: 'home-game', href: `#/game/${game.id}`, 'aria-label': `${t('开始玩')} ${t(game.name)}` });
    const art = el('span', { class: 'home-game-art', style: `--tint:${game.tint}` });
    art.innerHTML = preview(game.id);
    card.append(art, el('span', { class: 'home-game-name', text: game.name }));
    grid.append(card);
  }
  main.replaceChildren(grid);
}

function dialog(title, closeLabel) {
  const modal = el('dialog', { class: 'app-dialog', 'aria-label': title });
  const titleId = 'dialog-title';
  const close = el('button', { type: 'button', class: 'app-icon', text: '×', 'aria-label': closeLabel, onclick: () => modal.close() });
  modal.append(el('div', { class: 'dialog-header' }, [el('h2', { id: titleId, text: title }), close]));
  modal.setAttribute('aria-labelledby', titleId);
  modal.addEventListener('click', event => { if (event.target === modal && (event.clientX < modal.getBoundingClientRect().left || event.clientX > modal.getBoundingClientRect().right || event.clientY < modal.getBoundingClientRect().top || event.clientY > modal.getBoundingClientRect().bottom)) modal.close(); });
  modal.addEventListener('close', () => modal.remove());
  document.body.append(modal);
  return modal;
}

function showHelp(game) {
  const modal = dialog(t(game.name), '关闭帮助');
  modal.append(el('ol', { class: 'help-list' }, game.help.map(text => el('li', { text }))));
  modal.showModal();
}

function showSettings() {
  const modal = dialog('设置', '关闭设置');
  const form = el('form', { class: 'settings-form' });
  const language = el('select', { id: 'setting-language', 'aria-label': '语言' });
  languages.forEach(item => language.append(el('option', { value: item.code, text: item.name })));
  language.value = getLanguage();
  const code = el('input', { id: 'setting-country', type: 'text', maxlength: '2', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', placeholder: 'CA', 'aria-label': '国家／地区代码' });
  code.value = country;
  const auto = el('button', { type: 'button', class: 'btn plain small', text: '自动', onclick: () => {
    code.value = resolvePreferences(location.origin + location.pathname, {}, navigator.languages || [navigator.language], Intl.DateTimeFormat().resolvedOptions().locale).country;
  } });
  const audio = el('input', { type: 'checkbox', id: 'setting-sound', checked: read('sound', false) });
  const motion = el('input', { type: 'checkbox', id: 'setting-motion', checked: read('animations', true) });
  form.append(
    el('label', { class: 'settings-label', for: 'setting-language', text: '语言' }), language,
    el('label', { class: 'settings-label', for: 'setting-country', text: '国家／地区代码' }),
    el('div', { class: 'country-field' }, [code, auto]),
    el('label', { class: 'settings-toggle', for: 'setting-sound' }, [el('span', { text: '音效' }), audio]),
    el('label', { class: 'settings-toggle', for: 'setting-motion' }, [el('span', { text: '动画' }), motion]),
    el('p', { class: 'settings-note', text: '进度只保存在当前浏览器。' }),
    el('button', { type: 'submit', class: 'btn settings-done', text: '完成' }),
  );
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (code.value.trim() && !normalizeCountry(code.value.trim())) { code.setCustomValidity(t('国家代码需要两位英文字母，例如 CA。')); code.reportValidity(); return; }
    code.setCustomValidity('');
    country = normalizeCountry(code.value.trim());
    setLanguage(language.value);
    write('preferences', { language: getLanguage(), country });
    write('sound', audio.checked);
    write('animations', motion.checked);
    history.replaceState(null, '', updatePreferenceURL(location.href, getLanguage(), country));
    applyDocumentPreferences();
    modal.close();
    void route(false);
  });
  code.addEventListener('input', () => code.setCustomValidity(''));
  modal.append(form);
  modal.showModal();
}

const mounts = {
  '2048': () => import('./2048.js?v=2'), twentyfour: () => import('./twentyfour.js?v=2'),
  lights: () => import('./lights.js?v=2'), fifteen: () => import('./fifteen.js?v=2'),
  pipes: () => import('./pipes.js?v=2'), nonogram: () => import('./nonogram.js?v=2'),
  link: () => import('./link.js?v=2'), stars: () => import('./stars.js?v=2'), guess: () => import('./guess.js?v=2'),
};

async function route(scroll = true) {
  const version = ++routeVersion;
  cleanup?.();
  cleanup = null;
  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const id = path.split('/')[2];
  currentGame = games.find(game => game.id === id);
  if (!currentGame) { home(); if (scroll) window.scrollTo(0, 0); return; }
  headerView(currentGame);
  document.title = `${t(currentGame.name)} · Brain Play`;
  const daily = new URLSearchParams(query).get('daily') === '1';
  const seed = dateSeed();
  const saveKey = `game:${id}${daily ? ':daily:' + seed : ''}`;
  const panel = el('section', { class: 'play-panel', 'aria-label': t(currentGame.name) });
  main.replaceChildren(el('div', { class: 'game-layout' }, [panel]));
  try {
    const module = await mounts[id]();
    if (version !== routeVersion) return;
    cleanup = module.mount(panel, {
      daily, seed, rng: daily ? seeded(seed + games.indexOf(currentGame)) : Math.random,
      load: () => read(saveKey), save: state => write(saveKey, state), read, write,
    });
  } catch (error) {
    console.error(error);
    panel.replaceChildren(el('p', { class: 'status error', text: '游戏加载遇到了问题，请刷新页面后重试。' }));
  }
  if (scroll) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => route());
void route();
