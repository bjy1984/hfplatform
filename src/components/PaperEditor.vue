<script setup lang="ts">
import { ref } from 'vue'
import { usePlatform } from '../stores/platform'
import { useContinuity } from '../stores/continuity'
import type { Paper } from '../domain/types'
const props=defineProps<{paper:Paper}>(),s=usePlatform(),c=useContinuity(),rows=ref(props.paper.questions.map(q=>({id:q.question.id,title:q.question.title,score:q.score})))
function move(index:number,delta:number){const item=rows.value.splice(index,1)[0]!;rows.value.splice(index+delta,0,item)}
</script>
<template><details class="notice"><summary>调整题序与分值</summary><table><thead><tr><th>题目</th><th>分值</th><th>顺序</th></tr></thead><tbody><tr v-for="(r,i) in rows" :key="r.id"><td>{{i+1}}. {{r.title}}</td><td><input type="number" v-model.number="r.score" min="0.01" step="0.01" :aria-label="'第'+(i+1)+'题分值'"/></td><td><button class="text-button" :disabled="i===0" @click="move(i,-1)">上移</button><button class="text-button" :disabled="i===rows.length-1" @click="move(i,1)">下移</button></td></tr></tbody></table><p>合计 {{Number(rows.reduce((n,r)=>n+r.score,0).toFixed(2))}} 分，保存时须为100分。</p><button class="button" @click="s.run(()=>c.editPaper(paper.id,rows.map(r=>r.score),rows.map(r=>r.id)))">保存题序与分值</button></details></template>
