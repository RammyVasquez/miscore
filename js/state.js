// Estado de la app, guardado local y sincronización con la nube (si existe).
import { stable, clean } from './util.js';
import { render } from './render.js';

export const rt={syncMode:'local',pendingRender:false,installEvt:null};
// main.js conecta estas funciones para evitar importaciones circulares
export const hooks={render:()=>{},isSheetOpen:()=>false};
const LS='mis-finanzas-v1';
export const S={config:null,months:{}};
export const dirty={cfg:false,months:new Set()};
export const DB={db:null,base:null,first:false};
export const typing=()=>{const a=document.activeElement;return !!(a&&a.matches&&a.matches('#view input,#view select,#view textarea'))};
export const blankConfig=()=>({onboarded:false,demo:false,ingresoQ:0,tarjetas:[],fijos:[],metas:[],plantilla:[],cats:['Mandado','Salidas','Gasolina','Salud','Hogar','Servicios','Compras','Otros']});
export function loadLocal(){try{const r=localStorage.getItem(LS);if(r){const o=JSON.parse(r);S.config=Object.assign(blankConfig(),o.config);S.months=o.months||{};return}}catch(e){}S.config=blankConfig();S.months={}}
export function saveLocal(){try{localStorage.setItem(LS,JSON.stringify({config:S.config,months:S.months}))}catch(e){}}
let pt=null;
export function schedulePersist(){saveLocal();clearTimeout(pt);pt=setTimeout(persist,500)}
export const touchCfg=()=>{dirty.cfg=true;schedulePersist()};
export const touchMonth=ym=>{dirty.months.add(ym);schedulePersist()};
export async function persist(){
  if(!DB.db||!DB.base)return;
  try{
    if(dirty.cfg){dirty.cfg=false;try{await DB.db.doc(DB.base+'/config').set(clean(S.config))}catch(e){dirty.cfg=true;throw e}}
    for(const ym of Array.from(dirty.months)){dirty.months.delete(ym);try{await DB.db.doc(DB.base+'/m-'+ym).set(clean(S.months[ym]||{tx:[]}))}catch(e){dirty.months.add(ym);throw e}}
    setStatus('cloud');
  }catch(e){setStatus('error')}
}
export function setStatus(m){rt.syncMode=m;const el=document.querySelector('.sync');if(el){el.className='sync '+m;el.querySelector('span').textContent=statusText()}}
export const statusText=()=>rt.syncMode==='cloud'?'Sincronizado en tu cuenta':rt.syncMode==='error'?'No se pudo sincronizar; guardado en este dispositivo':'Guardado en este dispositivo';
export async function initCloud(){
  try{
    if(!window.claude||!window.claude.use){return}
    const r=await Promise.all([claude.use('db'),claude.use('user')]);
    const db=r[0],user=r[1];
    if(!db||!user)return;
    const id=await user.id();
    if(!id)return;
    DB.db=db;DB.base='data/users/'+id;
    db.collection(DB.base).onSnapshot(onSnap,()=>setStatus('local'));
  }catch(e){setStatus('local')}
}
export function onSnap(snap){
  const cfgDoc=snap.docs.find(d=>d.id==='config');
  if(!DB.first){
    if(snap.metadata.fromCache)return;
    DB.first=true;
    if(!cfgDoc){
      if(S.config.onboarded){dirty.cfg=true;Object.keys(S.months).forEach(k=>dirty.months.add(k));schedulePersist()}
      setStatus('cloud');hooks.render();return;
    }
  }
  if(snap.metadata.hasPendingWrites){setStatus('cloud');return}
  let changed=false;
  snap.docs.forEach(d=>{
    const id=d.id,data=d.data();
    if(id==='config'){
      if(!dirty.cfg){const nc=Object.assign(blankConfig(),data);if(stable(nc)!==stable(S.config)){S.config=nc;changed=true}}
    }else if(id.indexOf('m-')===0){
      const ym=id.slice(2);
      if(!dirty.months.has(ym)&&stable(data)!==stable(S.months[ym]||null)){S.months[ym]=data;changed=true}
    }
  });
  setStatus('cloud');
  if(changed){saveLocal();if(hooks.isSheetOpen()||typing())rt.pendingRender=true;else hooks.render()}
}
