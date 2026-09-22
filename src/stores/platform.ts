import { migrateContinuity } from '../domain/continuity'
import { migrateIdentity, has, canPath as allowedPath, canReview as assignedReview, canMark, reviewDuties, duties, type Duty } from '../domain/identity'
import { createProtocol } from '../domain/protocol'
import { createCatalog, catalogPath, matchesCatalog, catalogActive, catalogKinds, type CatalogNode } from '../domain/catalog'
import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { State, Role, Question, Paper, Plan, Session, MarkRecord } from '../domain/types'
import { createSeed } from '../mocks/seed'
import { nextReview, generatePaper, validatePaper, overlap, scoreObjective, aggregateScores, seededShuffle, canEnter, canSubmit } from '../domain/rules'
export const STORAGE_KEY = 'hfplatform-demo-v1'
export const roleNames = { admin: '管理人员', expert: '命审专家', candidate: '考生', marker: '阅卷评分' }
export const roleUsers = { admin: '李志远', expert: '张明', candidate: '演示考生01', marker: '陈工' }
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const time = () => new Date().toLocaleString('sv-SE').slice(0,19)
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`
export const usePlatform = defineStore('platform', () => {
  let initial: State
  try { const saved = localStorage.getItem(STORAGE_KEY); initial = saved ? JSON.parse(saved) : createSeed(); if(initial.schema!==1) initial=createSeed() } catch { initial=createSeed() }
  initial.protocol ||= createProtocol()
  initial.catalog ||= createCatalog(initial.questions,initial.nodes)
  migrateIdentity(initial);migrateContinuity(initial)
  const data = ref<State>(initial)
  const personId = ref(sessionStorage.getItem('hf-person') || 'organizer')
  const people = computed(()=>data.value.people!)
  const person = computed(()=>people.value.find(p=>p.id===personId.value)||people.value[0]!)
  const role = computed(()=>person.value.role)
  const dutyLabel = computed(()=>person.value.duties.filter(d=>d!=='learn').map(d=>duties[d]).join(' / ')||duties.learn)
  const can = (d:Duty)=>has(person.value,d)
  const requireDuty = (d:Duty)=>{if(!can(d))throw new Error('当前人员无此职责授权：'+duties[d])}
  const canPath = (path:string)=>allowedPath(person.value,path)
  const canReview = (q:Question)=>assignedReview(person.value,q)
  const canReadQuestion = (q:Question)=>person.value.enabled&&person.value.kinds.includes(q.kind)&&(can('bank')||can('assemble')&&q.status==='已入库'||can('author')&&q.author===actor.value||canReview(q)||can('lead')&&data.value.plans.some(p=>p.id===q.taskId&&p.leadId===person.value.id)||q.history.some(h=>h.actor===actor.value))
  const canEditQuestion = (q:Question)=>person.value.kinds.includes(q.kind)&&(can('bank')||can('author')&&q.author===actor.value)
  const visibleMarks = computed(()=>data.value.marks.filter(m=>can('reviewAdmin')||canMark(person.value,m)||can('arbitrate')&&m.arbitratorId===person.value.id))
  const visibleSkills = computed(()=>data.value.skills.filter(k=>can('skill')&&k.assessorId===person.value.id))
  function savePerson(id:string,grants:Duty[],enabled:boolean){requireDuty('development');const p=people.value.find(p=>p.id===id);if(!p)throw new Error('人员不存在');p.duties=[...grants];p.enabled=enabled;const e=data.value.experts.find(e=>e.name===p.name);if(e){e.status=enabled?'已授权':'已停用';e.role=grants.map(d=>duties[d]).join(' / ')}audit('专家管理','修改职责授权',p.name);notify('授权已生效')}
  function ownAttempt(id:string){const a=data.value.attempts.find(a=>a.id===id);if(!a||(a.personId?a.personId!==personId.value:a.candidate!==actor.value))throw new Error('只能操作本人答卷');return a}

  const toast = ref(''); const errorToast = ref(false); const failSave=ref(false); const online=ref(true); const persistenceError=ref('')
  const actor = computed(()=>person.value.name)
  let toastTimer: ReturnType<typeof setTimeout>
  function notify(message:string,error=false){toast.value=message;errorToast.value=error;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',4500)}
  function guard(allowed: Role[]){if(!person.value.enabled||!allowed.includes(role.value))throw new Error('当前角色无权执行此操作，请切换相应角色。')}
  function persist(){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data.value));persistenceError.value='';return true }catch{persistenceError.value='浏览器存储不可用，当前修改尚未持久保存。请导出备份。';notify(persistenceError.value,true);return false} }
  window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue){try{const incoming=JSON.parse(e.newValue);incoming.protocol ||= createProtocol();incoming.catalog ||= createCatalog(incoming.questions,incoming.nodes);migrateIdentity(incoming);migrateContinuity(incoming);data.value=incoming}catch{notify('读取演示数据失败',true)}}})
  function audit(module:string,action:string,object:string,note='成功'){data.value.logs.unshift({id:uid('LOG'),time:time(),actor:actor.value+'（'+dutyLabel.value+'）',module,action,object,result:note});if(data.value.logs.length>500)data.value.logs.pop();persist()}
  function switchPerson(id:string){if(!people.value.some(p=>p.id===id))throw new Error('人员不存在');personId.value=id;sessionStorage.setItem('hf-person',id)}
  function switchRole(next:Role){switchPerson(({admin:'organizer',expert:'author',candidate:'candidate',marker:'reviewer1'})[next])}
  function reset(){requireDuty('access');data.value=createSeed();data.value.protocol=createProtocol();data.value.catalog=createCatalog(data.value.questions,data.value.nodes);migrateIdentity(data.value);migrateContinuity(data.value);failSave.value=false;online.value=true;audit('演示环境','重置场景','scenario-v1');notify('已恢复初始演示场景')}
  function saveCatalogNode(parentId:string|null,name:string,id?:string){
    requireDuty('bank');const nodes=data.value.catalog!;name=name.trim();if(!name||name.length>50)throw new Error('节点名称需为1～50字')
    const current=nodes.find(n=>n.id===id);if(id&&!current)throw new Error('节点不存在')
    if(current)parentId=current.parentId
    const parent=nodes.find(n=>n.id===parentId);if(parentId&&!parent)throw new Error('父节点不存在')
    if(parent&&!catalogActive(nodes,parent.id))throw new Error('请先启用父级目录')
    const kind=current?.kind||catalogKinds[parent?catalogKinds.indexOf(parent.kind)+1:0];if(!kind)throw new Error('知识点已是末级目录')
    if(nodes.some(n=>n.id!==id&&n.parentId===parentId&&n.name===name))throw new Error('同一目录下已存在同名节点')
    if(current){const affected=data.value.questions.filter(q=>matchesCatalog(q,nodes,current.id));for(const q of affected){q[kind]=name;q.history.push({time:time(),actor:actor.value,action:'目录更名',note:current.name+' → '+name+'；试卷快照保留原名称',version:q.version})}current.name=name}
    else nodes.push({id:uid('CAT'),parentId,name,kind})
    audit('知识结构',current?'更名节点':'新增节点',name);notify('目录已保存，题库与命题选择同步更新')
  }
  function toggleCatalogNode(id:string){requireDuty('bank');const n=data.value.catalog!.find(n=>n.id===id)!;n.disabled=!n.disabled;audit('知识结构',n.disabled?'停用目录':'启用目录',n.name);notify(n.disabled?'目录已停用，历史题目仍可查询':'目录已启用')}
  function deleteCatalogNode(id:string){requireDuty('bank');const nodes=data.value.catalog!;const n=nodes.find(n=>n.id===id);if(!n)throw new Error('节点不存在');if(nodes.some(x=>x.parentId===id))throw new Error('请先处理子节点，不能直接删除分支');if(data.value.questions.some(q=>matchesCatalog(q,nodes,id))||data.value.papers.some(p=>p.questions.some(q=>matchesCatalog(q.question,nodes,id))))throw new Error('目录已被题目或历史试卷引用，请使用停用');data.value.catalog=nodes.filter(n=>n.id!==id);audit('知识结构','删除空节点',n.name);notify('空节点已删除')}
  function savePlan(input: Omit<Plan,'id'>,id?:string){requireDuty('development');if(!input.name.trim()||input.target<1||!input.expert||!input.deadline)throw new Error('请填写计划名称、题量、专家和截止日期');const existing=data.value.plans.find(p=>p.id===id);if(existing){Object.assign(existing,input);for(const q of data.value.questions.filter(q=>q.taskId===existing.id&&q.status.startsWith('待')))q.assignments={...existing.reviewers}}else data.value.plans.unshift({...input,id:uid('PLAN'),leadId:input.leadId||'lead',reviewers:input.reviewers||{'待初审':'initial','待复审':'second','待终审':'final','待入库':'lead'}});audit('命题计划',id?'修改计划':'创建计划',input.name);notify('计划已保存')}
  function publishPlan(id:string){requireDuty('development');const p=data.value.plans.find(p=>p.id===id)!;const author=people.value.find(u=>u.name===p.expert);if(!author||!has(author,'author')||!author.kinds.includes(p.kind))throw new Error('命题人员未授权或开发范围不匹配');for(const [stage,duty] of Object.entries(reviewDuties)){const u=people.value.find(u=>u.id===p.reviewers?.[stage]);if(!u||!has(u,duty)||!u.kinds.includes(p.kind))throw new Error(stage+'人员未授权或范围不匹配')}p.status='进行中';audit('命题计划','发布并分配任务',p.name);notify('任务已出现在专家工作台')}
  function saveQuestion(input: Question){if(!can('author')&&!can('bank')&&!can('integration'))throw new Error('无命题权限');if(!person.value.kinds.includes(input.kind))throw new Error('不在开发授权范围');const existingQuestion=data.value.questions.find(q=>q.id===input.id);if(existingQuestion&&!canEditQuestion(existingQuestion))throw new Error('不能修改其他人员的试题');if(input.taskId&&can('author')&&!data.value.plans.some(p=>p.id===input.taskId&&p.expert===actor.value&&p.status==='进行中'))throw new Error('命题任务未分配或未发布');if(!input.title.trim()||!input.knowledge)throw new Error('请填写题干与知识点');if(['单选题','多选题','判断题'].includes(input.type)){if(input.options.some(o=>!o.trim())||input.options.length<2||!input.answers.length)throw new Error('请填写选项并设置正确答案');if(input.answers.some(a=>Number(a)>=input.options.length))throw new Error('答案选项无效')}
    if(input.kind==='技能' && (!input.rubric.length||input.rubric.some(r=>!r.label||r.max<=0)))throw new Error('请完善技能评分项目与分值')
    const old=data.value.questions.find(q=>q.id===input.id);if(old && ['待初审','待复审','待终审','待入库'].includes(old.status))throw new Error('审核中的试题请先退回再修改')
    if(catalogKinds.some(kind=>!input[kind]?.trim()))throw new Error('请完整选择工种、等级、科目和知识点')
    let parentId:string|null=null
    for(const kind of catalogKinds){const name=input[kind]?.trim();if(!name)throw new Error('请完整选择工种、等级、科目和知识点');const n=data.value.catalog!.find(n=>n.parentId===parentId&&n.name===name);if(n?.disabled)throw new Error('所选目录已停用，请选择已启用的知识点');parentId=n?.id||null;if(!n)break}
    parentId=null
    for(const kind of catalogKinds){const name=input[kind].trim();let n=data.value.catalog!.find(n=>n.parentId===parentId&&n.name===name);if(!n){n={id:uid('CAT'),parentId,name,kind};data.value.catalog!.push(n)}parentId=n.id}
    const q=clone(input);q.id=q.id||uid('Q');q.author=old?.author||actor.value;q.assignments=old?.assignments||{...(data.value.plans.find(p=>p.id===q.taskId)?.reviewers||{'待初审':'initial','待复审':'second','待终审':'final','待入库':'lead'})};q.status='草稿';q.version=old?old.version+1:1;q.history=old?clone(old.history):[];q.history.push({time:time(),actor:actor.value,action:old?'修订草稿':'创建草稿',note:'等待提交审核',version:q.version});if(old)data.value.questions.splice(data.value.questions.indexOf(old),1,q);else data.value.questions.unshift(q);audit('题库开发','保存题目',q.id);notify('草稿已保存，历史试卷快照保持不变');return q.id
  }
  function submitQuestion(id:string){const q=data.value.questions.find(q=>q.id===id)!;if(!q||!canEditQuestion(q))throw new Error('无当前试题提交权限');if(!['草稿','已退回'].includes(q.status))throw new Error('只有草稿或退回题可提交');if(!q.title.trim())throw new Error('请填写题干');q.status='待初审';q.history.push({time:time(),actor:actor.value,action:'提交初审',note:'进入三轮审核流程',version:q.version});audit('题库开发','提交审核',id);notify('已提交初审')}
  function reviewQuestion(id:string,approve:boolean,note:string,stage:string){const q=data.value.questions.find(q=>q.id===id)!;if(!q||!canReview(q))throw new Error('当前审核任务未分配给您或职责已停用');if(q.status!==stage)throw new Error('审核阶段已变化，请刷新');if(!approve&&!note.trim())throw new Error('退回必须填写修改意见');const before=q.status;q.status=approve?nextReview(q.status):'已退回';q.history.push({time:time(),actor:actor.value,action:approve?`${before}通过`:'退回修改',note:note||'内容与格式符合演示规则',version:q.version});audit('审核管理',approve?'审核通过':'退回修改',id);notify(`试题已流转至${q.status}`)}
  function stopQuestion(id:string){requireDuty('bank');const q=data.value.questions.find(q=>q.id===id)!;q.status='已停用';audit('题库管理','停用试题',id);notify('试题已停用，已有试卷快照不变')}
  function newPapers(name:string,count:number,seed:number,ab:boolean,difficulty:string,profession:string,maxOverlap:number){requireDuty('assemble');if(!name.trim())throw new Error('请输入试卷名称');const source=clone(data.value.questions.filter(q=>person.value.kinds.includes(q.kind)));const items=generatePaper(source,{seed,count,difficulty,profession});const result:Paper[]=[{id:uid('PAPER'),name: name+(ab?' A卷':''),version:1,status:'草稿',questions:items,rule:`1+X+Y · ${count}题 · 100分`,created:time(),overlap:0,report:validatePaper(items)}];if(ab){const b=generatePaper(source,{seed:seed+17,count,difficulty,profession,excluded:items.map(q=>q.question.id)});const rate=overlap(items,b);if(rate>maxOverlap)throw new Error('AB卷重复率超过设定阈值');result.push({...clone(result[0]!),id:uid('PAPER'),name:name+' B卷',questions:b,overlap:rate,report:validatePaper(b)});result[0]!.overlap=rate}data.value.papers.unshift(...result);audit('组卷管理','规则组卷',name);notify(`已生成${result.length}套试卷，所有约束校验通过`);return result[0]!.id}
  function manualPaper(name:string,ids:string[]){requireDuty('assemble');if(ids.some(id=>!data.value.questions.some(q=>q.id===id&&canReadQuestion(q))))throw new Error('试题不在授权范围');if(!ids.length)throw new Error('请先选择试题');const items=ids.map(id=>({question:clone(data.value.questions.find(q=>q.id===id)!),score:100/ids.length}));const report=validatePaper(items);const p:Paper={id:uid('PAPER'),name:name||'专家自定义试卷',version:1,status:'草稿',questions:items,rule:'固定组卷 · 自动均分100分',created:time(),overlap:0,report};data.value.papers.unshift(p);audit('组卷管理','固定组卷',p.id);return p.id}
  function freezePaper(id:string){requireDuty('assemble');const p=data.value.papers.find(p=>p.id===id)!;p.report=validatePaper(p.questions);p.status='已冻结';audit('组卷管理','冻结试卷',id);notify('试卷已冻结，可以配发场次')}
  function saveSession(input:Omit<Session,'id'>){requireDuty('affairs');if(!input.name||!input.venue||input.candidates<1||input.duration<15)throw new Error('请完善场次名称、地点、人数及考试时长（至少15分钟）');data.value.sessions.unshift({...input,id:uid('EXAM')});audit('考试管理','创建场次',input.name);notify('场次已创建')}
  function assignPaper(sessionId:string,paperId:string){requireDuty('affairs');const p=data.value.papers.find(p=>p.id===paperId);const s=data.value.sessions.find(s=>s.id===sessionId);if(!p||!s)throw new Error('请选择场次和试卷');if(!['已冻结','已配发'].includes(p.status))throw new Error('请先校验并冻结试卷');if(data.value.attempts.some(a=>a.sessionId===sessionId))throw new Error('该场次已产生答卷，不可更换试卷');s.paperId=paperId;s.status='已发布';p.status='已配发';audit('考试管理','配发试卷',`${s.id} / ${p.id}`);notify('配卷完成，考生可在我的考试中进入')}
  function startAttempt(sessionId:string){requireDuty('exam');const existing=data.value.attempts.find(a=>a.sessionId===sessionId&&(a.personId?a.personId===personId.value:a.candidate===actor.value));if(existing)return existing.id;const member=data.value.continuity!.enrollments.find(e=>e.sessionId===sessionId&&e.personId===personId.value);if(!member)throw new Error('未列入本场考试名单');const s=data.value.sessions.find(s=>s.id===sessionId)!;if(!s.paperId||!['进行中','已发布'].includes(s.status))throw new Error('该场次尚未开放作答');if(!canEnter(s.elapsedOffset,data.value.settings.late))throw new Error('已迟到超过30分钟，不允许进入考试');const paper=data.value.papers.find(p=>p.id===s.paperId)!;const id=uid('ATT');data.value.attempts.push({id,sessionId,personId:personId.value,ticket:member.ticket,seat:member.seat,candidate:actor.value,anonymous:`N-${String(data.value.attempts.length+301).padStart(4,'0')}`,questions:seededShuffle(clone(paper.questions),21),answers:{},seq:{},marked:[],startedAt:Date.now(),offset:s.elapsedOffset,status:'在考',objective:0,subjective:null,scores:{},signature:'',events:[],published:false,version:1});s.status='进行中';audit('考生考试','开始作答',id);return id}
  function elapsed(id:string){const a=data.value.attempts.find(a=>a.id===id)!;return Math.floor((Date.now()-a.startedAt)/1000)+a.offset}
  function advanceTime(id:string){requireDuty('exam');const a=ownAttempt(id);a.offset+=16*60;a.events.push('演示时钟推进16分钟');audit('演示控制','推进考试时钟',id);notify('演示时钟已推进16分钟')}
  function saveAnswer(id:string,qid:string,answer:string[],seq:number){requireDuty('exam');if(failSave.value||!online.value)throw new Error('模拟网络中断：答案暂未同步，请重试');const a=ownAttempt(id);if(a.status!=='在考')throw new Error('已交卷，不能修改答案');if(!a.questions.some(q=>q.question.id===qid))throw new Error('题目不属于该答卷');if(seq<=(a.seq[qid]||0))return;const previousSeq=a.seq[qid],previousAnswer=a.answers[qid];a.seq[qid]=seq;a.answers[qid]=[...answer];if(!persist()){if(previousSeq===undefined)delete a.seq[qid];else a.seq[qid]=previousSeq;if(previousAnswer===undefined)delete a.answers[qid];else a.answers[qid]=previousAnswer;throw new Error('浏览器存储失败：答案尚未保存，请重试或导出备份')}}
  function toggleMark(id:string,qid:string){requireDuty('exam');const a=ownAttempt(id);a.marked=a.marked.includes(qid)?a.marked.filter(x=>x!==qid):[...a.marked,qid];persist()}
  function submitAttempt(id:string,signature:string,force=false){requireDuty('exam');const a=ownAttempt(id);if(a.status!=='在考')return;if(!force&&!canSubmit(elapsed(id),data.value.settings.early))throw new Error('开考15分钟内禁止提前交卷；演示可推进时钟');if(!signature.trim()&&!force)throw new Error('请填写确认签名');a.signature=signature||'到时/授权交卷';a.submittedAt=time();a.objective=Math.round(a.questions.reduce((sum,q)=>sum+scoreObjective(q.question,a.answers[q.question.id]||[],q.score),0)*100)/100;const manual=a.questions.filter(q=>!['单选题','多选题','判断题'].includes(q.question.type));a.status=manual.length?'待阅卷':'已核定';a.subjective=manual.length?null:0;if(manual.length){data.value.marks.push({questionIds:manual.map(q=>q.question.id),arbitratorId:'arbitrator',reviewers:['评委一','评委二'],id:uid('MARK'),attemptId:a.id,anonymous:a.anonymous,title:'主观答卷评阅',objective:a.objective,max:manual.reduce((sum,q)=>sum+q.score,0),answer:manual.map(q=>`${q.question.title}\n${(a.answers[q.question.id]||['未作答']).join('')}`).join('\n\n'),rubric:manual.map(q=>({label:q.question.title,max:q.score})),scores:{},details:{},status:'待阅卷',final:null,note:'',signature:''})}audit('考生考试','提交答卷',id);notify(manual.length?'已交卷，等待人工评阅':'交卷成功，客观题已自动判分')}
  function recordEvent(id:string,message:string){requireDuty('exam');const a=ownAttempt(id);if(!a||a.status!=='在考')return;a.events.push(`${time()} ${message}`);persist()}
  function markPaper(id:string,reviewer:string,scores:number[],signature:string){
    requireDuty('review')
    const m=data.value.marks.find(m=>m.id===id)!
    if(!m||!canMark(person.value,m)||reviewer!==person.value.reviewer)throw new Error('不能代替其他人员评分')
    if(['已核定','已发布','待仲裁'].includes(m.status))throw new Error('当前评分已锁定或进入仲裁')
    const rule=m.rule||data.value.settings.scoreRule
    const threshold=m.threshold??data.value.settings.threshold
    const weights=m.weights||[...data.value.settings.weights]
    const required=m.reviewers?.length||(rule==='去极值平均'?3:2)
    if(rule==='去极值平均'&&required<3)throw new Error('去极值评分需要至少三位评委')
    if(!(m.reviewers||['评委一','评委二',...(required===3?['评委三']:[])]).includes(reviewer))throw new Error('评委身份不在当前分配范围')
    if(m.scores[reviewer]!==undefined)throw new Error('该评委已提交，不能重复评分')
    if(!signature.trim())throw new Error('请填写专家签名')
    if(scores.length!==m.rubric.length||scores.some((s,i)=>!Number.isFinite(s)||s<0||s>m.rubric[i]!.max))throw new Error('评分超出允许范围')
    const nextScores={...m.scores,[reviewer]:scores.reduce((a,b)=>a+b,0)}
    const ordered=(m.reviewers||Object.keys(nextScores)).filter(r=>nextScores[r]!==undefined)
    const values=ordered.map(r=>nextScores[r]!)
    const nextDetails={...m.details,[reviewer]:scores}
    const difference=m.thresholdScope==='逐题'?Math.max(...m.rubric.map((_,i)=>{const v=ordered.map(r=>nextDetails[r]![i]!);return Math.max(...v)-Math.min(...v)})):Math.max(...values)-Math.min(...values)
    const exceeded=m.thresholdScope==='逐题'?m.rubric.some((_,i)=>{const v=ordered.map(r=>nextDetails[r]![i]!);return Math.max(...v)-Math.min(...v)>(m.questionThresholds?.[i]??threshold)}):difference>threshold
    if(values.length>=required&&!exceeded)aggregateScores(values,rule,weights)
    m.rule=rule;m.threshold=threshold;m.weights=weights
    m.scores=nextScores;m.details[reviewer]=[...scores];(m.signatures||={})[reviewer]=signature;m.signature=signature;m.status='待另一评'
    if(values.length>=required){
      if(exceeded){m.status='待仲裁';m.note=m.thresholdScope==='逐题'?'存在试题分差超过逐题设定阈值':`差值${difference}分，超过阈值${threshold}分`}
      else{const retained=rule==='去极值平均'?[...ordered].sort((a,b)=>nextScores[a]!-nextScores[b]!).slice(1,-1):ordered;m.finalDetails=m.rubric.map((_,i)=>aggregateScores(retained.map(r=>m.details[r]![i]!),rule==='去极值平均'?'平均分':rule,weights));m.final=Math.round(m.finalDetails.reduce((a,b)=>a+b,0)*100)/100;m.status='已核定';settle(m)}
    }
    const attempt=data.value.attempts.find(a=>a.id===m.attemptId);if(attempt&&m.status==='待仲裁')attempt.status='待仲裁'
    audit('阅卷评分',`${reviewer}提交评分`,m.anonymous);notify(`评分已提交：${m.status}`)
  }
  function settle(m:MarkRecord){const a=data.value.attempts.find(a=>a.id===m.attemptId);if(a){a.subjective=m.final;const ids=m.questionIds||a.questions.filter(q=>!['单选题','多选题','判断题'].includes(q.question.type)).map(q=>q.question.id);if(m.finalDetails)ids.forEach((id,i)=>{a.scores[id]=m.finalDetails![i]!});else if(ids.length===1)a.scores[ids[0]!]=m.final!;a.status='已核定';a.version++}}
  function arbitrate(id:string,score:number,note:string,signature:string,details?:number[]){requireDuty('arbitrate');const m=data.value.marks.find(m=>m.id===id)!;if(m.arbitratorId!==person.value.id)throw new Error('未分配此仲裁任务');if(m.status!=='待仲裁')throw new Error('当前答卷不在仲裁状态');if(score<0||score>m.max||!Number.isFinite(score))throw new Error('仲裁分值超出范围');if(!note.trim()||!signature.trim())throw new Error('请填写仲裁依据及签名');if(m.questionIds&&m.questionIds.length>1&&!details)throw new Error('请填写每道主观题的仲裁分');if(details&&(details.length!==m.rubric.length||details.some((v,i)=>!Number.isFinite(v)||v<0||v>m.rubric[i]!.max)||Math.abs(details.reduce((a,b)=>a+b,0)-score)>.001))throw new Error('仲裁分项须在范围内且合计等于最终分');m.finalDetails=details||(m.questionIds?.length===1?[score]:undefined);m.final=score;m.note=note;m.signature=signature;m.status='已核定';settle(m);audit('阅卷评分','完成仲裁',m.anonymous);notify('仲裁已完成，成绩可以发布')}
  function publishResult(id:string){requireDuty('affairs');const a=data.value.attempts.find(a=>a.id===id);const m=data.value.marks.find(m=>m.id===id);if(a){if(a.status!=='已核定'&&a.status!=='已发布')throw new Error('成绩尚未核定');a.published=true;a.status='已发布'}else if(m){if(m.status!=='已核定'&&m.status!=='已发布')throw new Error('成绩尚未核定');m.status='已发布'}else throw new Error('成绩不存在');audit('成绩管理','发布成绩',id);notify('成绩已发布，可模拟回传')}
  function syncResult(id:string){requireDuty('affairs');const a=data.value.attempts.find(a=>a.id===id);const m=data.value.marks.find(m=>m.id===id);if(!(a?.published||m?.status==='已发布'))throw new Error('只有已发布的成绩可以回传');const key=`RESULT-${id}-V${a?.version||1}`;if(data.value.integrations.some(i=>i.key===key)){notify('该成绩版本已有回传记录，请在接口中心查看');return}data.value.integrations.unshift({id:uid('SYNC'),system:'集团认定系统',object:`${id} 成绩`,direction:'发送',status:'失败',time:time(),key,count:1,error:'演示故障：首次回传超时，请在接口中心重试。'});audit('接口中心','模拟成绩回传',id,'首次失败');notify('已生成模拟回传记录：首次超时，可重试')}
  function retryIntegration(id:string){requireDuty('integration');const i=data.value.integrations.find(i=>i.id===id)!;if(i.status==='成功'){notify('已有成功回执，未重复发送');return}i.count++;i.status='成功';i.error='';i.time=time();audit('接口中心','同键重试成功',i.key);notify('重试成功，幂等键保持不变')}
  function saveSkill(id:string,scores:number[],signature:string,note:string){requireDuty('skill');const s=data.value.skills.find(s=>s.id===id)!;if(s.assessorId!==person.value.id)throw new Error('未分配此现场评分任务');if(s.status==='已提交')throw new Error('评分已提交并锁定');const q=s.questionSnapshot||data.value.questions.find(q=>q.id===s.questionId)!;if(scores.length!==q.rubric.length||scores.some((v,i)=>!Number.isFinite(v)||v<0||v>q.rubric[i]!.max))throw new Error('请检查各评分项的范围');s.scores=scores;s.signature='';s.note=note;s.status='已提交';audit('技能评分','提交现场评分',s.candidate);notify(`技能评分已提交，总分${scores.reduce((a,b)=>a+b,0)}分`)}
  const stats=computed(()=>({bank:data.value.questions.filter(q=>q.status==='已入库').length,review:data.value.questions.filter(q=>q.status.startsWith('待')).length,plans:data.value.plans.length,papers:data.value.papers.length,mark:data.value.marks.filter(m=>!['已核定','已发布'].includes(m.status)).length}))
  function run(fn:()=>void){try{fn()}catch(e){notify(e instanceof Error?e.message:'操作失败',true)}}
  return {people,person,personId,dutyLabel,can,requireDuty,canPath,canReview,canReadQuestion,canEditQuestion,visibleMarks,visibleSkills,savePerson,switchPerson,saveCatalogNode,toggleCatalogNode,deleteCatalogNode,data,role,actor,toast,errorToast,failSave,online,persistenceError,stats,notify,guard,persist,audit,switchRole,reset,savePlan,publishPlan,saveQuestion,submitQuestion,reviewQuestion,stopQuestion,newPapers,manualPaper,freezePaper,saveSession,assignPaper,startAttempt,elapsed,advanceTime,saveAnswer,toggleMark,submitAttempt,recordEvent,markPaper,arbitrate,publishResult,syncResult,retryIntegration,saveSkill,run}
})
