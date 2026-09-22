import type { State, Attempt, QuestionType } from './types'
import { scoreObjective } from './rules'
export interface Enrollment { id:string; sessionId:string; personId:string; staffId:string; name:string; ticket:string; seat:number }
export interface ArchiveAttachment { id:string; sessionId:string; personId:string; name:string; kind:string; mime:string; content:string; time:string; actor:string }
export interface PaperRule { id:string; name:string; profession:string; level:string; subjects:string[]; knowledge:string[]; difficulty:string; rows:{type:QuestionType;count:number;score:number}[]; banks:number[]; seed:number }
export interface Coordination { id:string; planId:string; type:string; subject:string; note:string; actor:string; time:string; status:string; reply:string; handledBy?:string }
export interface Continuity { sampleVersion?:number; enrollments:Enrollment[]; attachments:ArchiveAttachment[]; rules:PaperRule[]; coordination:Coordination[] }
export function migrateContinuity(s:State){
 if(!s.continuity){const enrollments:Enrollment[]=[];for(const exam of s.sessions)for(let i=1;i<=exam.candidates;i++)enrollments.push({id:`ENR-${exam.id}-${i}`,sessionId:exam.id,personId:i===1?'candidate':i===2?'candidate2':`guest-${i}`,staffId:`DEMO-${String(i).padStart(4,'0')}`,name:`演示考生${String(i).padStart(2,'0')}`,ticket:`${exam.id}-${String(i).padStart(4,'0')}`,seat:i});s.continuity={enrollments,attachments:[],coordination:[],rules:[{id:'RULE-001',name:'装配工理论标准比重',profession:'航空发动机装配工',level:'三级 / 高级工',subjects:['专业理论'],knowledge:[],difficulty:'不限',rows:[{type:'单选题',count:10,score:4},{type:'多选题',count:5,score:8},{type:'判断题',count:5,score:4}],banks:[50,30,20],seed:21}]}}
 if(!s.continuity.sampleVersion){const template=s.questions.find(q=>q.kind==='理论'&&q.status==='已入库');if(template){for(let i=0;i<9;i++){const id='DEMO-SUBJECTIVE-'+(i+1);if(!s.questions.some(q=>q.id===id))s.questions.push({...JSON.parse(JSON.stringify(template)),id,title:`【合成简答 ${i+1}】说明作业准备、过程检查与质量记录的要点。`,type:'简答题',options:[],answers:['核对任务与工具，依工艺执行并记录检查结果。'],bank:['母题库','子题库','通用题库'][i%3]!,analysis:'评分参考：作业准备、过程控制、质量记录。',taskId:undefined,history:[{time:'2026-09-22',actor:'系统初始化',action:'合成题目入库',note:'用于主客观题混合卷与逐题评分演示',version:1}]})}s.continuity.rules.push({id:'RULE-MIXED',name:'主客观混合卷',profession:template.profession,level:template.level,subjects:[template.subject],knowledge:[],difficulty:'不限',rows:[{type:'单选题',count:2,score:20},{type:'简答题',count:2,score:30}],banks:[100,0,0],seed:22})}s.continuity.sampleVersion=1}
 for(const a of s.attempts){const e=s.continuity.enrollments.find(e=>e.sessionId===a.sessionId&&e.name===a.candidate);a.personId??=e?.personId;a.ticket??=e?.ticket;a.seat??=e?.seat}
 for(const q of s.questions.filter(q=>q.kind==='技能'))q.module??=q.title.includes('测量')?'检测测量':q.title.includes('工具')?'工具操作':'装配操作'
 for(const k of s.skills){k.module??=s.questions.find(q=>q.id===k.questionId)?.module;k.personId??=s.people?.find(p=>p.name===k.candidate)?.id;k.sessionId??=s.sessions.find(e=>e.id==='EXAM-001')?.id}
}
export function resultBreakdown(a:Attempt,dimension:'type'|'knowledge'){
 const groups=new Map<string,{label:string;max:number;earned:number;pending:number}>()
 for(const item of a.questions){const q=item.question,label=q[dimension];const g=groups.get(label)||{label,max:0,earned:0,pending:0};g.max+=item.score
 const objective=['单选题','多选题','判断题'].includes(q.type)
 if(objective)g.earned+=scoreObjective(q,a.answers[q.id]||[],item.score)
 else if(a.scores[q.id]!==undefined)g.earned+=a.scores[q.id]!
 else g.pending++
 groups.set(label,g)}return [...groups.values()].map(g=>({...g,earned:Math.round(g.earned*100)/100,rate:Math.round(g.earned/g.max*100)}))
}

import type { Question, PaperQuestion } from './types'
import { seededShuffle, validatePaper } from './rules'
export function generateConfiguredPaper(questions:Question[],rule:PaperRule):PaperQuestion[]{
 if(!rule.name.trim()||!rule.profession||!rule.level||!rule.subjects.length)throw new Error('请填写名称、工种、等级并至少选择一个科目')
 if(!rule.rows.length||new Set(rule.rows.map(r=>r.type)).size!==rule.rows.length||rule.rows.some(r=>!Number.isInteger(r.count)||r.count<1||!Number.isFinite(r.score)||r.score<=0))throw new Error('题型不能重复，题量为正整数，分值大于0')
 const total=rule.rows.reduce((n,r)=>n+r.count,0);if(total>100||Math.abs(rule.rows.reduce((n,r)=>n+r.count*r.score,0)-100)>.001)throw new Error('总题量最多100道，分值合计须为100分')
 if(rule.banks.length!==3||rule.banks.some(v=>!Number.isFinite(v)||v<0)||Math.abs(rule.banks.reduce((a,b)=>a+b,0)-100)>.001)throw new Error('三类题库来源比重之和须为100%')
 const allocate=(n:number,weights:number[])=>{const sum=weights.reduce((a,b)=>a+b,0),raw=weights.map(w=>n*w/sum),counts=raw.map(Math.floor),rank=raw.map((v,i)=>({i,r:v-counts[i]!})).sort((a,b)=>b.r-a.r||a.i-b.i);for(let j=0,left=n-counts.reduce((a,b)=>a+b,0);j<left;j++)counts[rank[j%rank.length]!.i]!++;return counts}
 const remaining=allocate(total,rule.banks),result:PaperQuestion[]=[]
 const pool=[...new Map(questions.filter(q=>q.kind==='理论'&&q.status==='已入库'&&q.profession===rule.profession&&q.level===rule.level&&rule.subjects.includes(q.subject)&&(rule.difficulty==='不限'||q.difficulty===rule.difficulty)&&(!rule.knowledge.length||rule.knowledge.includes(q.knowledge))).map(q=>[q.id,q])).values()]
 for(const [ri,row] of rule.rows.entries()){const quotas=allocate(row.count,remaining);for(const [bi,bank] of ['母题库','子题库','通用题库'].entries()){const available=seededShuffle(pool.filter(q=>q.type===row.type&&q.bank===bank),rule.seed+ri*13+bi);if(available.length<quotas[bi]!)throw new Error(`${bank} / ${row.type}需${quotas[bi]}道，符合条件${available.length}道`);available.slice(0,quotas[bi]).forEach(q=>result.push({question:JSON.parse(JSON.stringify(q)),score:row.score}));remaining[bi]!-=quotas[bi]!}}
 const missing=rule.knowledge.filter(k=>!result.some(q=>q.question.knowledge===k));if(missing.length)throw new Error('抽题未覆盖知识点：'+missing.join('、')+'。请调整题量或种子')
 validatePaper(result);return result
}
