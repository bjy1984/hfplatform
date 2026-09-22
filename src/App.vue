<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { usePlatform,roleNames,roleUsers } from './stores/platform'
import { navigation,accessible } from './navigation'
import { duties } from './domain/identity'
import Icon from './components/Icon.vue'
import Modal from './components/Modal.vue'
import JourneyCards from './components/JourneyCards.vue'
import { journeys } from './domain/journeys'
import { journeyContext,clearJourney } from './composables/journey'
const s=usePlatform(),route=useRoute(),router=useRouter()
const roleOpen=ref(false),guide=ref(false),resetOpen=ref(false),mobileMenu=ref(false),search=ref(''),searchOpen=ref(false)
const entries=computed(()=>Object.values(navigation).flat().filter((n,i,a)=>a.findIndex(x=>x.path===n.path)===i&&s.canPath(n.path)));const current=computed(()=>entries.value.find(n=>n.path===route.path)?.label||'业务详情')
const results=computed(()=>entries.value.filter(n=>n.label.includes(search.value)))
function roleChange(r:string){s.switchPerson(r);roleOpen.value=false;router.push('/workbench')}
watch(()=>[route.path,s.personId,s.person.enabled,s.person.duties.join()],()=>{if(!s.canPath(route.path))router.replace('/workbench');mobileMenu.value=false},{immediate:true})
const activeJourney=computed(()=>journeys.find(j=>j.id===journeyContext.value?.id))
function openJourney(id:string){guide.value=false;router.push('/journeys/'+id)}
</script>
<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{mobile:mobileMenu}">
      <div class="brand"><div class="brand-symbol"><Icon name="Orbit" :size="30"/></div><div><strong>航发 · 技能认定</strong><small>SKILL CERTIFICATION</small></div></div>
      <div class="workspace-label"><span class="pulse"></span> {{s.dutyLabel}} <Icon name="ChevronDown" :size="14"/></div>
      <nav aria-label="主导航"><template v-for="item in entries" :key="item.path"><div v-if="item.section" class="nav-section">{{item.section}}</div><RouterLink :to="item.path" class="nav-item" active-class="active"><Icon :name="item.icon"/><span>{{item.label}}</span><span v-if="item.path==='/authoring/reviews'" class="nav-count">{{s.data.questions.filter(q=>s.canReview(q)).length}}</span><Icon v-else-if="route.path===item.path" name="ChevronRight" :size="14"/></RouterLink></template></nav>
      <div class="sidebar-foot"><div class="foot-orbit"><Icon name="Plane" :size="42"/></div><p>以技能成就人才<br/><span>以认定助力发展</span></p><button @click="guide=true"><Icon name="Route" :size="16"/>演示导航 <Icon name="ArrowUpRight" :size="15"/></button></div>
    </aside>
    <div class="main-shell">
      <header class="topbar"><div class="top-left"><button class="icon-button menu-button" aria-label="打开导航" @click="mobileMenu=!mobileMenu"><Icon name="Menu"/></button><span class="breadcrumb">统一管理平台 <Icon name="ChevronRight" :size="13"/> <strong>{{current}}</strong></span></div><div class="top-right"><div class="global-search"><Icon name="Search" :size="16"/><input v-model="search" aria-label="搜索功能" placeholder="搜索功能、工作区…" @focus="searchOpen=true" @keydown.esc="searchOpen=false"/><kbd>⌕</kbd><div v-if="searchOpen && search" class="search-results"><button v-for="item in results" @click="router.push(item.path);search='';searchOpen=false"><Icon :name="item.icon" :size="16"/>{{item.label}}</button><p v-if="!results.length">未找到当前角色可用功能</p></div></div><span class="demo-label"><i></i>演示环境</span><button class="icon-button" aria-label="演示帮助" @click="guide=true"><Icon name="CircleHelp"/></button><div class="top-divider"></div><div class="role-control"><button class="user-button" @click="roleOpen=!roleOpen"><span class="avatar">{{s.actor[0]}}</span><span><strong>{{s.actor}}</strong><small>{{s.dutyLabel}}</small></span><Icon name="ChevronsUpDown" :size="15"/></button><div v-if="roleOpen" class="role-menu"><div class="dropdown-title">切换演示人员 · 合成账号</div><button v-for="p in s.people" :key="p.id" :class="{selected:s.personId===p.id}" @click="roleChange(p.id)"><span class="avatar small">{{p.name[0]}}</span><span>{{p.name}}<small>{{p.duties.filter(d=>d!=='learn').map(d=>duties[d]).join(' / ')||'电子书阅读'}}{{p.enabled?'':' · 已停用'}}</small></span><Icon v-if="s.personId===p.id" name="Check" :size="16"/></button></div></div></div></header>
      <main><div class="identity-context"><strong>{{s.actor}} · {{s.dutyLabel}}</strong><span>{{s.person.org}} · {{s.person.kinds.join(' / ')}}<template v-if="!s.person.enabled"> · 授权已停用</template></span></div><RouterView v-if="s.canPath(route.path)" :key="route.path+s.personId+s.person.duties.join()+s.person.enabled"/></main>
      <footer class="app-footer"><span>职业技能等级认定平台 <b>DEMO V1.1</b></span><span>全部为合成数据 · 核验与外部接口为模拟 <button v-if="s.can('access')" @click="resetOpen=true">重置演示</button></span></footer>
    </div>
    <div v-if="s.toast" role="status" class="toast" :class="{error:s.errorToast}"><Icon :name="s.errorToast?'CircleAlert':'CircleCheck'"/>{{s.toast}}</div>
    <div v-if="s.persistenceError" class="storage-warning">{{s.persistenceError}}</div>
    <Modal v-if="guide" title="演示导航" wide @close="guide=false"><div v-if="activeJourney" class="journey-context"><Icon :name="activeJourney.icon" :size="18"/><div><strong>继续演示：{{activeJourney.title}}</strong><span>上次进入：{{activeJourney.steps[journeyContext!.step]?.title}}</span></div><button class="button small" @click="openJourney(activeJourney.id)">继续此主线</button><button class="text-button" @click="clearJourney">结束引导</button></div><h3>按技术协议，体验七条业务主线</h3><p class="muted">选择业务主线，按所需角色进入各环节。流程内容对应技术协议，数据为合成样例。</p><JourneyCards @select="openJourney"/></Modal>
    <Modal v-if="resetOpen" title="重置演示数据" @close="resetOpen=false"><p>将恢复初始样本，清除本次新增的计划、试题、答卷和评分。此操作只影响当前浏览器中的 Demo 数据。</p><template #footer><button class="button" @click="resetOpen=false">取消</button><button class="button danger" @click="s.reset();clearJourney();resetOpen=false;router.push('/workbench')">确认重置</button></template></Modal>
  </div>
</template>
