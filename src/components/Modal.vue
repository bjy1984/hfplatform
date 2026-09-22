<script setup lang="ts">
import { onMounted,onUnmounted } from 'vue'
import Icon from './Icon.vue'
defineProps<{title:string;wide?:boolean}>();const emit=defineEmits(['close'])
const key=(e:KeyboardEvent)=>{if(e.key==='Escape')emit('close')}
onMounted(()=>document.addEventListener('keydown',key));onUnmounted(()=>document.removeEventListener('keydown',key))
</script>
<template><Teleport to="body"><div class="modal-backdrop" @click.self="emit('close')"><section class="modal" :class="{wide}" role="dialog" aria-modal="true" :aria-label="title"><header><h2>{{title}}</h2><button class="icon-button" aria-label="关闭" @click="emit('close')"><Icon name="X"/></button></header><div class="modal-body"><slot/></div><footer v-if="$slots.footer"><slot name="footer"/></footer></section></div></Teleport></template>
