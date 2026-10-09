// Acciones de los botones (data-act), cambios de campos y eventos globales.
import { $, uid8, round2, num, ymd, ymOf, MESES, parseYM, addMonths, clean, privacy, setHidden } from './util.js';
import { S, dirty, typing, blankConfig, saveLocal, schedulePersist, touchCfg, touchMonth, rt, cloudAdapter, setMeta } from './state.js';
import { syncNow, signOutAndClear } from './cloud.js';
import { authForm } from './auth.js';
import { roMonth, getQ, qBounds, allocMonto, qBase, revertAlloc } from './logic.js';
import { ui, openForm, closeSheet, submitSheet, askConfirm, toast, sheet } from './ui.js';
import { render } from './render.js';
import { allocForm, txForm, cardForm, metaForm, metaAport, fijoForm } from './forms.js';
import { seedDemo } from './seed.js';

export function toggleAlloc(id,ymArg,qArg){
  const Y=ymArg||ui.ym,N=+qArg||ui.q;
  const q=getQ(Y,N),a=q.allocs.find(x=>x.id===id);if(!a)return;
  if(!a.done){
    a.done=true;const m=allocMonto(a,qBase(Y,N));a.aplicado=m;
    if(a.kind==='tarjeta'){const c=S.config.tarjetas.find(c=>c.id===a.ref);if(c){const red=Math.min(+c.saldo||0,m);c.saldo=round2((+c.saldo||0)-red);a.aplicado=red;touchCfg()}}
    else if(a.kind==='meta'){const g=S.config.metas.find(c=>c.id===a.ref);if(g){g.ahorrado=round2((+g.ahorrado||0)+m);touchCfg()}}
  }else{revertAlloc(a);a.done=false;delete a.aplicado}
  touchMonth(Y);render();
}
export function prevQ(){if(ui.q===2)ui.q=1;else{ui.q=2;ui.ym=addMonths(ui.ym,-1)}}
export function nextQ(){if(ui.q===1)ui.q=2;else{ui.q=1;ui.ym=addMonths(ui.ym,1)}}
async function resetAll(){
  S.config=blankConfig();S.months={};dirty.cfg=false;dirty.months.clear();saveLocal();
  if(cloudAdapter.active){try{await cloudAdapter.wipe()}catch(e){toast('No se pudo borrar en la nube')}}
}
export const ACT={
  go(el){ui.route=el.dataset.r;if(ui.route==='resumen'){const d=new Date();ui.ym=ymOf(d);ui.q=d.getDate()<=15?1:2}render();window.scrollTo(0,0)},
  'go-gastos'(){ui.gym=ui.ym;ui.route='gastos';render();window.scrollTo(0,0)},
  seed:seedDemo,
  blank(){ui.wstep='ingreso';render()},
  'w-back'(){ui.wstep='ask';render()},
  start(){
    const v=num(($('#wIngreso')||{}).value);
    if(!(v>0)){toast('Escribe cuánto cobras por quincena');return}
    S.config=blankConfig();S.config.onboarded=true;S.config.ingresoQ=v;
    ui.route='resumen';touchCfg();render();
  },
  'clear-demo'(){askConfirm('Se quitará la información de ejemplo y empezarás con tus propios datos.','Empezar desde cero',()=>{resetAll().then(()=>{ui.wstep='ask';ui.route='resumen';render()})})},
  login(){authForm('login')},
  signup(){authForm('signup')},
  'sync-now'(){toast('Sincronizando…');syncNow().then(()=>render())},
  logout(){
    const pend=dirty.cfg||dirty.months.size>0;
    askConfirm(pend?'Tienes cambios que todavía no se sincronizan y se perderían. ¿Cerrar sesión de todos modos?':'Se cerrará tu sesión y se quitarán los datos de este dispositivo. Siguen guardados en tu cuenta.','Cerrar sesión',()=>{signOutAndClear().then(()=>{ui.wstep='ask';ui.route='resumen';render()})});
  },
  'remind-later'(){setMeta({snoozeUntil:Date.now()+3*864e5});render()},
  'hide-demo'(){S.config.demo=false;touchCfg();render()},
  install(){const e=rt.installEvt;if(!e)return;e.prompt();Promise.resolve(e.userChoice).finally(()=>{rt.installEvt=null;render()})},
  'q-prev'(){prevQ();render()},'q-next'(){nextQ();render()},
  'g-prev'(){ui.gym=addMonths(ui.gym,-1);render()},'g-next'(){ui.gym=addMonths(ui.gym,1);render()},
  'r-prev'(){ui.rym=addMonths(ui.rym,-1);render()},'r-next'(){ui.rym=addMonths(ui.rym,1);render()},
  'toggle-alloc'(el,e){e.stopPropagation();toggleAlloc(el.dataset.id,el.dataset.ym,el.dataset.q)},
  'toggle-hide'(){setHidden(!privacy.hidden);render()},
  'edit-alloc'(el){allocForm(el.dataset.id)},
  'add-alloc'(){allocForm(null)},
  'copy-prev'(){
    const pn=ui.q===2?1:2,pym=ui.q===2?ui.ym:addMonths(ui.ym,-1),pm=roMonth(pym)['q'+pn];
    if(!pm||!pm.allocs.length){toast('La quincena anterior no tiene sobres');return}
    askConfirm('Se reemplazarán los sobres de esta quincena por los de la anterior.','Copiar sobres',()=>{
      const q=getQ(ui.ym,ui.q);q.allocs.forEach(revertAlloc);
      q.allocs=pm.allocs.map(a=>{const c=Object.assign({},a,{id:uid8(),done:false});delete c.aplicado;return c});
      touchMonth(ui.ym);render()});
  },
  'save-template'(){
    askConfirm('Las próximas quincenas nuevas empezarán con estos sobres.','Guardar plantilla',()=>{
      const q=getQ(ui.ym,ui.q);
      S.config.plantilla=q.allocs.map(a=>({id:uid8(),nombre:a.nombre,kind:a.kind,ref:a.ref||'',cat:a.cat||'',monto:a.monto||0,pct:a.pct||0}));
      touchCfg();toast('Plantilla guardada')});
  },
  'add-tx'(){txForm(null,null,ui.route==='gastos'?{f:(ui.gym===ymOf(new Date())?ymd(new Date()):ui.gym+'-01')}:null)},
  'edit-tx'(el){txForm(el.dataset.id,el.dataset.ym)},
  'add-card'(){cardForm(null)},'edit-card'(el){cardForm(el.dataset.id)},
  'card-charge'(el){txForm(null,null,{medio:el.dataset.id})},
  'add-meta'(){metaForm(null)},'edit-meta'(el){metaForm(el.dataset.id)},'meta-add'(el){metaAport(el.dataset.id)},
  'add-fijo'(){fijoForm(null)},'edit-fijo'(el){fijoForm(el.dataset.id)},
  'f-prev'(){ui.fym=addMonths(ui.fym,-1);render()},'f-next'(){ui.fym=addMonths(ui.fym,1);render()},
  'add-extra'(){const b=qBounds(ui.ym,ui.q),t=ymd(new Date());txForm(null,null,{tipo:'ingreso',f:(t>=b[0]&&t<=b[1])?t:b[0]})},
  'fijo-mes'(el,e){
    e.stopPropagation();const f=S.config.fijos.find(x=>x.id===el.dataset.id);if(!f)return;
    openForm({title:f.nombre+' en '+MESES[parseYM(ui.fym).m-1],note:'Escribe lo que realmente pagaste este mes. Déjalo vacío para volver al monto estimado.',values:{monto:(f.vals&&f.vals[ui.fym]!=null)?f.vals[ui.fym]:''},fields:[{k:'monto',label:'Monto real',type:'number',raw:true}],
      onSubmit:o=>{f.vals=f.vals||{};if(String(o.monto==null?'':o.monto).trim()==='')delete f.vals[ui.fym];else f.vals[ui.fym]=num(o.monto);touchCfg();render()}});
  },
  close(){closeSheet()},
  'sheet-submit'(){if(sheet.cur&&!sheet.cur.busy)submitSheet()},
  'sheet-cancel'(){const c=sheet.cur&&sheet.cur.cfg;if(c&&c.onCancel)c.onCancel();closeSheet()},
  'sheet-link'(el){const c=sheet.cur&&sheet.cur.cfg,l=c&&c.links&&c.links[+el.dataset.i];if(l)l.fn()},
  'sheet-delete'(){if(sheet.cur&&sheet.cur.cfg.onDelete)sheet.cur.cfg.onDelete()},
  async export(){
    const data=JSON.stringify({version:1,config:S.config,months:S.months},null,2),fn='mis-finanzas-'+ymd(new Date())+'.json';
    let dl=null;try{if(window.claude&&window.claude.use)dl=await claude.use('downloads')}catch(e){}
    if(dl){try{await dl.save({filename:fn,data:data});setMeta({lastBackup:Date.now()});render()}catch(e){if(!e||e.code!=='declined')toast('No se pudo descargar el respaldo')}return}
    try{const u=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);setMeta({lastBackup:Date.now()});render()}catch(e){toast('No se pudo descargar el respaldo')}
  },
  import(){$('#importfile').click()},
  wipe(){askConfirm('Se borrarán tus tarjetas, quincenas, movimientos y metas'+(cloudAdapter.active?', también de tu cuenta y de tus otros dispositivos':'')+'. Descarga un respaldo antes si quieres conservarlos.','Borrar todo',async()=>{await resetAll();ui.wstep='ask';ui.route='resumen';render()})}
};
export const CHG={
  'q-ingreso'(el){const q=getQ(ui.ym,ui.q);q.ingreso=num(el.value);touchMonth(ui.ym);render()},
  ingresoQ(el){S.config.ingresoQ=num(el.value);touchCfg();toast('Ingreso guardado')},
  tema(el){try{localStorage.setItem('tema-fin',el.value)}catch(e){}applyTheme()}
};
export function applyTheme(){let t='auto';try{t=localStorage.getItem('tema-fin')||'auto'}catch(e){}document.documentElement.setAttribute('data-theme',t)}

export function bindEvents(){
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-act]');if(!el)return;
    const f=ACT[el.dataset.act];if(f){f(el,e)}
  });
  document.addEventListener('change',e=>{
    const el=e.target.closest('[data-chg]');if(!el)return;
    const f=CHG[el.dataset.chg];if(f)f(el);
  });
  document.addEventListener('focusout',()=>{setTimeout(()=>{if(rt.pendingRender&&!sheet.cur&&!typing())render()},80)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.cur&&!sheet.cur.cfg.modal)closeSheet()});
  $('#importfile').addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const o=JSON.parse(r.result);if(!o||!o.config)throw new Error('formato');
        askConfirm('Se reemplazarán los datos actuales por los del respaldo.','Restaurar',()=>{
          S.config=Object.assign(blankConfig(),o.config);S.months=o.months||{};
          dirty.cfg=true;Object.keys(S.months).forEach(k=>dirty.months.add(k));schedulePersist();render();toast('Respaldo restaurado')});
      }catch(err){toast('Ese archivo no parece un respaldo válido')}
    };
    r.readAsText(file);
  });
}
