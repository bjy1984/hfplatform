<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import type { CatalogNode } from '../domain/catalog'
import { catalogPath,catalogLabels,catalogActive } from '../domain/catalog'
import Icon from './Icon.vue'
const props=withDefaults(defineProps<{nodes:CatalogNode[];modelValue:string|null;counts?:Record<string,number>;total?:number;label?:string}>(),{label:'知识目录'})
const emit=defineEmits<{ 'update:modelValue':[id:string|null] }>()
const search=ref(''),expanded=ref(new Set<string>())
watch(()=>props.nodes.map(n=>n.id).join(','),()=>{for(const n of props.nodes)if(n.kind!=='knowledge')expanded.value.add(n.id)},{immediate:true})
watch(()=>props.modelValue,id=>{for(const n of catalogPath(props.nodes,id))expanded.value.add(n.id)},{immediate:true})
const matching=computed(()=>{const found=new Set<string>();if(!search.value.trim())return null;for(const n of props.nodes)if(n.name.toLowerCase().includes(search.value.trim().toLowerCase())){for(const p of catalogPath(props.nodes,n.id))found.add(p.id);for(const child of props.nodes)if(catalogPath(props.nodes,child.id).some(p=>p.id===n.id))found.add(child.id)}return found})
const rows=computed(()=>{const out:{node:CatalogNode;depth:number;branch:boolean}[]=[];function walk(parentId:string|null,depth:number){for(const node of props.nodes.filter(n=>n.parentId===parentId)){if(matching.value&&!matching.value.has(node.id))continue;const branch=props.nodes.some(n=>n.parentId===node.id);out.push({node,depth,branch});if(branch&&(search.value.trim()||expanded.value.has(node.id)))walk(node.id,depth+1)}}walk(null,0);return out})
function toggle(id:string){if(expanded.value.has(id))expanded.value.delete(id);else expanded.value.add(id)}
function key(event:KeyboardEvent,row:typeof rows.value[number]){if(event.key==='ArrowRight'&&row.branch){expanded.value.add(row.node.id);event.preventDefault()}if(event.key==='ArrowLeft'){expanded.value.delete(row.node.id);event.preventDefault()}}
</script>
<template>
 <div class="catalog-tree"><div class="catalog-search"><Icon name="Search" :size="15"/><input v-model="search" placeholder="搜索目录节点…" :aria-label="label+'搜索'"/><button v-if="search" class="text-button" aria-label="清除目录搜索" @click="search=''">清除</button></div>
 <div class="catalog-tools"><span>{{label}}</span><button @click="expanded=new Set(nodes.map(n=>n.id))">展开全部</button><button @click="expanded=new Set()">收起全部</button></div>
 <button class="catalog-root" :class="{active:!modelValue}" @click="emit('update:modelValue',null)"><Icon name="LibraryBig" :size="16"/>全部资源<span>{{total??nodes.length}}</span></button>
 <div class="catalog-rows" role="tree" :aria-label="label"><div v-for="row in rows" :key="row.node.id" role="treeitem" :aria-level="row.depth+1" :aria-selected="modelValue===row.node.id" :aria-expanded="row.branch?(!!search.trim()||expanded.has(row.node.id)):undefined" class="catalog-row" :class="{active:modelValue===row.node.id,disabled:!catalogActive(nodes,row.node.id)}" :style="{paddingLeft:(8+row.depth*14)+'px'}">
 <button v-if="row.branch" class="catalog-expander" :aria-label="(expanded.has(row.node.id)?'收起':'展开')+row.node.name" @click="toggle(row.node.id)"><Icon :name="search.trim()||expanded.has(row.node.id)?'ChevronDown':'ChevronRight'" :size="14"/></button><span v-else class="catalog-leaf"><Icon name="FileText" :size="13"/></span>
 <button class="catalog-select" :title="catalogPath(nodes,row.node.id).map(n=>n.name).join(' / ')" @click="emit('update:modelValue',row.node.id)" @keydown="key($event,row)"><span>{{row.node.name}}</span><small v-if="row.node.disabled">停用</small><small v-else-if="counts">{{counts[row.node.id]||0}}</small><small v-else>{{catalogLabels[row.node.kind]}}</small></button></div></div>
 <p v-if="!rows.length" class="catalog-empty">没有匹配的目录节点</p></div>
</template>
