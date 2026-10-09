// Pantalla: mas.
import { ic } from '../util.js';

export function vMas(){
  return '<div class="menu-list">'+[['metas','Metas de ahorro'],['fijos','Gastos fijos y suscripciones'],['reportes','Reportes'],['ajustes','Ajustes y respaldo']].map(x=>'<button data-act="go" data-r="'+x[0]+'">'+ic(x[0])+'<span>'+x[1]+'</span></button>').join('')+'</div>';
}
