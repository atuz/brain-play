import { t } from './i18n.js?v=48';
import {gameRuntime} from './game-runtime.js?v=48';
import {createGameAudio} from './game-audio.js?v=48';
import { read, write, remove } from './storage.js?v=48';
export { read, write, remove };
export function seeded(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function dateSeed(date = new Date()) { return Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`); }
export function shuffle(items, rng = Math.random) { const out = [...items]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
export const copy = value => JSON.parse(JSON.stringify(value));
export const el = (tag, props = {}, children = []) => { const node = document.createElement(tag); for (const [key, value] of Object.entries(props)) { if (key === 'class') node.className = value; else if (key === 'text') node.textContent = t(value); else if (key.startsWith('on')) node.addEventListener(key.slice(2), value); else if (['disabled','checked','selected','multiple','required','readonly'].includes(key)) { if (value) node.setAttribute(key, ''); } else if (value !== undefined && value !== null) node.setAttribute(key, ['aria-label','title','placeholder'].includes(key) ? t(value) : String(value)); } for (const child of [children].flat()) { if (child !== null && child !== undefined) node.append(child); } return node; };
export const button = (text, onclick, style = 'secondary') => el('button', { type:'button', class:`btn ${style}`, text, onclick });
let toastTimer;
export function toast(message) { const node = document.querySelector('#toast'); node.textContent = t(message); node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2600); }
const playSound=createGameAudio(gameRuntime,()=>new (window.AudioContext||window.webkitAudioContext)());
export function sound(win = false) { if(read('sound',false))playSound(win); }
export function stat(label, value = 0) { const output = el('strong', {text:value}); return {node:el('div',{class:'stat'},[el('small',{text:label}),output]),set:v=>output.textContent=v}; }
export function statusNode() { const node=el('p',{class:'status','aria-live':'polite'}); return {node,set:(text,kind='')=>{node.textContent=t(text);node.className=`status ${kind}`;}}; }
export function controls(onMove) { const pad=el('div',{class:'direction-pad','aria-label':'方向控制'}); for(const [key,text] of [['up','↑'],['left','←'],['down','↓'],['right','→']]) pad.append(el('button',{type:'button','aria-label':{up:'向上',left:'向左',down:'向下',right:'向右'}[key],text,'data-direction':key,onclick:()=>onMove(key)})); return pad; }
export function keyboardAndSwipe(target, onMove, {swipe=true}={}) {
  const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  const handler=e=>{if(gameRuntime.paused||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;const direction=keys[e.key];if(direction){e.preventDefault();onMove(direction);}};
  let start,swiped=false;
  const down=e=>{if(!e.isPrimary||e.button>0)return;start=[e.clientX,e.clientY,e.pointerId];swiped=false;e.target.setPointerCapture?.(e.pointerId);};
  const up=e=>{if(!start||e.pointerId!==start[2])return;const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;swiped=true;onMove(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));};
  const cancel=()=>{start=null;swiped=false;};
  const unsubscribe=gameRuntime.subscribe(paused=>{if(paused)cancel();});
  const click=e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false;}};
  window.addEventListener('keydown',handler);if(swipe){target.addEventListener('pointerdown',down);target.addEventListener('pointerup',up);target.addEventListener('pointercancel',cancel);target.addEventListener('click',click,true);}
  return()=>{unsubscribe();window.removeEventListener('keydown',handler);target.removeEventListener('pointerdown',down);target.removeEventListener('pointerup',up);target.removeEventListener('pointercancel',cancel);target.removeEventListener('click',click,true);};
}
export function saveGame(id,state) { if(!write(`game:${id}`,state)) toast('本机存储不可用，本次仍可继续玩'); }
export function finish(id) { const completed=read('completed',{}); completed[id]=(completed[id]||0)+1;write('completed',completed);sound(true); }
