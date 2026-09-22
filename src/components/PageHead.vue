<script setup lang="ts">
defineProps<{title:string;subtitle:string;eyebrow?:string}>();
</script>
<template><div class="page-head"><div><div class="eyebrow">{{eyebrow||'职业技能等级认定 / 业务工作区'}}</div><h1>{{title}}</h1><p>{{subtitle}}</p></div><div class="head-actions"><slot/></div></div></template>
