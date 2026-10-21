import {el,button,stat,statusNode,shuffle,finish} from './shared.js?v=11';
import {createMotion} from './motion.js?v=11';
import {t} from './i18n.js?v=11';
export function compareGuess(secret,guess){let a=0,b=0;for(let i=0;i<4;i++)if(secret[i]===guess[i])a++;else if(secret.includes(guess[i]))b++;return {a,b};}
export function validGuess(guess){return /^\d{4}$/.test(guess)&&new Set(guess).size===4;}
export function mount(root,ctx){
  let state=ctx.load()||fresh(),draft=Array.isArray(state.draft)?state.draft.slice(0,4):Array(4).fill(''),cursor=0;
  if(draft.length!==4||draft.some(v=>v!==''&&!/^\d$/.test(v))||new Set(draft.filter(Boolean)).size!==draft.filter(Boolean).length)draft=Array(4).fill('');
  cursor=draft.findIndex(v=>v==='');
  const motion=createMotion(),attempts=stat('已猜次数'),wins=stat('本机解题',ctx.read('solved:guess',0)),status=statusNode();
  const list=el('div',{class:'guess-table','aria-label':'猜测记录'}),entry=el('div',{class:'guess-entry','aria-label':'输入四个不重复的数字'}),keypad=el('div',{class:'guess-keypad'});
  const slots=Array.from({length:4},(_,i)=>el('button',{type:'button',class:'guess-slot',onclick:()=>{if(!state.done){cursor=i;updateEntry();}}}));entry.append(...slots);
  const digits=new Map();for(const digit of '123456789'){const key=button(digit,()=>type(digit));digits.set(digit,key);keypad.append(key);}
  const erase=button('⌫',backspace,'plain');erase.setAttribute('aria-label',t('删除数字'));
  const zero=button('0',()=>type('0'));digits.set('0',zero);const submit=button('猜一下',guess);keypad.append(erase,zero,submit);
  const again=button('再来一局 →',restart);again.className='btn guess-next';
  root.append(el('div',{class:'game-toolbar'},[el('div',{class:'stats'},[attempts.node,wins.node]),button('新一局',()=>motion.confirmRestart(state.guesses.length>0&&!state.done,restart),'plain')]),entry,keypad,status.node,again,el('p',{class:'guess-legend',text:'A：数字和位置都对　B：数字对，位置不对'}),list);
  function fresh(){return {secret:shuffle('0123456789'.split(''),ctx.rng).slice(0,4).join(''),guesses:[],draft:Array(4).fill(''),done:false};}
  function restart(){state=fresh();draft=Array(4).fill('');cursor=0;render();}
  function save(){state.draft=[...draft];ctx.save(state);}
  function type(digit){
    if(state.done)return;
    if(cursor<0){motion.shake(entry);return;}
    if(draft.some((v,i)=>v===digit&&i!==cursor)){motion.shake(entry);return;}
    const changed=cursor;draft[cursor]=digit;cursor=draft.findIndex(v=>v==='');updateEntry();save();motion.pop(slots[changed]);
  }
  function backspace(){if(state.done)return;let i=cursor<0?draft.findLastIndex(Boolean):draft[cursor]?cursor:draft.slice(0,cursor).findLastIndex(Boolean);if(i<0)return;draft[i]='';cursor=i;updateEntry();save();}
  function guess(){
    if(state.done)return;const value=draft.join('');
    if(!validGuess(value)){status.set('请输入四个不重复的数字，可以以 0 开头。','error');motion.shake(entry);return;}
    if(state.guesses.includes(value)){status.set('这一组已经猜过了，试试别的组合。');motion.shake(entry);return;}
    state.guesses.push(value);
    if(value===state.secret){state.done=true;const count=ctx.read('solved:guess',0)+1;ctx.write('solved:guess',count);wins.set(count);finish('guess');}
    draft=Array(4).fill('');cursor=0;render();
    const row=list.firstElementChild;motion.play(row,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],220);
    for(const [i,node]of [...row.querySelectorAll('.guess-digits span,.guess-result')].entries())motion.play(node,[{opacity:0,transform:'rotateX(-75deg)'},{opacity:1,transform:'rotateX(0)'}],180,{delay:i*45});
  }
  function updateEntry(){
    slots.forEach((slot,i)=>{slot.textContent=state.done?state.secret[i]:draft[i]||'·';slot.classList.toggle('active',i===cursor&&!state.done);slot.disabled=state.done;slot.setAttribute('aria-label',`${t(`第 ${i+1} 位数字`)}: ${state.done?state.secret[i]:draft[i]||t('空格')}`);slot.setAttribute('aria-pressed',String(i===cursor));});
    for(const [digit,key]of digits)key.disabled=state.done||cursor<0||draft.some((v,i)=>v===digit&&i!==cursor);
    erase.disabled=state.done||!draft.some(Boolean);submit.disabled=state.done||!validGuess(draft.join(''));
  }
  function render(){
    attempts.set(state.guesses.length);updateEntry();keypad.hidden=state.done;again.hidden=!state.done;
    list.replaceChildren(...state.guesses.map((value,i)=>{const result=compareGuess(state.secret,value);return el('div',{class:'guess-row'},[el('span',{text:String(i+1).padStart(2,'0')}),el('div',{class:'guess-digits'},value.split('').map(v=>el('span',{text:v}))),el('span',{class:'guess-result'},[el('strong',{text:`${result.a}A`}),el('span',{text:`${result.b}B`})])]);}).reverse());
    status.set(state.done?`猜中了 ${state.secret}！你用了 ${state.guesses.length} 次。`:'',state.done?'success':'');save();
  }
  const key=e=>{
    if(document.querySelector('dialog[open]')||e.target.closest('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(/^\d$/.test(e.key)){e.preventDefault();type(e.key);}else if(e.key==='Backspace'){e.preventDefault();backspace();}else if(e.key==='Enter'&&(e.target===document.body||e.target.closest('.guess-keypad'))){e.preventDefault();guess();}
  };
  window.addEventListener('keydown',key);render();return()=>{window.removeEventListener('keydown',key);motion.dispose();};
}
