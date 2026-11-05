import type { Coverage, Database, Filters, Snapshot, UseCase, User } from '../models';
export const stageOrder=(stage:string)=>Number(stage.match(/^U([1-4])/)?.[1]??({'Discovery':1,'Technical validation':2,'Pilot':3,'Production':4}[stage]??0));
export function coverageOf(c:UseCase,db:Database):Coverage {
 const transferred=db.handovers.some(h=>h.caseId===c.id&&h.status==='Complete'&&h.to===c.coverageOverride);
 return !transferred&&db.tigerAccounts?.some(t=>t.accountId===c.accountId)?'Tiger Team-led':c.coverageOverride??db.accountCoverage[c.accountId]??'Unassigned';
}
export const tigerContact=(c:UseCase,db:Database)=>{const t=db.tigerAccounts.find(t=>t.accountId===c.accountId);return t?`${t.ae} / ${t.sa}`:c.tigerContact;};
export const isOverdue=(s:string)=>s.slice(0,10)<'2026-11-05';
const compare=(a:UseCase,b:UseCase)=>(b.estimatedMonthly??-1)-(a.estimatedMonthly??-1)||stageOrder(b.stage)-stageOrder(a.stage)||a.account.localeCompare(b.account)||a.id.localeCompare(b.id);
export function rankedCases(db:Database,list='Top 20'):UseCase[]{
 const eligible=db.cases.filter(c=>!c.archived&&c.bu1==='Emerging'&&stageOrder(c.stage)>0&&(list!=='UKI Top 10'||c.bu2==='EE UKI')&&c.rankedOverrides[list]?.action!=='Exclude');
 const rank=(items:UseCase[],limit:number,ties:boolean)=>{const sorted=items.filter(c=>c.estimatedMonthly!=null).sort(compare);let picked=sorted.slice(0,limit);const cut=picked.at(-1)?.estimatedMonthly;if(ties&&picked.length===limit)picked=sorted.filter(c=>c.estimatedMonthly!>=cut!);return [...new Map([...picked,...items.filter(c=>c.rankedOverrides[list]?.action==='Pin')].map(c=>[c.id,c])).values()].sort(compare);};
 return list==='BU+2 Top 10'?[...new Set(eligible.map(c=>c.bu2))].sort().flatMap(group=>rank(eligible.filter(c=>c.bu2===group),10,false)):rank(eligible,list==='Top 20'?20:10,list==='Top 20');
}
export function currentLists(db:Database,c:UseCase):string[]{return ['Top 20','BU+2 Top 10','UKI Top 10'].filter(list=>rankedCases(db,list).some(x=>x.id===c.id));}
export function snapshotFor(db:Database,period:string):Snapshot {
 return {period,completedHandovers:db.handovers.filter(h=>h.status==='Complete').length,cases:db.cases.map(c=>({id:c.id,stage:c.stage,health:c.health,openBlockers:c.blockers.filter(b=>b.status==='Open').map(b=>b.id),coverage:coverageOf(c,db),sme:c.sme,lists:currentLists(db,c),archived:c.archived,tracked:true}))};
}
export function previousPeriod(period:string):string{const months=['January','February','March','April','May','June','July','August','September','October','November','December'];const [month,year]=period.split(' ');const index=months.indexOf(month);return index>=0?`${months[(index+11)%12]} ${Number(year)-(index===0?1:0)}`:'';}
export function changesSince(db:Database,c:UseCase,period:string):string[]{
 const previous=previousPeriod(period);const baseline=db.snapshots.find(s=>s.period===previous);if(!baseline)return ['Baseline being established'];
 const selected=db.snapshots.find(s=>s.period===period);const state=selected?.cases.find(x=>x.id===c.id)??(!selected?{id:c.id,stage:c.stage,health:c.health,openBlockers:c.blockers.filter(b=>b.status==='Open').map(b=>b.id),coverage:coverageOf(c,db),sme:c.sme,lists:currentLists(db,c),archived:c.archived}:undefined);
 if(!state)return ['Not tracked in the selected reporting snapshot'];
 const old=baseline.cases.find(x=>x.id===c.id);if(!old)return ['Newly tracked since the prior snapshot'];const changes:string[]=[];
 if(old.stage!==state.stage)changes.push(`Stage: ${old.stage} → ${state.stage}`);if(old.health!==state.health)changes.push(`Health: ${old.health} → ${state.health}`);if(old.coverage!==state.coverage)changes.push(`Coverage: ${old.coverage} → ${state.coverage}`);if(old.sme!==undefined&&old.sme!==state.sme)changes.push(`SME: ${old.sme||'Unassigned'} → ${state.sme||'Unassigned'}`);
 const added=state.openBlockers.filter(id=>!old.openBlockers.includes(id)).length;const resolved=old.openBlockers.filter(id=>!state.openBlockers.includes(id)).length;if(added)changes.push(`${added} blocker(s) opened`);if(resolved)changes.push(`${resolved} blocker(s) resolved`);if(old.archived!==undefined&&state.archived&&!old.archived)changes.push('Archived');if(old.archived!==undefined&&!state.archived&&old.archived)changes.push('Restored');const was=old.lists?.includes('Top 20'),is=state.lists?.includes('Top 20');if(Array.isArray(old.lists)&&Array.isArray(state.lists)&&was!==is)changes.push(is?'Entered Top 20':'Left Top 20');return changes.length?changes:['No recorded change since the prior snapshot'];
}
export function matchesFilters(db:Database,c:UseCase,f:Filters):boolean {
 const recent=!!c.lastUpdate&&Date.parse(c.lastUpdate)>=Date.parse('2026-11-05')-c.cadence*86400000;
 const pulse=f.pulse;
 return (!f.search||`${c.account} ${c.name} ${c.salesforceId}`.toLowerCase().includes(f.search.toLowerCase()))&&(!f.region||c.region===f.region)&&(!f.bu1||c.bu1===f.bu1)&&(!f.bu2||c.bu2===f.bu2)&&(!f.bu3||c.bu3===f.bu3)&&(!f.sme||c.sme===f.sme)&&(!f.ae||c.ae===f.ae)&&(!f.sa||c.sa===f.sa)&&(!f.stage||c.stage===f.stage)&&(!f.health||c.health===f.health)&&(!f.movement||c.movement===f.movement)&&(!f.theme||c.blockers.some(b=>b.status==='Open'&&b.theme===f.theme))&&(!f.trackingSet||c.trackingSets.includes(f.trackingSet))&&(!f.notDone||!c.checklist[f.notDone])&&(!f.coverage||(f.coverage==='SME & Joint'?['SME-led','Joint'].includes(coverageOf(c,db)):coverageOf(c,db)===f.coverage))&&(!pulse||pulse==='active'||(pulse==='advanced'&&c.movement==='Advanced')||(pulse==='stalled'&&c.movement==='Stalled')||(pulse==='asks'&&db.asks.some(a=>a.caseId===c.id&&['Open','Accepted'].includes(a.status)))||(pulse==='overdue'&&(isOverdue(c.milestoneDue)||isOverdue(c.nextUpdate)||db.followUps.some(t=>t.caseId===c.id&&t.status==='Open'&&isOverdue(t.due))))||(pulse==='updates'&&recent)||(pulse==='no-reply'&&!c.lastUpdate)||(pulse==='review'&&c.responses.some(r=>!r.reviewed))||(pulse==='needs'&&!c.sme&&coverageOf(c,db)!=='Tiger Team-led')||(pulse==='changed'&&changesSince(db,c,f.comparisonPeriod??'November 2026').some(t=>!['No recorded change since the prior snapshot','Baseline being established','Not tracked in the selected reporting snapshot'].includes(t))));
}
export function tabCases(db:Database,user:User,view:'EPL'|'SME',tab:string):UseCase[]{
 let cases=tab==='Archived'?db.cases.filter(c=>c.archived):db.cases.filter(c=>!c.archived);
 if(view==='SME')cases=cases.filter(c=>coverageOf(c,db)!=='Tiger Team-led');
 if(tab==='Top 20'||tab==='Top 10 by BU+2')cases=rankedCases(db,tab==='Top 20'?'Top 20':'BU+2 Top 10');
 if(tab==='Migration')cases=cases.filter(c=>c.tags.includes('Migration'));
 if(tab==='Owned')cases=cases.filter(c=>c.sme===user.name);if(tab==='Following')cases=cases.filter(c=>c.followers.includes(user.name));if(tab==='Needs an SME')cases=cases.filter(c=>!c.sme);if(view==='SME'){const score=(c:UseCase)=>(isOverdue(c.milestoneDue)?8:0)+(c.responses.some(r=>!r.reviewed)?4:0)+(c.interventions.some(i=>i.status!=='Complete')?2:0)+(db.asks.some(a=>a.caseId===c.id&&['Open','Accepted'].includes(a.status))?2:0)+(isOverdue(c.nextUpdate)?1:0);cases.sort((a,b)=>score(b)-score(a)||a.milestoneDue.localeCompare(b.milestoneDue));}return cases;
}
