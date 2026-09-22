<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatform } from '../stores/platform'
import { navigation } from '../navigation'
import Icon from '../components/Icon.vue'
import Badge from '../components/Badge.vue'
const s=usePlatform(),router=useRouter()
const entries=computed(()=>Object.values(navigation).flat().filter((n,i,a)=>n.path!=='/workbench'&&a.findIndex(x=>x.path===n.path)===i&&s.canPath(n.path)))
const tasks=computed(()=>{
 const rows:{title:string;sub:string;status:string;path:string}[]=[]
 for(const p of s.data.plans)if(p.status==='进行中'&&(s.can('author')&&p.expert===s.actor||s.can('lead')&&p.leadId===s.personId))rows.push({title:p.name,sub:'命题任务 · '+p.kind,status:p.status,path:s.can('author')?'/authoring/tasks':'/authoring/plans'})
 for(const q of s.data.questions){if(s.canReview(q))rows.push({title:q.title,sub:q.id+' · '+q.kind,status:q.status,path:'/authoring/reviews'});else if(s.can('author')&&q.author===s.actor&&['草稿','已退回'].includes(q.status))rows.push({title:q.title,sub:q.id,status:q.status,path:'/authoring/tasks'})}
 for(const m of s.visibleMarks){if(s.can('arbitrate')&&m.status==='待仲裁')rows.push({title:m.title,sub:m.anonymous,status:m.status,path:'/marking/arbitration'});else if(s.can('review')&&['待阅卷','待另一评'].includes(m.status)&&m.scores[s.person.reviewer||'']===undefined)rows.push({title:m.title,sub:m.anonymous,status:m.status,path:'/marking/tasks'})}
 for(const k of s.visibleSkills)if(k.status!=='已提交')rows.push({title:k.candidate+' · 技能评分',sub:k.batch||'演示技能场次',status:k.status,path:'/marking/skill'})
 if(s.can('exam'))for(const e of s.data.sessions.filter(e=>e.paperId)){const a=s.data.attempts.find(a=>a.sessionId===e.id&&a.candidate===s.actor);if(!a||a.status==='在考')rows.push({title:e.name,sub:e.room,status:a?.status||e.status,path:'/candidate/exams'})}
 return rows
})
const overview=computed(()=>s.can('development')?s.data.plans.map(p=>({name:p.name,detail:'命题：'+p.expert+' · 负责：'+(s.people.find(u=>u.id===p.leadId)?.name||'待分配'),status:p.status})):s.can('reviewAdmin')?s.data.marks.map(m=>({name:m.anonymous+' · '+m.title,detail:(m.reviewers||[]).join('、')+' · 仲裁：'+s.people.find(p=>p.id===m.arbitratorId)?.name,status:m.status})):[])
</script>
<template>
 <div class="dashboard-intro"><div><div class="eyebrow">WORKSPACE / {{s.dutyLabel}}</div><h1>{{s.actor}}的工作台</h1><p>按职责查看工作入口，按任务处理业务。</p></div><div class="date-block">{{new Date().toLocaleDateString('zh-CN')}}</div></div>
 <section class="hero-panel"><div class="hero-content"><span class="hero-kicker">职业技能等级认定 · 协同工作</span><h2>{{s.dutyLabel}}</h2><p>{{s.person.org}} · {{s.person.kinds.join(' / ')}}范围</p><button v-if="entries.length" @click="router.push(entries[0]!.path)">进入工作区 <Icon name="ArrowRight" :size="16"/></button></div></section>
 <div class="metric-grid"><div class="metric-card"><div class="metric-top">我的待处理任务</div><div class="metric-value">{{tasks.length}}<small>项</small></div></div><div class="metric-card"><div class="metric-top">可用业务入口</div><div class="metric-value">{{entries.length}}<small>个</small></div></div><div class="metric-card"><div class="metric-top">授权状态</div><h3>{{s.person.enabled?'已授权':'已停用'}}</h3><p>权限随职责与任务分配生效</p></div></div>
 <section class="panel spaced"><div class="panel-head"><h3>我的待办</h3><span class="subtle-label">仅当前人员可处理的任务</span></div><div v-for="t in tasks" class="todo-row" @click="router.push(t.path)"><span class="todo-icon blue"><Icon name="ClipboardCheck"/></span><div><h4>{{t.title}}</h4><p>{{t.sub}}</p></div><Badge :text="t.status"/><Icon name="ChevronRight"/></div><div v-if="!tasks.length" class="empty"><Icon name="CircleCheck"/><p>暂无分配给您的待处理任务，可从下方入口开展职责内工作。</p></div></section>
 <section v-if="overview.length" class="panel spaced"><div class="panel-head"><h3>业务管理进度</h3><span class="subtle-label">管理视角，与个人待办分开</span></div><div v-for="r in overview" class="history-row"><div><strong>{{r.name}}</strong><p>{{r.detail}}</p></div><Badge :text="r.status"/></div></section>
 <section class="panel quick-panel spaced"><div class="panel-head"><h3>职责工作入口</h3></div><div class="quick-grid"><button v-for="n in entries" @click="router.push(n.path)"><span><Icon :name="n.icon" :size="24"/></span><strong>{{n.label}}</strong><Icon name="ArrowUpRight" :size="15"/></button></div></section>
</template>
