import { createRouter, createWebHashHistory } from 'vue-router'
import Archives from './views/Archives.vue'
import PaperRules from './views/PaperRules.vue'
import Coordination from './views/Coordination.vue'
import Journeys from './views/Journeys.vue'
import Protocol from './views/Protocol.vue'
import Dashboard from './views/Dashboard.vue'
import Authoring from './views/Authoring.vue'
import Bank from './views/Bank.vue'
import Papers from './views/Papers.vue'
import Affairs from './views/Affairs.vue'
import Candidate from './views/Candidate.vue'
import Marking from './views/Marking.vue'
import Results from './views/Results.vue'
import Support from './views/Support.vue'
export const router=createRouter({history:createWebHashHistory(),routes:[
  {path:'/',redirect:'/workbench'},
  {path:'/workbench',component:Dashboard},
  {path:'/journeys',component:Journeys},
  {path:'/journeys/:id',component:Journeys},
  {path:'/protocol/:id',component:Protocol},
  {path:'/authoring/:page',component:Authoring},
  {path:'/bank/:page',component:Bank},
  {path:'/archives',component:Archives},
  {path:'/projects',component:Coordination},
  {path:'/papers/rules',component:PaperRules},
  {path:'/papers',component:Papers},
  {path:'/affairs/:page',component:Affairs},
  {path:'/candidate/:page',component:Candidate},
  {path:'/marking/:page',component:Marking},
  {path:'/results/:page',component:Results},
  {path:'/support/:page',component:Support},
  {path:'/:pathMatch(.*)*',redirect:'/workbench'}
]})
