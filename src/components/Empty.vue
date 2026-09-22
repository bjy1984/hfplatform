<script setup lang="ts">
import Icon from './Icon.vue';
withDefaults(defineProps<{title?:string;description?:string}>(),{title:'暂无符合条件的记录',description:'可以调整筛选条件，或创建一条新记录。'});
</script>
<template><div class="empty"><Icon name="FolderSearch" :size="34"/><h3>{{title}}</h3><p>{{description}}</p><slot/></div></template>
