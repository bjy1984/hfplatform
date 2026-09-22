<script setup lang="ts">
import { computed,ref } from 'vue'
import { usePlatform } from '../stores/platform'
import { useContinuity } from '../stores/continuity'
const props=defineProps<{sessionId:string}>(),s=usePlatform(),c=useContinuity(),person=ref(''),first=ref(1),second=ref(2)
const members=computed(()=>c.data.enrollments.filter(e=>e.sessionId===props.sessionId).sort((a,b)=>a.seat-b.seat))
const available=computed(()=>s.people.filter(p=>p.enabled&&p.duties.includes('exam')&&!members.value.some(e=>e.personId===p.id)))
function status(personId:string){return s.data.attempts.find(a=>a.sessionId===props.sessionId&&a.personId===personId)?.status||'待入场'}
</script>
<template><p class="muted">名单、准考证与机位关联到具体考生；编排结果自动保存。已产生业务记录的考生不可移除。</p><div class="filter-bar"><select v-model="person" aria-label="加入名单的考生"><option value="">选择考生</option><option v-for="p in available" :value="p.id">{{p.name}} · {{p.org}}</option></select><button class="button" @click="s.run(()=>{c.enroll(sessionId,person);person=''})">加入名单</button><span class="push-right">实际名单 {{members.length}} 人</span></div><div class="filter-bar"><select v-model.number="first" aria-label="原机位"><option v-for="m in members" :value="m.seat">{{m.seat}}号 · {{m.name}}</option></select><select v-model.number="second" aria-label="目标机位"><option v-for="m in members" :value="m.seat">{{m.seat}}号 · {{m.name}}</option></select><button class="button" @click="s.run(()=>c.swap(sessionId,first,second))">互换机位</button></div><div class="table-scroll"><table><thead><tr><th>机位</th><th>考生</th><th>准考证号</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="m in members" :key="m.id"><td>{{m.seat}}号</td><td>{{m.name}}</td><td>{{m.ticket}}</td><td>{{status(m.personId)}}</td><td><button class="text-button" @click="s.run(()=>c.remove(m.id))">移除</button></td></tr></tbody></table></div><p v-if="!members.length" class="muted">名单为空，请添加考生后安排入场。</p></template>
