// Formularios de alta y edición (sobres, movimientos, tarjetas, metas, fijos).
import { uid8, round2, num, ymd, ymOf, addMonths, MESES, parseYM } from './util.js';
import { S, touchCfg, touchMonth } from './state.js';
import { getMonth, roMonth, getQ, txEffect, revertAlloc, msiInfo } from './logic.js';
import { ui, drawSheet, openForm, closeSheet, askConfirm, toast, sheet, sheetNote } from './ui.js';
import { render } from './render.js';

export const cardOpts=()=>S.config.tarjetas.map(c=>[c.id,c.nombre]);
export const medioOpts=()=>[['efectivo','Efectivo o débito']].concat(cardOpts());
export const catOpts=()=>S.config.cats.map(c=>[c,c]);
export function allocForm(id){
  const q=getQ(ui.ym,ui.q),a=id?q.allocs.find(x=>x.id===id):null;
  openForm({
    title:a?'Editar sobre':'Nuevo sobre',
    values:a?{nombre:a.nombre,kind:a.kind,ref:a.ref||'',cat:a.cat||S.config.cats[0],monto:a.monto||'',pct:a.pct||''}:{nombre:'',kind:'gasto',ref:'',cat:S.config.cats[0]||'Otros',monto:'',pct:''},
    fields:[
      {k:'nombre',label:'Nombre',req:true},
      {k:'kind',label:'Tipo',type:'select',re:true,opts:[['gasto','Gasto con tope (mandado, salidas…)'],['tarjeta','Pago a tarjeta'],['meta','Ahorro o meta'],['diezmo','Diezmo'],['pago','Otro pago (renta, servicio…)']]},
      {k:'ref',label:'Tarjeta',type:'select',opts:()=>[['','Elegir…']].concat(cardOpts()),when:v=>v.kind==='tarjeta'},
      {k:'ref',label:'Meta',type:'select',opts:()=>[['','Elegir…']].concat(S.config.metas.map(m=>[m.id,m.nombre])),when:v=>v.kind==='meta'},
      {k:'cat',label:'Categoría que cuenta contra este tope',type:'select',opts:catOpts,when:v=>v.kind==='gasto'},
      {k:'monto',label:'Monto',type:'number'},
      {k:'pct',label:'O porcentaje del ingreso',type:'number',hint:'Si pones un porcentaje, se usa en lugar del monto.'}
    ],
    onSubmit:o=>{
      const d={nombre:o.nombre.trim(),kind:o.kind,ref:(o.kind==='tarjeta'||o.kind==='meta')?o.ref:'',cat:o.kind==='gasto'?o.cat:'',monto:o.monto,pct:o.pct>0?o.pct:0};
      if(a)Object.assign(a,d);else q.allocs.push(Object.assign({id:uid8(),done:false},d));
      touchMonth(ui.ym);render();
    },
    onDelete:a?()=>{revertAlloc(a);q.allocs=q.allocs.filter(x=>x.id!==a.id);touchMonth(ui.ym);closeSheet();render()}:null
  });
}
export function txForm(id,ymHint,preset){
  let old=null;
  if(id){old=(roMonth(ymHint).tx||[]).find(t=>t.id===id)}
  const today=ymd(new Date());
  openForm({
    title:old?'Editar movimiento':'Nuevo movimiento',
    values:old?{tipo:old.tipo||'gasto',monto:old.monto,cat:old.cat,nota:old.nota||'',f:old.f,medio:old.medio||'efectivo'}:Object.assign({tipo:'gasto',monto:'',cat:S.config.cats[0]||'Otros',nota:'',f:today,medio:'efectivo'},preset||{}),
    fields:[
      {k:'tipo',label:'Tipo',type:'select',re:true,opts:[['gasto','Gasto'],['ingreso','Ingreso extra']]},
      {k:'monto',label:'Monto',type:'number',req:true},
      {k:'cat',label:'Categoría',type:'select',opts:catOpts,when:v=>v.tipo==='gasto'},
      {k:'medio',label:'Se pagó con',type:'select',opts:medioOpts,when:v=>v.tipo==='gasto'},
      {k:'nota',label:'Nota (opcional)'},
      {k:'f',label:'Fecha',type:'date',req:true}
    ],
    onSubmit:o=>{
      if(!(o.monto>0)){sheet.cur.err='El monto debe ser mayor a cero';drawSheet();return false}
      if(old){const om=getMonth(ymHint);om.tx=om.tx.filter(t=>t.id!==old.id);txEffect(old,-1);touchMonth(ymHint)}
      const t={id:old?old.id:uid8(),tipo:o.tipo,monto:round2(o.monto),cat:o.tipo==='ingreso'?'Ingreso extra':o.cat,nota:o.nota.trim(),f:o.f,medio:o.tipo==='ingreso'?'efectivo':o.medio};
      const ym=t.f.slice(0,7);getMonth(ym).tx.push(t);txEffect(t,1);touchMonth(ym);render();toast(old?'Movimiento actualizado':'Movimiento guardado');
    },
    onDelete:old?()=>{const om=getMonth(ymHint);om.tx=om.tx.filter(t=>t.id!==old.id);txEffect(old,-1);touchMonth(ymHint);closeSheet();render()}:null
  });
}
export const COLORS=[['#1D4ED8','Azul'],['#E0463A','Rojo'],['#13795B','Verde'],['#7C3AED','Morado'],['#D97706','Naranja'],['#334155','Gris']];
export function cardForm(id){
  const c=id?S.config.tarjetas.find(x=>x.id===id):null;
  openForm({
    title:c?'Editar tarjeta':'Nueva tarjeta',
    values:c?{nombre:c.nombre,saldo:c.saldo,corte:c.corte,limite:c.limite,color:c.color||'#1D4ED8'}:{nombre:'',saldo:'',corte:'',limite:'',color:'#1D4ED8'},
    fields:[
      {k:'nombre',label:'Nombre',req:true},
      {k:'saldo',label:'Saldo pendiente por pagar',type:'number'},
      {k:'corte',label:'Día de corte (1 a 31)',type:'number',req:true},
      {k:'limite',label:'Día límite de pago (1 a 31)',type:'number',req:true},
      {k:'color',label:'Color',type:'select',opts:COLORS}
    ],
    onSubmit:o=>{
      if(o.corte<1||o.corte>31||o.limite<1||o.limite>31){sheet.cur.err='Los días deben estar entre 1 y 31';drawSheet();return false}
      const d={nombre:o.nombre.trim(),saldo:round2(o.saldo),corte:Math.round(o.corte),limite:Math.round(o.limite),color:o.color};
      if(c)Object.assign(c,d);else S.config.tarjetas.push(Object.assign({id:uid8()},d));
      touchCfg();render();
    },
    onDelete:c?()=>askConfirm('Se quitará la tarjeta '+c.nombre+'. Tus movimientos no se borran.','Eliminar tarjeta',()=>{S.config.tarjetas=S.config.tarjetas.filter(x=>x.id!==c.id);touchCfg();render()}):null
  });
}
export function metaForm(id){
  const m=id?S.config.metas.find(x=>x.id===id):null;
  openForm({
    title:m?'Editar meta':'Nueva meta',
    values:m?{nombre:m.nombre,objetivo:m.objetivo||'',ahorrado:m.ahorrado||'',fecha:m.fecha||'',desglose:(m.desglose||[]).map(d=>d.n+': '+d.m).join('\n')}:{nombre:'',objetivo:'',ahorrado:'',fecha:'',desglose:''},
    fields:[
      {k:'nombre',label:'Nombre',req:true},
      {k:'objetivo',label:'Monto objetivo',type:'number',hint:'Déjalo en 0 si es un fondo sin tope.'},
      {k:'ahorrado',label:'Ahorrado hasta ahora',type:'number'},
      {k:'fecha',label:'Fecha límite (opcional)',type:'date'},
      {k:'desglose',label:'Desglose (opcional)',type:'textarea',hint:'Una línea por concepto, así: Hospital: 18500. Si lo llenas, el objetivo es la suma.'}
    ],
    onSubmit:o=>{
      const des=o.desglose.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const i=l.lastIndexOf(':');return i>0?{n:l.slice(0,i).trim(),m:num(l.slice(i+1))}:{n:l,m:0}});
      const d={nombre:o.nombre.trim(),objetivo:o.objetivo,ahorrado:round2(o.ahorrado),fecha:o.fecha||'',desglose:des};
      if(m)Object.assign(m,d);else S.config.metas.push(Object.assign({id:uid8()},d));
      touchCfg();render();
    },
    onDelete:m?()=>askConfirm('Se quitará la meta '+m.nombre+'.','Eliminar meta',()=>{S.config.metas=S.config.metas.filter(x=>x.id!==m.id);touchCfg();render()}):null
  });
}
export function metaAport(id){
  const m=S.config.metas.find(x=>x.id===id);if(!m)return;
  openForm({title:'Aportar a '+m.nombre,values:{monto:''},fields:[{k:'monto',label:'Monto',type:'number',req:true}],submit:'Aportar',onSubmit:o=>{if(!(o.monto>0)){sheet.cur.err='El monto debe ser mayor a cero';drawSheet();return false}m.ahorrado=round2((+m.ahorrado||0)+o.monto);touchCfg();render();toast('Aportación registrada')}});
}
export function fijoForm(id){
  const f=id?S.config.fijos.find(x=>x.id===id):null;
  const mesTxt=MESES[parseYM(ui.fym).m-1],vv=k=>(f&&f.vals&&f.vals[k]!=null)?f.vals[k]:'';
  openForm({
    title:f?'Editar gasto':'Nuevo gasto recurrente',
    values:f?{nombre:f.nombre,monto:f.monto,tipo:f.tipo||'fijo',medio:f.medio||'efectivo',cat:f.cat||S.config.cats[0],variable:f.variable?'1':'0',cada:f.porQ?'q':String(f.cada||1),q:String(f.q||0),desde:f.desde||ui.fym,montoMes:vv(ui.fym),montoQ1:vv(ui.fym+'-1'),montoQ2:vv(ui.fym+'-2')}
      :{nombre:'',monto:'',tipo:'fijo',medio:'efectivo',cat:S.config.cats[0]||'Otros',variable:'0',cada:'1',q:'0',desde:ui.fym,montoMes:'',montoQ1:'',montoQ2:''},
    fields:[
      {k:'nombre',label:'Nombre',req:true},
      {k:'monto',label:'Monto habitual o estimado',type:'number',req:true,hint:'Si se paga cada quincena, escribe lo que pagas cada vez.'},
      {k:'cada',label:'¿Cada cuánto se paga?',type:'select',re:true,opts:[['q','Cada quincena (2 veces al mes)'],['1','Cada mes'],['2','Cada 2 meses (bimestral)'],['3','Cada 3 meses'],['6','Cada 6 meses'],['12','Una vez al año']]},
      {k:'q',label:'¿En qué quincena se paga?',type:'select',opts:[['0','No importa'],['1','1ª quincena (días 1 al 15)'],['2','2ª quincena (días 16 al fin de mes)']],hint:'Así aparece en la quincena que le toca.',when:v=>v.cada!=='q'},
      {k:'desde',label:'Mes de un pago',type:'month',hint:'Sirve para saber en qué meses toca pagarlo.',when:v=>v.cada!=='1'&&v.cada!=='q'},
      {k:'variable',label:'¿El monto cambia?',type:'select',re:true,opts:[['0','No, es siempre igual'],['1','Sí, cambia cada vez (luz, gasolina…)']]},
      {k:'montoMes',label:'Monto real de '+mesTxt+' (opcional)',type:'number',raw:true,hint:'Déjalo vacío para usar el estimado.',when:v=>v.variable==='1'&&v.cada!=='q'},
      {k:'montoQ1',label:'Monto real de la 1ª quincena de '+mesTxt+' (opcional)',type:'number',raw:true,when:v=>v.variable==='1'&&v.cada==='q'},
      {k:'montoQ2',label:'Monto real de la 2ª quincena de '+mesTxt+' (opcional)',type:'number',raw:true,hint:'Déjalos vacíos para usar el estimado.',when:v=>v.variable==='1'&&v.cada==='q'},
      {k:'tipo',label:'Tipo',type:'select',opts:[['fijo','Gasto fijo'],['sub','Suscripción o gasto hormiga']]},
      {k:'medio',label:'Se paga con',type:'select',opts:medioOpts},
      {k:'cat',label:'Categoría',type:'select',opts:catOpts}
    ],
    onSubmit:o=>{
      const por=o.cada==='q',vals=Object.assign({},f&&f.vals);
      const setv=(key,raw)=>{if(o.variable==='1'&&String(raw==null?'':raw).trim()!=='')vals[key]=num(raw);else delete vals[key]};
      if(por){setv(ui.fym+'-1',o.montoQ1);setv(ui.fym+'-2',o.montoQ2);delete vals[ui.fym]}else setv(ui.fym,o.montoMes);
      const d={nombre:o.nombre.trim(),monto:o.monto,tipo:o.tipo,medio:o.medio,cat:o.cat,variable:o.variable==='1',porQ:por,cada:por?1:(+o.cada||1),q:por?0:(+o.q||0),desde:(!por&&+o.cada>1)?(o.desde||ui.fym):'',vals:vals};
      if(f)Object.assign(f,d);else S.config.fijos.push(Object.assign({id:uid8()},d));
      touchCfg();render();
    },
    onDelete:f?()=>{S.config.fijos=S.config.fijos.filter(x=>x.id!==f.id);touchCfg();closeSheet();render()}:null
  });
}

// Compra que se está pagando a meses (meses sin intereses, por ejemplo)
export function msiForm(id, cardId) {
  const m = id ? (S.config.msi || []).find(x => x.id === id) : null;
  const hoy = ymOf(new Date()), info = m ? msiInfo(m, hoy) : null;
  openForm({
    title: m ? 'Editar compra a meses' : 'Compra a meses',
    note: 'Para lo que estás pagando en mensualidades, como los meses sin intereses.',
    values: m
      ? { nombre: m.nombre, tarjeta: m.tarjeta, total: m.total, meses: m.meses, mensualidad: m.mensualidad || '', actual: Math.min(Math.max(info.cur, 1), info.n) }
      : { nombre: '', tarjeta: cardId || (S.config.tarjetas[0] && S.config.tarjetas[0].id) || '', total: '', meses: '', mensualidad: '', actual: 1 },
    fields: [
      { k: 'nombre', label: '¿Qué compraste?', req: true },
      { k: 'tarjeta', label: 'Tarjeta', type: 'select', opts: cardOpts },
      { k: 'total', label: 'Monto total de la compra', type: 'number', req: true },
      { k: 'meses', label: '¿A cuántos meses?', type: 'number', req: true, hint: 'Por ejemplo 3, 6, 12 o 18.' },
      { k: 'actual', label: '¿En qué mensualidad vas este mes?', type: 'number', hint: 'Si apenas empieza, pon 1. Si ya pagaste 4 mensualidades, pon 5.' },
      { k: 'mensualidad', label: 'Mensualidad (opcional)', type: 'number', raw: true, hint: 'Déjalo vacío para usar el total entre los meses. Escríbelo solo si tu mensualidad es distinta, por ejemplo con intereses.' }
    ],
    onSubmit: o => {
      const n = Math.round(o.meses);
      if (!(o.total > 0) || n < 1 || n > 60) { sheetNote('err', 'Revisa el monto y los meses (de 1 a 60).'); return false; }
      const act = Math.min(Math.max(Math.round(o.actual) || 1, 1), n);
      const mens = String(o.mensualidad == null ? '' : o.mensualidad).trim() === '' ? 0 : round2(num(o.mensualidad));
      const d = { nombre: o.nombre.trim(), tarjeta: o.tarjeta, total: round2(o.total), meses: n, mensualidad: mens, desde: addMonths(hoy, -(act - 1)) };
      S.config.msi = S.config.msi || [];
      if (m) Object.assign(m, d); else S.config.msi.push(Object.assign({ id: uid8() }, d));
      touchCfg(); render(); toast(m ? 'Compra actualizada' : 'Compra a meses guardada');
    },
    onDelete: m ? () => { S.config.msi = S.config.msi.filter(x => x.id !== m.id); touchCfg(); closeSheet(); render(); } : null
  });
}
