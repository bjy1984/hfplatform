import type { Role, State, Question, MarkRecord } from './types'
export const duties = {
 development:'题库开发管理', lead:'命题负责人', author:'命题专家', initial:'初审人员', second:'复审人员', final:'终审人员', intake:'入库操作',
 bank:'题库管理', assemble:'组卷专家', affairs:'考试管理', reviewAdmin:'阅卷管理', review:'阅卷专家', arbitrate:'仲裁人员', skill:'现场技能评分',
 resources:'电子书管理', learn:'电子书阅读', exam:'考生', integration:'接口管理', access:'授权与审计'
} as const
export type Duty = keyof typeof duties
export interface DemoPerson { id:string; name:string; org:string; role:Role; duties:Duty[]; kinds:string[]; enabled:boolean; reviewer?:string }
export function createPeople():DemoPerson[]{
 const rows:[string,string,Role,Duty[],string?][]=[
 ['organizer','李志远','admin',['development','access']],['lead','周负责人','expert',['lead','intake']],
 ['author','张明','expert',['author']],['skillAuthor','王立','expert',['author']],
 ['initial','李静','expert',['initial']],['second','刘伟','expert',['second']],['final','周岚','expert',['final']],
 ['bank','许库管','admin',['bank']],['assembler','孙强','expert',['assemble']],['affairs','赵考务','admin',['affairs']],
 ['reviewAdmin','吴阅卷','admin',['reviewAdmin']],['reviewer1','陈工','marker',['review'],'评委一'],['reviewer2','赵敏','marker',['review'],'评委二'],['reviewer3','何工','marker',['review'],'评委三'],
 ['arbitrator','郑仲裁','marker',['arbitrate']],['assessor','钱考评','marker',['skill']],['librarian','林资料','admin',['resources']],
 ['learner','学习用户01','candidate',['learn']],['candidate','演示考生01','candidate',['exam']],['candidate2','演示考生02','candidate',['exam']],['integrator','接口维护员','admin',['integration']]
 ]
 return rows.map(([id,name,role,d,reviewer])=>({id,name,role,duties:[...d,...(d.includes('learn')?[]:['learn' as Duty])],reviewer,org:id==='candidate2'?'模拟第二单位':'模拟第一单位',kinds:id==='author'?['理论']:id==='skillAuthor'?['技能']:['理论','技能'],enabled:true}))
}
export const reviewDuties:Record<string,Duty>={'待初审':'initial','待复审':'second','待终审':'final','待入库':'intake'}
export function has(p:DemoPerson,d:Duty){return p.enabled&&p.duties.includes(d)}
export function pathDuties(path:string):Duty[]{
 const p=path.split('?')[0]!
 const map:Record<string,Duty[]>={
 '/archives':['affairs'],'/projects':['development','lead'],'/papers/rules':['assemble'],
 '/authoring/plans':['development','lead'],'/authoring/experts':['development'],'/authoring/tasks':['author','lead'],'/authoring/editor':['author','bank'],
 '/authoring/reviews':['initial','second','final','intake'],'/authoring/history':['author','lead','initial','second','final','intake'],
 '/bank/questions':['bank','assemble','author'],'/bank/structure':['bank'],'/papers':['assemble'],
 '/affairs/sessions':['affairs'],'/affairs/monitor':['affairs'],'/results/list':['affairs'],'/results/analytics':['affairs','reviewAdmin'],
 '/support/resources':['learn','resources'],'/support/integrations':['integration'],'/support/permissions':['access'],'/support/settings':['reviewAdmin'],
 '/marking/tasks':['review'],'/marking/arbitration':['arbitrate'],'/marking/skill':['skill'],'/marking/progress':['reviewAdmin'],'/marking/history':['review','arbitrate'],
 '/protocol/development':['development','lead'],'/protocol/papers':['affairs'],'/protocol/examination':['affairs'],'/protocol/marking':['reviewAdmin'],'/protocol/skills':['affairs'],'/protocol/integration':['integration']
 }
 if(p.startsWith('/candidate/'))return ['exam']
 return map[p]||[]
}
export function canPath(p:DemoPerson,path:string){return path==='/workbench'||path.startsWith('/journeys')||pathDuties(path).some(d=>has(p,d))}
export function migrateIdentity(s:State){
 if(!s.people){s.people=createPeople();for(const p of s.people){const e=s.experts.find(e=>e.name===p.name);if(e?.status==='已停用')p.enabled=false}}
 for(const plan of s.plans){plan.leadId??='lead';plan.reviewers??={'待初审':'initial','待复审':'second','待终审':'final','待入库':'lead'}}
 for(const q of s.questions){q.assignments??={...(s.plans.find(p=>p.id===q.taskId)?.reviewers||{'待初审':'initial','待复审':'second','待终审':'final','待入库':'lead'})}}
 for(const m of s.marks){m.arbitratorId??='arbitrator';m.reviewers??=['评委一','评委二']}
 for(const k of s.skills){k.assessorId??='assessor';k.assessor=s.people.find(p=>p.id===k.assessorId)?.name||k.assessor}
}
export function canReview(p:DemoPerson,q:Question){return !!reviewDuties[q.status]&&has(p,reviewDuties[q.status]!)&&p.kinds.includes(q.kind)&&q.assignments?.[q.status]===p.id}
export function canMark(p:DemoPerson,m:MarkRecord){return has(p,'review')&&!!p.reviewer&&!!m.reviewers?.includes(p.reviewer)}
