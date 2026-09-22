<script setup lang="ts">
import { ref,computed,watch } from 'vue'
import type { Question,QuestionType } from '../domain/types'
import { usePlatform } from '../stores/platform'
import { knowledgePoints,professions } from '../mocks/seed'
import Icon from './Icon.vue'
import Badge from './Badge.vue'
import CatalogTree from './CatalogTree.vue'
import Modal from './Modal.vue'
import { catalogPath,catalogLeaves,catalogActive } from '../domain/catalog'
const props=defineProps<{question?:Question;taskId?:string}>();const emit=defineEmits(['saved'])
const s=usePlatform();const preview=ref(false)
const form=ref<Question>(props.question?JSON.parse(JSON.stringify(props.question)):{id:'',title:'',type:'单选题',kind:'理论',profession:professions[0],level:'三级 / 高级工',subject:'专业理论',knowledge:knowledgePoints[0],bank:'母题库',difficulty:'中等',status:'草稿',author:s.actor,version:1,options:['','','',''],answers:['0'],analysis:'',rubric:[],preparation:'',venue:'',history:[],taskId:props.taskId})
const catalog=computed(()=>s.data.catalog||[]),treeOpen=ref(false),treeChoice=ref<string|null>(null)
if(!props.question){const first=catalogLeaves(catalog.value)[0];if(first)for(const p of catalogPath(catalog.value,first.id))form.value[p.kind]=p.name}
const availableKnowledge=computed(()=>catalogLeaves(catalog.value,{profession:form.value.profession,level:form.value.level,subject:form.value.subject}))
function choices(kind:'profession'|'level'|'subject'){return [...new Set(catalog.value.filter(n=>n.kind===kind&&catalogActive(catalog.value,n.id)&&catalogPath(catalog.value,n.id).every(p=>p.kind==='profession'&&kind!=='profession'?p.name===form.value.profession:p.kind==='level'&&kind==='subject'?p.name===form.value.level:true)).map(n=>n.name))]}
watch(()=>[form.value.profession,form.value.level,form.value.subject],()=>{if(!choices('level').includes(form.value.level))form.value.level=choices('level')[0]||'';if(!choices('subject').includes(form.value.subject))form.value.subject=choices('subject')[0]||'';if(!availableKnowledge.value.some(n=>n.name===form.value.knowledge))form.value.knowledge=availableKnowledge.value[0]?.name||''})
function selectKnowledge(){s.run(()=>{const n=catalog.value.find(n=>n.id===treeChoice.value);if(!n||n.kind!=='knowledge'||!catalogActive(catalog.value,n.id))throw new Error('请选择已启用的末级知识点');for(const p of catalogPath(catalog.value,n.id))form.value[p.kind]=p.name;treeOpen.value=false})}
const types:QuestionType[]=(['单选题','多选题','判断题','简答题','实操步骤题','评分表题'] as QuestionType[]).filter(t=>s.person.kinds.includes(['实操步骤题','评分表题'].includes(t)?'技能':'理论'))
if(!props.question&&s.person.kinds.length===1&&s.person.kinds[0]==='技能'){form.value.type='实操步骤题';typeChange();const task=s.data.plans.find(p=>p.id===props.taskId);if(task){form.value.profession=task.profession;form.value.level=task.level}}
const objective=computed(()=>['单选题','多选题','判断题'].includes(form.value.type))
function typeChange(){form.value.kind=['实操步骤题','评分表题'].includes(form.value.type)?'技能':'理论';form.value.options=form.value.type==='判断题'?['正确','错误']:['','','',''];form.value.answers=['0'];if(form.value.kind==='技能'||form.value.type==='简答题')form.value.rubric=[{label:'内容与步骤规范',max:40},{label:'结果与质量记录',max:60}]}
function toggle(i:number){const v=String(i);if(form.value.type==='多选题')form.value.answers=form.value.answers.includes(v)?form.value.answers.filter(a=>a!==v):[...form.value.answers,v];else form.value.answers=[v]}
function save(submit=false){s.run(()=>{const id=s.saveQuestion(form.value);form.value.id=id;form.value.version=s.data.questions.find(q=>q.id===id)!.version;if(submit)s.submitQuestion(id);emit('saved',id)})}
const duplicates=computed(()=>s.data.questions.filter(q=>q.id!==form.value.id&&q.title.replace(/\s/g,'')===form.value.title.replace(/\s/g,'')&&form.value.title.trim()))
</script>
<template>
  <div class="editor-toolbar"><div><span class="pill">{{form.id||'新试题'}}</span><span class="muted">版本 V{{form.version}} · {{form.kind}}题库</span></div><button class="button small" @click="preview=!preview"><Icon :name="preview?'PenLine':'Eye'" :size="16"/>{{preview?'返回编辑':'考生视角预览'}}</button></div>
  <template v-if="!preview"><div class="form-grid four"><label>题型 <b>*</b><select v-model="form.type" @change="typeChange"><option v-for="type in types">{{type}}</option></select></label><label>题库来源<select v-model="form.bank"><option>母题库</option><option>子题库</option><option>通用题库</option></select></label><label>难度<select v-model="form.difficulty"><option>容易</option><option>中等</option><option>较难</option></select></label><label>知识点 <b>*</b><select v-model="form.knowledge"><option v-if="!availableKnowledge.length" value="">请先维护此科目的知识点</option><option v-for="k in availableKnowledge" :key="k.id">{{k.name}}</option></select></label><label>职业工种<select v-model="form.profession"><option v-for="p in choices('profession')">{{p}}</option></select></label><label>技能等级<select v-model="form.level"><option v-for="l in choices('level')">{{l}}</option></select></label><label>科目<select v-model="form.subject"><option v-for="subject in choices('subject')">{{subject}}</option></select></label></div>
  <div class="catalog-editor-path"><span>{{[form.profession,form.level,form.subject,form.knowledge].filter(Boolean).join(' / ')}}</span><button class="button small" @click="treeOpen=true"><Icon name="Network" :size="15"/>从目录树选择</button></div>
  <label class="field">题干 <b>*</b><textarea v-model="form.title" rows="4" placeholder="请输入清晰、完整的题目内容…"></textarea></label>
  <div v-if="duplicates.length" class="notice warning"><Icon name="CopyX" :size="17"/>检测到{{duplicates.length}}道完全同文试题：{{duplicates.map(q=>q.id).join('、')}}。请核对，系统不会自动删除。</div>
  <div v-if="objective"><div class="section-label">选项与正确答案 <small>点击左侧圆圈设置正确答案{{form.type==='多选题'?'（支持多选）':''}}</small></div><div v-for="(option,i) in form.options" :key="i" class="option-editor"><button class="answer-toggle" :class="{checked:form.answers.includes(String(i))}" :aria-label="'设为正确答案'+String.fromCharCode(65+i)" @click="toggle(i)"><Icon v-if="form.answers.includes(String(i))" name="Check" :size="15"/></button><span>{{String.fromCharCode(65+i)}}</span><input v-model="form.options[i]" :aria-label="'选项'+String.fromCharCode(65+i)" :placeholder="'请输入选项'+String.fromCharCode(65+i)"/></div></div>
  <template v-else><div class="section-label">评分标准 <button class="text-button" @click="form.rubric.push({label:'',max:10})"><Icon name="Plus" :size="15"/>添加评分项</button></div><div v-for="(r,i) in form.rubric" class="rubric-edit"><input v-model="r.label" placeholder="评分项目名称"/><input v-model.number="r.max" type="number" min="1" max="100" aria-label="项目分值"/><span>分</span><button class="icon-button" @click="form.rubric.splice(i,1)" aria-label="删除评分项"><Icon name="Trash2" :size="16"/></button></div><p class="muted">评分标准总分：{{form.rubric.reduce((a,b)=>a+Number(b.max),0)}} 分</p></template>
  <div v-if="form.kind==='技能'" class="form-grid"><label>技能模块<input v-model="form.module" placeholder="填写技能模块"/></label><label>考生准备要求<textarea v-model="form.preparation" rows="3"/></label><label>考场与设备准备<textarea v-model="form.venue" rows="3"/></label></div><label class="field">答案解析 / 评分说明<textarea v-model="form.analysis" rows="3" placeholder="补充解析、评分依据或参考标准…"/></label>
  </template>
  <div v-else class="question-preview"><Badge :text="form.type"/><h3>{{form.title||'未填写题干'}}</h3><p v-for="(option,i) in form.options" v-show="objective">{{String.fromCharCode(65+i)}}. {{option}}</p><textarea v-if="!objective" placeholder="考生作答区域" rows="4" disabled/><p class="muted">本预览不显示标准答案和解析。</p></div>
  <Modal v-if="treeOpen" title="选择试题所属知识点" @close="treeOpen=false"><CatalogTree v-model="treeChoice" :nodes="catalog" label="命题知识目录"/><template #footer><button class="button" @click="treeOpen=false">取消</button><button class="button primary" @click="selectKnowledge">使用此知识点</button></template></Modal>
  <div class="form-actions"><button class="button" @click="save(false)"><Icon name="Save" :size="16"/>保存草稿</button><button class="button primary" @click="save(true)"><Icon name="Send" :size="16"/>保存并提交初审</button></div>
</template>
