<script setup lang="ts">
import { journeys } from '../domain/journeys'
import Icon from './Icon.vue'
defineEmits<{select:[id:string]}>()
</script>
<template><div class="journey-grid"><button v-for="(j,i) in journeys" :key="j.id" class="journey-card" @click="$emit('select',j.id)"><div class="journey-card-top"><span class="icon-circle blue"><Icon :name="j.icon" :size="23"/></span><span>0{{i+1}} / 协议业务主线</span><Icon name="ArrowUpRight" :size="17"/></div><h3>{{j.title}}</h3><p>{{j.description}}</p><footer><span>{{j.steps.length}}个操作环节</span><small>{{j.clause}}</small></footer></button></div></template>
