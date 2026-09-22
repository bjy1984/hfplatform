<script setup lang="ts">
import { computed } from 'vue'
import type { Attempt } from '../domain/types'
import { resultBreakdown } from '../domain/continuity'
const props=defineProps<{attempt:Attempt}>()
const sections=computed(()=>{const a=props.attempt;const visible={...a,scores:a.published?a.scores:{}};return [{title:'题型得分分布',rows:resultBreakdown(visible,'type')},{title:'知识点得分分布',rows:resultBreakdown(visible,'knowledge')}]})
</script>
<template><div class="check-grid"><section v-for="section in sections"><h3>{{section.title}}</h3><table><thead><tr><th>分类</th><th>已判分 / 满分</th><th>状态</th></tr></thead><tbody><tr v-for="r in section.rows"><td>{{r.label}}</td><td>{{r.earned}} / {{r.max}}</td><td>{{r.pending?`${r.pending}题待评阅或发布`:'已完成'}}</td></tr></tbody></table></section></div><p class="muted">主观题按已发布的逐题核定分统计；待评阅或待发布部分不按零分处理。</p></template>
