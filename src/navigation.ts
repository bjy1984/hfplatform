import type { Role } from './domain/types'
export const navigation: Record<Role,{ label:string; icon:string; path:string; section?:string }[]>={
  admin:[
    {label:'工作台',icon:'LayoutDashboard',path:'/workbench',section:'总览'},
    {label:'命题计划',icon:'ClipboardList',path:'/authoring/plans',section:'题库建设'},
    {label:'项目协调',icon:'ClipboardList',path:'/projects'},
    {label:'专家管理',icon:'Users',path:'/authoring/experts'},
    {label:'审核与入库',icon:'BadgeCheck',path:'/authoring/reviews'},
    {label:'题库资源',icon:'LibraryBig',path:'/bank/questions'},
    {label:'知识结构',icon:'Network',path:'/bank/structure'},
    {label:'组卷管理',icon:'Layers',path:'/papers'},
    {label:'标准比重',icon:'Layers',path:'/papers/rules'},
    {label:'考试组织',icon:'CalendarDays',path:'/affairs/sessions',section:'考试与评价'},
    {label:'考场监控',icon:'Monitor',path:'/affairs/monitor'},
    {label:'成绩与档案',icon:'FolderArchive',path:'/results/list'},
    {label:'综合档案',icon:'FolderArchive',path:'/archives'},
    {label:'统计分析',icon:'ChartNoAxesCombined',path:'/results/analytics'},
    {label:'学习资源',icon:'BookOpen',path:'/support/resources',section:'平台管理'},
    {label:'接口中心',icon:'Cable',path:'/support/integrations'},
    {label:'权限与审计',icon:'ShieldCheck',path:'/support/permissions'},
    {label:'系统设置',icon:'Settings2',path:'/support/settings'},
    {label:'阅卷组织',icon:'Users',path:'/protocol/marking'},
    {label:'技能任务配发',icon:'TabletSmartphone',path:'/protocol/skills'},
    {label:'传统试卷配发',icon:'Layers',path:'/protocol/papers'},
    {label:'考试管控',icon:'ShieldCheck',path:'/protocol/examination'},
    {label:'开发质量统计',icon:'ChartNoAxesCombined',path:'/protocol/development'},

  ],
  expert:[{label:'专家工作台',icon:'LayoutDashboard',path:'/workbench',section:'专家中心'},{label:'我的任务',icon:'ClipboardList',path:'/authoring/tasks'},{label:'在线命题',icon:'PenLine',path:'/authoring/editor'},{label:'试题审核',icon:'BadgeCheck',path:'/authoring/reviews'},{label:'题库资源',icon:'LibraryBig',path:'/bank/questions',section:'资源与追溯'},{label:'组卷工作区',icon:'Layers',path:'/papers'},{label:'历史与协作',icon:'History',path:'/authoring/history'},{label:'命题参考资料',icon:'BookOpen',path:'/support/resources'}],
  candidate:[{label:'考生工作台',icon:'LayoutDashboard',path:'/workbench',section:'考生中心'},{label:'我的考试',icon:'CalendarDays',path:'/candidate/exams'},{label:'成绩报告',icon:'ChartNoAxesCombined',path:'/candidate/reports'},{label:'学习中心',icon:'BookOpen',path:'/support/resources',section:'学习与服务'},{label:'个人信息',icon:'UserRound',path:'/candidate/profile'},{label:'考试帮助',icon:'CircleHelp',path:'/candidate/help'}],
  marker:[{label:'评分工作台',icon:'LayoutDashboard',path:'/workbench',section:'评分中心'},{label:'阅卷任务',icon:'ClipboardCheck',path:'/marking/tasks'},{label:'差值与仲裁',icon:'Scale',path:'/marking/arbitration'},{label:'现场技能评分',icon:'TabletSmartphone',path:'/marking/skill'},{label:'评分进度',icon:'ChartNoAxesCombined',path:'/marking/progress',section:'工作记录'},{label:'历史评分',icon:'History',path:'/marking/history'},{label:'评分参考资料',icon:'BookOpen',path:'/support/resources'}]
}
export function accessible(role:Role,path:string){if(path==='/journeys'||path.startsWith('/journeys/'))return true;if(path.startsWith('/protocol/'))return role==='admin';if(navigation[role].some(n=>n.path===path))return true;return role==='candidate'&&['/candidate/check','/candidate/answer'].includes(path)||['admin','expert'].includes(role)&&path==='/authoring/editor'}
