export type UiState='loading'|'empty'|'error'|'ready';
export type StatusTone='neutral'|'success'|'warning'|'danger';

export const uiTokens={
  spacing:{xs:'0.25rem',sm:'0.5rem',md:'1rem',lg:'1.5rem',xl:'2rem'},
  radius:{sm:'0.5rem',md:'0.75rem',lg:'1rem'},
  typography:{body:'system-ui, sans-serif',mono:'ui-monospace, monospace'},
} as const;

function escapeHtml(value:unknown):string{return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!));}

export function Card(input:{title?:string;body:string;footer?:string}):string{return `<section class="ui-card">${input.title?`<h2>${escapeHtml(input.title)}</h2>`:''}<div class="ui-card__body">${input.body}</div>${input.footer?`<footer>${input.footer}</footer>`:''}</section>`;}
export function Status(input:{label:string;tone?:StatusTone}):string{return `<span class="ui-status ui-status--${input.tone??'neutral'}" role="status">${escapeHtml(input.label)}</span>`;}
export function Field(input:{id:string;label:string;type?:string;value?:string;required?:boolean;hint?:string}):string{return `<div class="ui-field"><label for="${escapeHtml(input.id)}">${escapeHtml(input.label)}</label><input id="${escapeHtml(input.id)}" name="${escapeHtml(input.id)}" type="${escapeHtml(input.type??'text')}" value="${escapeHtml(input.value??'')}" ${input.required?'required aria-required="true"':''}/>${input.hint?`<small id="${escapeHtml(input.id)}-hint">${escapeHtml(input.hint)}</small>`:''}</div>`;}
export function Table(input:{caption:string;headers:string[];rows:Array<Array<string|number>>}):string{return `<div class="ui-table-wrap" tabindex="0"><table><caption>${escapeHtml(input.caption)}</caption><thead><tr>${input.headers.map(h=>`<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${input.rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function Dialog(input:{id:string;title:string;body:string;confirmLabel?:string}):string{return `<dialog id="${escapeHtml(input.id)}" aria-labelledby="${escapeHtml(input.id)}-title"><form method="dialog"><h2 id="${escapeHtml(input.id)}-title">${escapeHtml(input.title)}</h2><div>${input.body}</div><menu><button value="cancel">Cancelar</button><button value="confirm">${escapeHtml(input.confirmLabel??'Confirmar')}</button></menu></form></dialog>`;}
export function Filters(input:{label:string;content:string}):string{return `<form class="ui-filters" aria-label="${escapeHtml(input.label)}">${input.content}<button type="submit">Aplicar filtros</button></form>`;}
export function Notification(input:{message:string;tone?:StatusTone}):string{return `<div class="ui-notification ui-notification--${input.tone??'neutral'}" role="status" aria-live="polite">${escapeHtml(input.message)}</div>`;}
export function StateView(state:UiState,detail?:string):string{if(state==='loading')return '<div class="ui-state" role="status" aria-live="polite">Carregando…</div>';if(state==='empty')return `<div class="ui-state">${escapeHtml(detail??'Nenhum dado encontrado.')}</div>`;if(state==='error')return `<div class="ui-state ui-state--error" role="alert">${escapeHtml(detail??'Não foi possível carregar os dados.')}</div>`;return '';}
