// Navegación, hoja modal de formularios y avisos.
import { $, esc, num, ymOf } from './util.js';
import { rt, hooks } from './state.js';

export const sheet={cur:null};
const now0=new Date();
export const ui={route:'resumen',fym:ymOf(now0),ym:ymOf(now0),q:now0.getDate()<=15?1:2,gym:ymOf(now0),rym:ymOf(now0)};
export const NAV=[['resumen','Resumen'],['quincena','Quincena'],['gastos','Gastos'],['tarjetas','Tarjetas'],['metas','Metas'],['fijos','Fijos'],['reportes','Reportes'],['ajustes','Ajustes']];
export const TABS=[['resumen','Resumen'],['quincena','Quincena'],['gastos','Gastos'],['tarjetas','Tarjetas'],['mas','Más']];
export const FAB_ROUTES=['resumen','quincena','gastos'];
export const TITLES={resumen:'Resumen',quincena:'Quincena',gastos:'Gastos',tarjetas:'Tarjetas',metas:'Metas',fijos:'Fijos y suscripciones',reportes:'Reportes',ajustes:'Ajustes',mas:'Más'};
export function fieldHTML(f,v){
  const id='f_'+f.k,re=f.re?' data-re="1"':'';let ctl;
  if(f.type==='select'){const o=typeof f.opts==='function'?f.opts():f.opts;ctl='<select id="'+id+'" data-f="'+f.k+'"'+re+'>'+o.map(x=>'<option value="'+esc(x[0])+'"'+(String(v)===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>'}
  else if(f.type==='textarea')ctl='<textarea id="'+id+'" rows="4" data-f="'+f.k+'">'+esc(v)+'</textarea>';
  else ctl='<input id="'+id+'" data-f="'+f.k+'" type="'+(f.type||'text')+'"'+(f.type==='number'?' inputmode="decimal" step="any"':'')+' value="'+esc(v)+'">';
  return '<div class="fld"><label for="'+id+'">'+esc(f.label)+'</label>'+ctl+(f.hint?'<small>'+esc(f.hint)+'</small>':'')+'</div>';
}
export function drawSheet(){
  const c=sheet.cur.cfg,vals=sheet.cur.vals,root=$('#sheet-root');
  root.innerHTML='<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(c.title)+'"><h2>'+esc(c.title)+'</h2>'+(c.note?'<p class="hint">'+esc(c.note)+'</p>':'')+c.fields.filter(f=>!f.when||f.when(vals)).map(f=>fieldHTML(f,vals[f.k])).join('')+(sheet.cur.err?'<p class="err">'+esc(sheet.cur.err)+'</p>':'')+'<div class="sheet-actions">'+(c.onDelete?'<button class="btn danger" data-act="sheet-delete">Eliminar</button>':'')+'<span class="grow"></span><button class="btn ghost" data-act="close">Cancelar</button><button class="btn" data-act="sheet-submit">'+esc(c.submit||'Guardar')+'</button></div></div>';
  root.querySelectorAll('[data-f]').forEach(inp=>{
    inp.addEventListener('input',()=>{vals[inp.dataset.f]=inp.value});
    inp.addEventListener('change',()=>{vals[inp.dataset.f]=inp.value;if(inp.dataset.re)drawSheet()});
  });
}
export function openForm(cfg){sheet.cur={cfg:cfg,vals:Object.assign({},cfg.values),err:''};drawSheet()}
export function closeSheet(){sheet.cur=null;$('#sheet-root').innerHTML='';if(rt.pendingRender)hooks.render()}
export function submitSheet(){
  const c=sheet.cur.cfg,v=sheet.cur.vals;
  for(const f of c.fields){if(f.when&&!f.when(v))continue;if(f.req&&String(v[f.k]==null?'':v[f.k]).trim()===''){sheet.cur.err='Falta completar: '+f.label.toLowerCase();drawSheet();return}}
  const out={};c.fields.forEach(f=>{if(f.when&&!f.when(v))return;out[f.k]=(f.type==='number'&&!f.raw)?num(v[f.k]):v[f.k]});
  if(c.onSubmit(out)!==false)closeSheet();
}
export function askConfirm(msg,yes,fn){openForm({title:'¿Seguro?',note:msg,fields:[],submit:yes,onSubmit:()=>{fn()}})}
let toastT=null;
export function toast(m){const r=$('#toast-root');r.innerHTML='<div class="toast" role="status">'+esc(m)+'</div>';clearTimeout(toastT);toastT=setTimeout(()=>{r.innerHTML=''},2600)}
