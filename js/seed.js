// Información de ejemplo para conocer la app (ingreso de $12,000 por quincena).
import { uid8, ymd, ymOf, addMonths, pad } from './util.js';
import { S, blankConfig, touchCfg, touchMonth } from './state.js';
import { getMonth, getQ } from './logic.js';
import { ui, toast } from './ui.js';
import { render } from './render.js';

export function seedDemo(){
  const now=new Date(),today=now.getDate(),ym=ymOf(now),prev=addMonths(ym,-1),nNow=today<=15?1:2;
  const c=blankConfig();c.onboarded=true;c.demo=true;c.ingresoQ=12000;
  const azul={id:uid8(),nombre:'Tarjeta azul',saldo:3200,corte:5,limite:25,color:'#1D4ED8'};
  const tienda={id:uid8(),nombre:'Tarjeta de tienda',saldo:850,corte:15,limite:5,color:'#E0463A'};
  c.tarjetas=[azul,tienda];
  c.msi=[
    {id:uid8(),nombre:'Laptop',tarjeta:azul.id,total:9600,meses:12,mensualidad:0,desde:addMonths(ym,-3)},
    {id:uid8(),nombre:'Audífonos',tarjeta:azul.id,total:1800,meses:6,mensualidad:0,desde:addMonths(ym,-1)}
  ];
  const fondo={id:uid8(),nombre:'Fondo de emergencia',objetivo:30000,ahorrado:8400,fecha:'',desglose:[]};
  const fin=new Date(now.getFullYear(),now.getMonth()+6,1);
  const viaje={id:uid8(),nombre:'Vacaciones',objetivo:0,ahorrado:3500,fecha:ymd(fin),desglose:[{n:'Hospedaje',m:6000},{n:'Transporte',m:5500},{n:'Comidas y paseos',m:3500}]};
  c.metas=[fondo,viaje];
  const fx=(nombre,monto,tipo,medio,cat,v,cada,q)=>({id:uid8(),nombre:nombre,monto:monto,tipo:tipo,medio:medio,cat:cat,variable:!!v,cada:cada||1,q:q||0,desde:cada>1?ym:'',vals:{}});
  c.fijos=[
    fx('Luz',900,'fijo',azul.id,'Servicios',true,1,2),fx('Agua',480,'fijo','efectivo','Servicios',true,2,2),
    fx('Internet',499,'fijo',azul.id,'Servicios',false,1,1),fx('Celular',399,'fijo',azul.id,'Servicios',false,1,2),
    fx('Gasolina',1200,'fijo',azul.id,'Gasolina',true),fx('Gimnasio',450,'fijo','efectivo','Salud',false,1,1),
    Object.assign(fx('Limpieza del hogar',350,'fijo','efectivo','Hogar'),{porQ:true}),
    fx('Netflix',219,'sub',azul.id,'Servicios'),fx('Spotify',129,'sub',azul.id,'Servicios'),fx('iCloud',49,'sub',azul.id,'Servicios')
  ];
  const al=(nombre,kind,monto,extra)=>Object.assign({id:uid8(),nombre:nombre,kind:kind,monto:monto,pct:0,ref:'',cat:''},extra||{});
  c.plantilla=[
    al('Diezmo','diezmo',0,{pct:10}),al('Renta','pago',3000),
    al('Pago tarjeta azul','tarjeta',1500,{ref:azul.id}),al('Pago tarjeta de tienda','tarjeta',500,{ref:tienda.id}),
    al('Fondo de emergencia','meta',1000,{ref:fondo.id}),al('Vacaciones','meta',500,{ref:viaje.id}),
    al('Despensa','gasto',1500,{cat:'Mandado'}),al('Salidas','gasto',800,{cat:'Salidas'})
  ];
  S.config=c;S.months={};

  // mes anterior: quincenas completas para que los reportes tengan historial
  [1,2].forEach(n=>{
    const q=getQ(prev,n);
    q.allocs.forEach(a=>{if(a.kind!=='gasto'){a.done=true;if(a.kind==='meta')a.aplicado=a.monto}});
  });
  const addTx=(mes,dia,tipo,cat,monto,medio,nota)=>getMonth(mes).tx.push({id:uid8(),tipo:tipo,monto:monto,cat:cat,nota:nota,f:mes+'-'+pad(dia),medio:medio});
  [[3,'Mandado',1320,'efectivo','Súper'],[8,'Salidas',640,'efectivo','Cena con amigos'],[12,'Gasolina',900,azul.id,'Gasolina'],[19,'Mandado',1180,'efectivo','Súper'],[20,'Servicios',870,azul.id,'Luz'],[24,'Salidas',520,'efectivo','Cine y palomitas']]
    .forEach(t=>addTx(prev,t[0],'gasto',t[1],t[2],t[3],t[4]));
  addTx(prev,10,'ingreso','Ingreso extra',1500,'efectivo','Venta de garage');

  // mes actual: solo movimientos que ya "pasaron"
  [[1,'Mandado',420,'efectivo','Súper'],[3,'Salidas',260,'efectivo','Tacos'],[5,'Gasolina',520,azul.id,'Gasolina'],[8,'Mandado',680,'efectivo','Mercado'],[12,'Servicios',900,azul.id,'Luz'],[14,'Salidas',380,'efectivo','Cine'],[18,'Mandado',1150,'efectivo','Súper'],[21,'Salidas',450,'efectivo','Cena'],[25,'Gasolina',560,azul.id,'Gasolina']]
    .filter(t=>t[0]<=today).forEach(t=>addTx(ym,t[0],'gasto',t[1],t[2],t[3],t[4]));

  const q=getQ(ym,nNow);
  q.allocs.forEach(a=>{if(a.nombre==='Diezmo'||a.nombre==='Renta')a.done=true});
  touchMonth(prev);touchMonth(ym);touchCfg();
  ui.route='resumen';ui.ym=ym;ui.q=nNow;
  render();toast('Listo: precargué información de ejemplo');
}
