import {gameCodes} from './storage.js?v=48';
const token=v=>typeof v==='string'&&/^[a-zA-Z0-9:_-]{1,80}$/.test(v);
const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
export function validResult(value){
  if(!value||typeof value!=='object'||Array.isArray(value)
    ||Object.keys(value).some(k=>!['id','game','level','variant','daily','day','outcome','activeMs','score','moves','attempts','assisted'].includes(k)))return false;
  return typeof value.id==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(value.id)
    &&Object.values(gameCodes).includes(value.game)&&token(value.level)
    &&['won','lost','finished'].includes(value.outcome)&&integer(value.activeMs,315360000000)
    &&(value.variant===undefined||token(value.variant))
    &&(value.daily===undefined||typeof value.daily==='boolean')
    &&(value.day===undefined||typeof value.day==='string'&&/^\d{8}$/.test(value.day))
    &&['score','moves','attempts'].every(k=>value[k]===undefined||integer(value[k],1e12))
    &&(value.assisted===undefined||typeof value.assisted==='boolean');
}
export function createRoundSession({saved,legacyFinished=false,now,makeID,describe,send}){
  let metadata,start,manual=false;
  const valid=s=>s?.version===1&&typeof s.id==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(s.id)
    &&integer(s.activeMs,315360000000)&&typeof s.reported==='boolean';
  function reset(){metadata={version:1,id:makeID(),activeMs:0,reported:false};start=now();manual=false;}
  if(valid(saved)){metadata={...saved};start=now();}else{reset();metadata.reported=legacyFinished;}
  const elapsed=()=>Math.min(315360000000,Math.max(0,Math.round(metadata.activeMs+(!metadata.reported&&!manual?now()-start:0))));
  return {
    reset,
    pause(value){if(value===manual)return;metadata.activeMs=elapsed();start=now();manual=value;},
    stamp(state){return {...state,__round:{version:1,id:metadata.id,activeMs:elapsed(),reported:metadata.reported}};},
    finish(outcome,metrics={}){
      if(metadata.reported)return false;
      const result={id:metadata.id,...describe(),outcome,activeMs:elapsed(),...metrics};
      if(!validResult(result))return false;
      metadata.activeMs=result.activeMs;metadata.reported=true;send(result);return true;
    },
  };
}
