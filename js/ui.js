// Navegación, hoja modal de formularios y avisos.
import { $, esc, num, ymOf, ic } from './util.js';
import { rt, hooks } from './state.js';

export const sheet={cur:null};
const now0=new Date();
let _proy={};try{_proy=JSON.parse(localStorage.getItem('mf-proy')||'{}')}catch(e){}
let _wz=null;try{_wz=localStorage.getItem('mf-wiz')}catch(e){}
export const ui={proy:Object.assign({base:'',custom:'',nombre:'',precio:'',ahorrado:'',aporte:'',fecha:'',tasa:'',rentaAct:'',rentaNueva:'',cambioIng:'',otroGasto:''},_proy),route:'resumen',wstep:_wz?'wizard':'ask',fym:ymOf(now0),ym:ymOf(now0),q:now0.getDate()<=15?1:2,gym:ymOf(now0),rym:ymOf(now0)};
export function saveProy(){try{localStorage.setItem('mf-proy',JSON.stringify(ui.proy))}catch(e){}}
export const NAV=[['resumen','Resumen'],['quincena','Quincena'],['gastos','Gastos'],['tarjetas','Tarjetas'],['vales','Vales'],['metas','Metas'],['fijos','Fijos'],['reportes','Reportes'],['proyecciones','Proyecciones'],['ajustes','Ajustes']];
export const TABS=[['resumen','Resumen'],['quincena','Quincena'],['gastos','Gastos'],['tarjetas','Tarjetas'],['mas','Más']];
export const FAB_ROUTES=['resumen','quincena','gastos'];
export const TITLES={resumen:'Resumen',quincena:'Quincena',gastos:'Gastos',tarjetas:'Tarjetas',vales:'Vales',metas:'Metas',fijos:'Fijos y suscripciones',reportes:'Reportes',proyecciones:'Proyecciones',ajustes:'Ajustes',mas:'Más'};
export function fieldHTML(f,v){
  const id='f_'+f.k,re=f.re?' data-re="1"':'',nm=' name="'+f.k+'"';let ctl;
  if(f.type==='select'){const o=typeof f.opts==='function'?f.opts():f.opts;ctl='<select id="'+id+'"'+nm+' data-f="'+f.k+'"'+re+'>'+o.map(x=>'<option value="'+esc(x[0])+'"'+(String(v)===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>'}
  else if(f.type==='textarea')ctl='<textarea id="'+id+'"'+nm+' rows="4" data-f="'+f.k+'">'+esc(v)+'</textarea>';
  else if(f.type==='password')ctl='<div class="pw"><input id="'+id+'"'+nm+' data-f="'+f.k+'" type="password"'+(f.ac?' autocomplete="'+f.ac+'"':'')+' autocapitalize="off" autocorrect="off" spellcheck="false" value="'+esc(v)+'"><button type="button" class="pw-eye" data-act="toggle-pw" data-for="'+id+'" aria-label="Mostrar contraseña">'+ic('eye')+'</button></div>';
  else ctl='<input id="'+id+'"'+nm+' data-f="'+f.k+'" type="'+(f.type||'text')+'"'+(f.type==='number'?' inputmode="decimal" step="any"':'')+(f.ac?' autocomplete="'+f.ac+'"':'')+(f.type==='email'?' autocapitalize="off" autocorrect="off" spellcheck="false"':'')+' value="'+esc(v)+'">';
  return '<div class="fld"><label for="'+id+'">'+esc(f.label)+'</label>'+ctl+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</div>';
}
export function drawSheet(){
  const st=sheet.cur,c=st.cfg,vals=st.vals,root=$('#sheet-root');
  const tag=c.form?'form':'div';
  const note=(st.msg?'<p class="okmsg">'+esc(st.msg)+'</p>':'')+(st.err?'<p class="err">'+esc(st.err)+'</p>':'');
  root.innerHTML='<div class="scrim"'+(c.modal?'':' data-act="close"')+'></div><'+tag+' class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(c.title)+'"'+(c.form?' novalidate':'')+'><h2>'+esc(c.title)+'</h2>'
    +(c.note?'<p class="hint">'+esc(c.note)+'</p>':'')
    +c.fields.filter(f=>!f.when||f.when(vals)).map(f=>fieldHTML(f,vals[f.k])).join('')
    +(c.links?'<div class="sheet-links">'+c.links.map((l,i)=>'<button type="button" class="link" data-act="sheet-link" data-i="'+i+'">'+esc(l.text)+'</button>').join('')+'</div>':'')
    +'<div class="sheet-note" aria-live="polite">'+note+'</div>'
    +'<div class="sheet-actions">'+(c.onDelete?'<button type="button" class="btn danger" data-act="sheet-delete">'+esc(c.deleteText||'Eliminar')+'</button>':'')
    +'<span class="grow"></span><button type="button" class="btn ghost" data-act="sheet-cancel">'+esc(c.cancelText||'Cancelar')+'</button>'
    +'<button class="btn" data-submit="1" '+(c.form?'type="submit"':'type="button" data-act="sheet-submit"')+(st.busy?' disabled':'')+'>'+(st.busy?'Un momento…':esc(c.submit||'Guardar'))+'</button></div></'+tag+'>';
  root.querySelectorAll('[data-f]').forEach(inp=>{
    inp.addEventListener('input',()=>{vals[inp.dataset.f]=inp.value});
    inp.addEventListener('change',()=>{vals[inp.dataset.f]=inp.value;if(inp.dataset.re)drawSheet()});
  });
}
export function openForm(cfg){sheet.cur={cfg:cfg,vals:Object.assign({},cfg.values),err:''};drawSheet()}
export function closeSheet(){sheet.cur=null;$('#sheet-root').innerHTML='';if(rt.pendingRender)hooks.render()}
// Cambian el botón y los avisos sin volver a dibujar el formulario (así el navegador no cree que ya se envió)
export function sheetBusy(b){
  if(!sheet.cur)return;sheet.cur.busy=!!b;
  const btn=document.querySelector('#sheet-root [data-submit]');
  if(btn){btn.disabled=!!b;btn.textContent=b?'Un momento…':(sheet.cur.cfg.submit||'Guardar')}
}
export function sheetNote(kind,text){
  if(!sheet.cur)return;
  sheet.cur.err=kind==='err'?text:'';sheet.cur.msg=kind==='msg'?text:'';
  const box=document.querySelector('#sheet-root .sheet-note');
  if(box)box.innerHTML=text?'<p class="'+(kind==='err'?'err':'okmsg')+'">'+esc(text)+'</p>':'';
}
function syncVals(){document.querySelectorAll('#sheet-root [data-f]').forEach(i=>{sheet.cur.vals[i.dataset.f]=i.value})}
export function submitSheet(){
  syncVals();
  const c=sheet.cur.cfg,v=sheet.cur.vals;
  for(const f of c.fields){if(f.when&&!f.when(v))continue;if(f.req&&String(v[f.k]==null?'':v[f.k]).trim()===''){sheetNote('err','Falta completar: '+f.label.toLowerCase());return}}
  const out={};c.fields.forEach(f=>{if(f.when&&!f.when(v))return;out[f.k]=(f.type==='number'&&!f.raw)?num(v[f.k]):v[f.k]});
  if(c.onSubmit(out)!==false)closeSheet();
}
export function askConfirm(msg,yes,fn){openForm({title:'¿Seguro?',note:msg,fields:[],submit:yes,onSubmit:()=>{fn()}})}
let toastT=null;
export function toast(m){const r=$('#toast-root');r.innerHTML='<div class="toast" role="status">'+esc(m)+'</div>';clearTimeout(toastT);toastT=setTimeout(()=>{r.innerHTML=''},2600)}
