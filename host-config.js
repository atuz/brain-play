export const webClient=Object.freeze({build:'27',protocol:1,capabilities:['navigation','navigationGate','activity','save','close','result']});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const names=new Set(webClient.capabilities);
export function readHostConfiguration(href,host={}){
  const raw=host.__brainPlayHost;
  if(new URL(href).searchParams.get('app')==='0'||!object(raw)||raw.version!==1)return {app:null,capabilities:{},config:{}};
  const capabilities={};
  if(object(raw.capabilities))for(const [key,value]of Object.entries(raw.capabilities))if(names.has(key)&&typeof value==='boolean')capabilities[key]=value;
  if(capabilities.navigationGate===undefined&&raw.navigationGate===true)capabilities.navigationGate=true;
  const config={};
  if(object(raw.config)){
    if(typeof raw.config.language==='string'&&/^[a-zA-Z-]{2,35}$/.test(raw.config.language))config.language=raw.config.language;
    for(const key of ['sound','animations'])if(typeof raw.config[key]==='boolean')config[key]=raw.config[key];
    if(raw.config.theme==='light')config.theme='light';
  }
  const app=object(raw.app)&&['ios','android'].includes(raw.app.platform)
    &&['version','build'].every(k=>typeof raw.app[k]==='string'&&/^[a-zA-Z0-9._-]{1,40}$/.test(raw.app[k]))
    ?{platform:raw.app.platform,version:raw.app.version,build:raw.app.build}:null;
  return {app,capabilities,config};
}
