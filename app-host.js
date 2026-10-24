// WKWebView exposes this handler before the page loads. The URL flag is also
// supported so an App can identify itself without relying on a user-agent guess.
import {gameCodes} from './storage.js?v=46';
import {readHostConfiguration,webClient} from './host-config.js?v=46';
import {validResult} from './game-round.js?v=46';
const reasons=new Set(['enter','reload','back','restart','new-round','next','previous','select','settings']);
const token=value=>typeof value==='string'&&/^[a-zA-Z0-9:_-]{1,80}$/.test(value);
export function validNavigation(page){
  if(!page||typeof page!=='object'||Array.isArray(page)||!reasons.has(page.reason)
    ||Object.keys(page).some(k=>!['screen','reason','game','level','variant','daily','day'].includes(k)))return false;
  if(page.screen==='home')return Object.keys(page).every(k=>['screen','reason'].includes(k));
  return page.screen==='game'&&Object.values(gameCodes).includes(page.game)&&token(page.level)
    &&(page.variant===undefined||token(page.variant))&&(page.daily===undefined||typeof page.daily==='boolean')
    &&(page.day===undefined||typeof page.day==='string'&&/^\d{8}$/.test(page.day));
}
export function connectAppHost(href, host = {}) {
  const flag = new URL(href).searchParams.get('app');
  const handler = () => host.webkit?.messageHandlers?.brainPlay;
  const available = () => typeof handler()?.postMessage === 'function';
  const embedded = flag !== '0' && (flag === '1' || available());
  const configuration=embedded?readHostConfiguration(href,host):{app:null,capabilities:{},config:{}};
  const documentID=host.crypto?.randomUUID?.()||`${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  let navigationSequence=0,pending=null;
  const canNavigate=configuration.capabilities.navigation!==false;
  const gated=embedded&&canNavigate&&configuration.capabilities.navigationGate===true&&typeof host.addEventListener==='function';
  const cancel=()=>{const old=pending;pending=null;old?.resolve(false);};
  if(gated)host.addEventListener('brainPlayResume',event=>{
    if(event.detail?.id!==pending?.id)return;
    const old=pending;pending=null;old?.resolve(true);
  });
  function send(type, payload={}) {
    if (!embedded || !available()) return false;
    try {
      handler().postMessage({ type, source: 'brain-play', version: 1,
        ...payload });
      return true;
    } catch { return false; }
  }
  const savePayload=save=>save===undefined?{}:{save};
  const navigation=page=>({...page,id:`${documentID}:${++navigationSequence}`});
  return { embedded, configuration,ready: () => send('ready',{client:webClient}),
    result:result=>configuration.capabilities.result===true&&validResult(result)&&send('result',{result}),
    cancel,
    navigate: page=>{cancel();return canNavigate&&validNavigation(page)&&send('navigation',{navigation:navigation(page)});},
    begin: page=>{
      cancel();if(!validNavigation(page))return Promise.resolve(false);
      if(!canNavigate)return Promise.resolve(true);
      const info=navigation(page);
      if(!gated||!available()){send('navigation',{navigation:info});return Promise.resolve(true);}
      return new Promise(resolve=>{
        pending={id:info.id,resolve};
        if(!send('navigation',{navigation:info})){pending=null;resolve(true);}
      });
    },
    checkpoint: save => configuration.capabilities.save!==false&&send('save', savePayload(save)), close: save => configuration.capabilities.close!==false&&send('close', savePayload(save)) };
}
