<script setup lang="ts">
import { computed } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { journeys } from '../domain/journeys'
import { usePlatform,roleNames } from '../stores/platform'
import { setJourney,journeyContext } from '../composables/journey'
import PageHead from '../components/PageHead.vue'
import JourneyCards from '../components/JourneyCards.vue'
import Icon from '../components/Icon.vue'
const route=useRoute(),router=useRouter(),s=usePlatform()
const journey=computed(()=>journeys.find(j=>j.id===route.params.id))
function launch(index:number){const j=journey.value!;const step=j.steps[index]!;setJourney(j.id,index);s.switchPerson(step.person||'organizer');router.push(step.path)}
</script>
<template><PageHead :title="journey?.title||'演示导航'" :subtitle="journey?.description||'按照技术协议组织业务环节，每条主线可进入对应工作区操作。'" eyebrow="演示导航 / 业务流程"><RouterLink v-if="journey" class="button" to="/journeys"><Icon name="Route" :size="16"/>全部主线</RouterLink></PageHead>
<h2 v-if="!journey" class="demo-section-title">按技术协议，体验七条业务主线</h2><div v-if="!journey&&journeyContext" class="notice spaced"><RouterLink class="text-button" :to="'/journeys/'+journeyContext.id">继续上次演示主线</RouterLink></div><JourneyCards v-if="!journey" @select="id=>router.push('/journeys/'+id)"/>
<template v-else><section class="journey-summary panel"><span class="icon-circle blue"><Icon :name="journey.icon" :size="28"/></span><div><h3>协议条款 {{journey.clause}}</h3><p>{{journey.sample}}</p><small>点击环节会切换至所需演示人员；操作保存在当前浏览器，可通过“演示导航”返回本主线继续下一环节。进入页面不代表业务已完成。</small></div></section><div class="journey-step-list"><article v-for="(step,i) in journey.steps" :key="step.title" class="panel journey-step" :class="{current:journeyContext?.id===journey.id&&journeyContext.step===i}"><span class="step-num">{{String(i+1).padStart(2,'0')}}</span><div><div class="journey-step-title"><h3>{{step.title}}</h3><span class="pill">{{s.people.find(p=>p.id===step.person)?.name}}</span></div><p>{{step.description}}</p><small>协议 {{step.clause}}</small></div><button class="button primary" @click="launch(i)">进入此环节 <Icon name="ArrowRight" :size="16"/></button></article></div></template>
<div class="notice spaced">主线只整理协议明确要求。接口、人脸及安全策略采用模拟数据；正式安全防护、兼容性、并发及正版资源数量另行验证。</div><section class="panel spaced"><div class="panel-head"><h3>演示范围与正式验证边界</h3></div><div class="table-scroll"><table><thead><tr><th>内容</th><th>当前演示</th><th>正式阶段</th></tr></thead><tbody><tr v-for="row in [['题型与导入','6类题型、Excel窄模板、完全同文检测','完整题型、Word及复杂格式、相似度检测'],['人脸 / IP / 防舞弊','模拟配置、核验结果与浏览器事件','授权接口与受控终端安全验证'],['电子书资源','自制文本上传、维护与阅读','不少于500本正版资源授权交付'],['权限与签名','合成角色、文本签名','服务端授权和正式电子签名方案'],['部署与性能','单前端、本地存储、现代浏览器','独立部署、国产化兼容、2000人并发验证'],['备份与容灾','JSON导出、当前浏览器刷新恢复','灾备恢复、集群与运行取证'],['数据与集成','同源标签页共享Mock数据，外部接口本地模拟','真实系统接口、网络和身份体系联调']]"><td>{{row[0]}}</td><td>{{row[1]}}</td><td>{{row[2]}}</td></tr></tbody></table></div></section></template>
