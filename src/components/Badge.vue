<script setup lang="ts">
defineProps<{text:string}>()
const tone=(s:string)=> /失败|退回|停用|异常|仲裁/.test(s)?'red':/已发布|成功|已入库|已核定|已提交|已授权|通过|已冻结|已配发/.test(s)?'green':/待|草稿/.test(s)?'amber':'blue'
</script>
<template><span class="badge" :class="tone(text)"><i></i>{{ text }}</span></template>
