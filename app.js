import { el, read, write, dateSeed, seeded, toast } from './shared.js?v=27';
import { games, preview } from './catalog.js?v=23';
import { languages, setLanguage, getLanguage, t } from './i18n.js?v=16';
import { resolvePreferences, updatePreferenceURL } from './preferences.js?v=27';

import { connectAppHost } from './app-host.js?v=27';
import { storage, gameCodes } from './storage.js?v=27';
import {gameRuntime,bindGameLifecycle} from './game-runtime.js?v=26';
import {createRoundSession} from './game-round.js?v=27';

const appHost = connectAppHost(location.href, window);
const main = document.querySelector('#main');
const header = document.querySelector('#app-header');
const waiting=el('div',{class:'app-game-wait',role:'status',hidden:true,text:'…','aria-label':'准备中'});
main.before(waiting);
function setWaiting(value){gameRuntime.setPaused('navigation',value);main.setAttribute('aria-busy',String(value));waiting.hidden=!value;}
gameRuntime.subscribe(paused=>{main.inert=paused;});
bindGameLifecycle(window,document,gameRuntime,appHost.embedded&&appHost.configuration.capabilities.activity!==false);
document.addEventListener('keydown',event=>{if(gameRuntime.paused&&event.key!=='Tab'&&!header.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();}},true);
const preferences = resolvePreferences(location.href, read('preferences', {}), navigator.languages || [navigator.language], Intl.DateTimeFormat().resolvedOptions().locale,appHost.configuration.config);
const country = preferences.country;
setLanguage(preferences.language);
history.replaceState(null, '', preferences.url);
let cleanup, currentGame, activeModule, routeVersion = 0;
let initialNavigation=true,lastLevelInfo=null;
const initialNavigationReason=performance.getEntriesByType('navigation')[0]?.type==='reload'?'reload':'enter';

function applyDocumentPreferences() {
  document.documentElement.dataset.theme=appHost.configuration.config.theme||'light';
  document.documentElement.lang = getLanguage();
  document.documentElement.dataset.motion = read('animations', true) ? 'on' : 'off';
  document.querySelector('.skip').textContent = t('跳到主要内容');
}
applyDocumentPreferences();
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); main.scrollIntoView(); });

function returnToApp() {
  if (!appHost.close(storage.native ? storage.snapshot() : undefined)) toast('请使用 App 顶部的返回按钮。');
}
// Also used by the native fallback back button. No timer, background hook or
// per-move message is registered: saves are transferred only on return.
if (storage.native) window.brainPlayExportSave = () => storage.snapshot();

function headerView(game) {
  header.replaceChildren();
  const back = game
    ? el('a', { class: 'app-back', href: '#/', 'aria-label': '返回' }, [el('span', { text: '←', 'aria-hidden': 'true' })])
    : appHost.embedded
      ? el('button', { type: 'button', class: 'app-back', 'data-testid': 'app-exit', 'aria-label': '返回 App', title: '返回 App', text: '←', onclick: returnToApp })
      : el('span', { class: 'brand-mark', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i'), el('i')]);
  const name = game ? activeModule?.title?.({ read }) || game.name : '小小动脑场';
  header.append(el('div', { class: 'app-title' }, [back, el('h1', { text: name })]));
  const actions = el('div', { class: 'app-header-actions' });
  if (game) actions.append(el('button', { type: 'button', class: 'app-icon', text: '?', 'aria-label': '帮助', onclick: () => showHelp(game) }));
  if (!game || activeModule?.settings) actions.append(el('button', { type: 'button', class: 'app-icon', text: '⚙', 'aria-label': game ? '游戏设置' : '设置', onclick: game ? showGameSettings : showSettings }));
  if (game && appHost.embedded) actions.append(el('button', { type: 'button', class: 'app-icon app-exit', 'data-testid': 'app-exit', text: '×', 'aria-label': '返回 App', title: '返回 App', onclick: returnToApp }));
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
  const modal = dialog(activeModule?.title?.({ read }) || t(game.name), '关闭帮助');
  const rules=activeModule?.rules?.({read})||game.rules;
  modal.append(el('div',{class:'help-sections'},rules.map(section=>el('section',{class:'help-section'},[
    el('h3',{text:section.title}),el('p',{text:section.text}),
  ]))));
  modal.showModal();
}

function showGameSettings() {
  const config = activeModule?.settings?.({ read, write });
  if (!config) return;
  const modal = dialog('游戏设置', '关闭设置');
  const form = el('form', { class: 'settings-form' });
  const fields = new Map();
  for (const field of config.fields) {
    const select = el('select', { id: `game-setting-${field.key}`, 'aria-label': field.label });
    for (const option of field.options) select.append(el('option', { value: option.value, text: option.label }));
    select.value = String(config.value[field.key]);
    fields.set(field.key, select);
    form.append(el('label', { class: 'settings-label', for: select.id, text: field.label }), select);
  }
  if (config.note) form.append(el('p', { class: 'settings-note', text: config.note }));
  form.append(el('button', { type: 'submit', class: 'btn settings-done', text: '完成' }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    config.save(Object.fromEntries([...fields].map(([key, field]) => [key, field.value])));
    modal.close();
    void route(false);
  });
  modal.append(form);
  modal.showModal();
}

function showSettings() {
  const modal = dialog('设置', '关闭设置');
  const form = el('form', { class: 'settings-form' });
  const language = el('select', { id: 'setting-language', 'aria-label': '语言' });
  languages.forEach(item => language.append(el('option', { value: item.code, text: item.name })));
  language.value = getLanguage();
  const audio = el('input', { type: 'checkbox', id: 'setting-sound', checked: read('sound', false) });
  const motion = el('input', { type: 'checkbox', id: 'setting-motion', checked: read('animations', true) });
  form.append(
    el('label', { class: 'settings-label', for: 'setting-language', text: '语言' }), language,
    el('label', { class: 'settings-toggle', for: 'setting-sound' }, [el('span', { text: '音效' }), audio]),
    el('label', { class: 'settings-toggle', for: 'setting-motion' }, [el('span', { text: '动画' }), motion]),
    el('p', { class: 'settings-note', text: storage.native ? '返回时自动保存到手机，下次继续。' : '进度只保存在当前浏览器。' }),
    el('button', { type: 'submit', class: 'btn settings-done', text: '完成' }),
  );
  form.addEventListener('submit', event => {
    event.preventDefault();
    setLanguage(language.value);
    write('preferences', { language: getLanguage(), country });
    write('sound', audio.checked);
    write('animations', motion.checked);
    history.replaceState(null, '', updatePreferenceURL(location.href, getLanguage(), country));
    applyDocumentPreferences();
    modal.close();
    void route(false);
  });
  modal.append(form);
  modal.showModal();
}

const mounts = {
  machine: () => import('./machine.js?v=32'),
  domino: () => import('./domino.js?v=27'),
  '2048': () => import('./2048.js?v=27'), twentyfour: () => import('./twentyfour.js?v=27'),
  lights: () => import('./lights.js?v=27'), fifteen: () => import('./fifteen.js?v=27'),
  pipes: () => import('./pipes.js?v=27'), nonogram: () => import('./nonogram.js?v=27'),
  link: () => import('./link.js?v=27'), stars: () => import('./stars.js?v=27'), guess: () => import('./guess.js?v=27'),
};

async function route(scroll = true) {
  const version = ++routeVersion;
  appHost.cancel();setWaiting(false);
  const previousGame = currentGame;
  cleanup?.();
  cleanup = null;
  activeModule = null;
  const raw = location.hash.slice(1) || '/';
  const [path, query = ''] = raw.split('?');
  const id = path.split('/')[2];
  if (storage.native && previousGame && previousGame.id !== id) appHost.checkpoint(storage.snapshot());
  currentGame = games.find(game => game.id === id);
  if (!currentGame) {
    home();
    if(initialNavigation||previousGame)appHost.navigate({screen:'home',reason:initialNavigation?initialNavigationReason:'back'});
    initialNavigation=false;
    if (scroll) window.scrollTo(0, 0); return;
  }
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
    activeModule = module;
    headerView(currentGame);
    const name = t(module.title?.({ read }) || currentGame.name);
    panel.setAttribute('aria-label', name);
    document.title = `${name} · Brain Play`;
    const levelInfo=()=>module.pageInfo?.({read,load:()=>read(saveKey)})||{level:'round'};
    const page=(reason,info={})=>({screen:'game',game:gameCodes[id],daily,...(daily?{day:String(seed)}:{}),...levelInfo(),...info,reason});
    const stateKey=module.roundKey?.({read})||saveKey;
    const initialState=read(stateKey)??(id==='2048'?read(saveKey):null);
    const session=createRoundSession({saved:initialState?.__round,
      legacyFinished:!!(initialState?.done||initialState?.claimed||['failed','won'].includes(initialState?.phase)),
      now:gameRuntime.now,makeID:()=>globalThis.crypto?.randomUUID?.()||`r${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
      describe:()=>({game:gameCodes[id],...levelInfo(),daily,...(daily?{day:String(seed)}:{})}),
      send:result=>appHost.result(result)});
    const flushRound=()=>{const state=read(stateKey);if(state&&typeof state==='object')write(stateKey,session.stamp(state));};
    let transitioning=false;
    const transition=async(reason,info,action)=>{
      if(version!==routeVersion||transitioning)return;
      transitioning=true;setWaiting(true);
      try{
        const permitted=await appHost.begin(page(reason,info));
        if(permitted&&version===routeVersion){
          // Release the navigation pause before awaiting a new deal/animation.
          // App/ad/visibility pauses remain independently in force.
          session.reset();setWaiting(false);await action();lastLevelInfo=levelInfo();
        }
      }finally{transitioning=false;if(version===routeVersion)setWaiting(false);}
    };
    const nextInfo=levelInfo();
    let entryPermit=null;
    if(scroll||initialNavigation||JSON.stringify(lastLevelInfo)!==JSON.stringify(nextInfo)){
      setWaiting(true);appHost.ready();
      entryPermit=appHost.begin(page(initialNavigation?initialNavigationReason:scroll?'enter':'settings'));
    }
    if(version!==routeVersion)return;
    const dispose = module.mount(panel, {
      daily, seed, rng: daily ? seeded(seed + games.indexOf(currentGame)) : Math.random,
      load: () => read(saveKey), save: state => write(saveKey,session.stamp(state)), read,
      write:(key,value)=>write(key,key===stateKey?session.stamp(value):value),
      result:(outcome,metrics)=>{if(version===routeVersion&&session.finish(outcome,metrics))flushRound();},
      roundPause:value=>session.pause(value),
      transition,
    });
    cleanup=()=>{dispose?.();flushRound();};
    const summary=module.summary?.({read})||currentGame.summary;
    const ruleStrip=el('button',{type:'button',class:'rule-strip','aria-label':'玩法与目标',onclick:()=>showHelp(currentGame)},[
      el('span',{class:'rule-summary',text:summary}),el('span',{class:'rule-more',text:'玩法 ›','aria-hidden':'true'}),
    ]);
    panel.querySelector('.game-toolbar').after(ruleStrip);
    lastLevelInfo=levelInfo();
    initialNavigation=false;
    if(entryPermit){const permitted=await entryPermit;if(!permitted||version!==routeVersion)return;}
    setWaiting(false);
  } catch (error) {
    if(version!==routeVersion)return;
    setWaiting(false);
    console.error(error);
    panel.replaceChildren(el('p', { class: 'status error', text: '游戏加载遇到了问题，请刷新页面后重试。' }));
  }
  if (scroll) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => route());
void route().then(() => appHost.ready());
window.addEventListener('pageshow', () => appHost.ready());
