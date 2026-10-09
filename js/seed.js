// Plantilla inicial basada en la hoja de cálculo original.
import { uid8 } from './util.js';
import { S, blankConfig, touchCfg } from './state.js';
import { toast } from './ui.js';
import { render } from './render.js';

export function seedTemplate(){
  const c=blankConfig();c.onboarded=true;c.ingresoQ=8827;
  const bbva={id:uid8(),nombre:'BBVA',saldo:2962,corte:5,limite:20,color:'#1D4ED8'};
  const rappi={id:uid8(),nombre:'Rappi',saldo:50,corte:31,limite:20,color:'#E0463A'};
  c.tarjetas=[bbva,rappi];
  const parto={id:uid8(),nombre:'Parto',objetivo:0,ahorrado:0,fecha:'',desglose:[{n:'Hospital',m:18500},{n:'Honorarios',m:37000},{n:'Consultas',m:16000}]};
  const aho={id:uid8(),nombre:'Ahorro general',objetivo:0,ahorrado:0,fecha:'',desglose:[]};
  c.metas=[parto,aho];
  const fx=(nombre,monto,tipo,medio,cat,v)=>({id:uid8(),nombre:nombre,monto:monto,tipo:tipo,medio:medio,cat:cat,variable:!!v,cada:1,vals:{}});
  c.fijos=[
    fx('Gasolina',700,'fijo',bbva.id,'Gasolina',true),fx('Luz',1750,'fijo',bbva.id,'Servicios',true),fx('Agua',200,'fijo',bbva.id,'Servicios',true),
    fx('Celular',600,'fijo',bbva.id,'Servicios'),fx('TV',385,'fijo',bbva.id,'Servicios'),fx('iTunes',34,'fijo',bbva.id,'Servicios'),
    fx('Telmex',458,'fijo',bbva.id,'Servicios'),fx('Licencia',230,'fijo',bbva.id,'Servicios'),fx('Perfume',267,'fijo',bbva.id,'Compras'),
    fx('Amazon',46,'fijo',bbva.id,'Compras'),fx('Amazon (2)',78,'fijo',bbva.id,'Compras'),fx('Cuch',631,'fijo',bbva.id,'Compras'),
    fx('Pediatra',900,'fijo','efectivo','Salud'),fx('Dermatólogo',1300,'fijo','efectivo','Salud'),fx('Cadera',800,'fijo','efectivo','Salud'),
    fx('Seguro',94,'sub','efectivo','Servicios'),fx('iCloud',34,'sub','efectivo','Servicios'),fx('Prime',110,'sub','efectivo','Servicios'),
    fx('Disney',40,'sub','efectivo','Servicios'),fx('Spotify',60,'sub','efectivo','Servicios')
  ];
  const al=(nombre,kind,monto,extra)=>Object.assign({id:uid8(),nombre:nombre,kind:kind,monto:monto,pct:0,ref:'',cat:''},extra||{});
  c.plantilla=[
    al('Diezmo','diezmo',0,{pct:10}),al('Pagar BBVA','tarjeta',1200,{ref:bbva.id}),al('Renta','pago',2000),
    al('Ahorro','meta',800,{ref:aho.id}),al('Bradescard','pago',85),al('Rappi','tarjeta',1000,{ref:rappi.id}),
    al('Mandado','gasto',500,{cat:'Mandado'}),al('Salidas','gasto',500,{cat:'Salidas'})
  ];
  S.config=c;S.months={};touchCfg();render();toast('Plantilla cargada. Ajusta lo que necesites.');
}
