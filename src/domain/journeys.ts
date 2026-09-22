import type { Role } from './types'
export interface JourneyStep { title:string; role:Role; person?:string; path:string; clause:string; description:string }
export interface Journey { id:string; title:string; icon:string; clause:string; description:string; sample:string; steps:JourneyStep[] }
export const journeys:Journey[]=[
 {id:'development',title:'题库开发与修订入库',icon:'PenLine',clause:'2.1.3—2.1.13',description:'从命题计划、专家任务到三审入库，再到修订和重新审核。',sample:'PLAN-001 · 装配工理论题库计划；DRAFT-1～5为不同审核阶段样例。',steps:[
  {title:'命题计划与专家分配',role:'admin',person:'organizer',path:'/authoring/plans',clause:'2.1.3、2.1.6',description:'新建计划，选择专家并发布任务。'},
  {title:'专家档案与授权',role:'admin',person:'organizer',path:'/authoring/experts',clause:'2.1.6、2.1.12',description:'查看专家档案，维护职责和授权状态。'},
  {title:'接收任务与在线命题',role:'expert',person:'author',path:'/authoring/tasks',clause:'2.1.4、2.1.13',description:'从任务进入编辑，填写题干、答案或评分标准并提交。'},
  {title:'初审、复审、终审与入库',role:'expert',person:'initial',path:'/authoring/reviews',clause:'2.1.5、2.1.8',description:'由分配的初审、复审、终审及入库人员接续处理；当前入口进入初审。'},
  {title:'复审任务交接',role:'expert',person:'second',path:'/authoring/reviews',clause:'2.1.8',description:'由复审人员接收初审通过的任务。'},
  {title:'终审任务交接',role:'expert',person:'final',path:'/authoring/reviews',clause:'2.1.8',description:'由终审人员完成当前分配任务。'},
  {title:'任务入库',role:'expert',person:'lead',path:'/authoring/reviews',clause:'2.1.13',description:'由获授权人员执行入库；入库职责为演示配置。'},
  {title:'已入库试题修订',role:'expert',person:'bank',path:'/bank/questions',clause:'2.1.9',description:'打开试题详情创建修订版本，修改后重新提交审核。'},
  {title:'版本溯源与协作意见',role:'expert',person:'author',path:'/authoring/history',clause:'2.1.8、2.1.10',description:'查询版本、审核意见、操作人和时间。'},
  {title:'负责人项目协调',role:'expert',person:'lead',path:'/projects',clause:'2.1.13',description:'检查负责项目进度，登记协调或特殊申请并记录处理意见，保持原审核链。'},
  {title:'命题质量与计划统计',role:'admin',person:'organizer',path:'/protocol/development',clause:'2.1.7、2.1.11—2.1.12',description:'检查同文题，查看计划完成情况及专家工作量，导出报表。'}]},
 {id:'papers',title:'题库管理、组卷与配发',icon:'Layers',clause:'2.2.3—2.2.10、2.2.12、2.2.15、2.4.5',description:'结构化管理资源，按规则组卷、校验，向机考和传统考试配发。',sample:'PAPER-A / PAPER-B · 预置20题AB卷；可从三类题库重新生成。',steps:[
  {title:'知识结构与题库维护',role:'admin',person:'bank',path:'/bank/structure',clause:'2.2.4、2.2.19',description:'维护工种、等级、科目、知识点树与试题关联。'},
  {title:'导入与检索题库',role:'admin',person:'bank',path:'/bank/questions',clause:'2.2.5—2.2.6',description:'题库管理人员上传Excel模板、校验并检索资源。'},
  {title:'专家固定选题组卷',role:'expert',person:'assembler',path:'/bank/questions',clause:'2.2.6、2.2.8',description:'由组卷专家从已入库资源选题，形成固定试卷。'},
  {title:'标准比重与混合卷',role:'expert',person:'assembler',path:'/papers/rules',clause:'2.2.3、2.2.7—2.2.8',description:'选择主客观混合样例，配置科目、题型、分值、知识点与来源比重后生成试卷。'},
  {title:'规则组卷与质量校验',role:'expert',person:'assembler',path:'/papers',clause:'2.2.7—2.2.9、2.2.15',description:'配置题量、难度及AB卷，按1+X+Y抽题并冻结试卷。'},
  {title:'机考试卷配发',role:'admin',person:'affairs',path:'/affairs/sessions',clause:'2.4.5',description:'为尚无答卷的场次选择已冻结试卷并发布。'},
  {title:'传统考试配发与使用记录',role:'admin',person:'affairs',path:'/protocol/papers',clause:'2.2.10、2.2.12、2.4.5',description:'选择试卷、批次和接收单位，登记传统考试配发，下载考生卷。'}]},
 {id:'examination',title:'无纸化考试实施',icon:'Monitor',clause:'2.3.1—2.3.13、2.4.4',description:'考务联动、身份核验、在线作答、续考、交卷及个人报告。',sample:'EXAM-001 · 已配卷理论考试；同一浏览器刷新恢复已保存答案。',steps:[
  {title:'考试计划与场次组织',role:'admin',person:'affairs',path:'/affairs/sessions',clause:'2.3.1、2.4.4',description:'安排考点考场、监考人员并配卷；维护本场名单、准考证和持久机位。'},
  {title:'考试管控参数',role:'admin',person:'affairs',path:'/protocol/examination',clause:'2.3.2、2.3.6—2.3.11',description:'配置模拟人脸间隔、IP范围及安全策略，查看协议时间边界。'},
  {title:'考前核验与在线作答',role:'candidate',person:'candidate',path:'/candidate/exams',clause:'2.3.3、2.3.6、2.3.12',description:'进入考试，模拟核验，体验乱序、字号、标记和计算器。'},
  {title:'过程监控与异常处置',role:'admin',person:'affairs',path:'/affairs/monitor',clause:'2.3.2、2.3.4、2.3.10',description:'查看实际作答进度、浏览器事件并记录复核。'},
  {title:'续考、确认与交卷',role:'candidate',person:'candidate',path:'/candidate/exams',clause:'2.3.4、2.3.9、2.3.12',description:'继续既有答卷，可模拟保存失败重试，推进时钟后签字交卷。'},
  {title:'成绩及个人分析报告',role:'candidate',person:'candidate',path:'/candidate/reports',clause:'2.3.13',description:'查询本人答卷、题型和知识点得分；主观成绩待阅卷核定。'}]},
 {id:'marking',title:'阅卷、核分与仲裁',icon:'Scale',clause:'2.3.5、2.3.14—2.3.20',description:'分配评委、独立评分、差值处置、核分留痕和归档。',sample:'N-0268待阅卷、N-0269待仲裁、N-0270已核定；均为独立的合成历史答卷。',steps:[
  {title:'阅卷任务分配',role:'admin',person:'reviewAdmin',path:'/protocol/marking',clause:'2.3.16—2.3.17',description:'选择答卷及一判、双判或三判，指定或随机分配人员、仲裁人员与逐题阈值。'},
  {title:'核分规则与差值阈值',role:'admin',person:'reviewAdmin',path:'/support/settings',clause:'2.3.14—2.3.15',description:'配置平均、权重、去极值及差值阈值。'},
  {title:'独立评阅与签字',role:'marker',person:'reviewer1',path:'/marking/tasks',clause:'2.3.5、2.3.16、2.3.19',description:'按评分表评分，切换不同阅卷人员，分别提交评分及签名。'},
  {title:'第二位专家评阅',role:'marker',person:'reviewer2',path:'/marking/tasks',clause:'2.3.5',description:'切换赵敏，完成其被分配的评分任务；不能代替第一位专家。'},
  {title:'超差退回或直接仲裁',role:'marker',person:'arbitrator',path:'/marking/arbitration',clause:'2.3.14',description:'超阈值答卷可退回重评，或填写定分依据直接仲裁。'},
  {title:'阅卷进度与统计',role:'marker',person:'reviewAdmin',path:'/marking/progress',clause:'2.3.18',description:'查看专家提交情况及核定进度。'},
  {title:'成绩发布与档案下载',role:'admin',person:'affairs',path:'/results/list',clause:'2.3.20、2.4.6',description:'发布核定成绩、下载档案并模拟回传。'},
  {title:'线上线下综合归档',role:'admin',person:'affairs',path:'/archives',clause:'2.2.20、2.3.20',description:'按同一场次与考生归集线上答卷、逐题评分、技能任务、上传的线下材料，下载完整档案。'}]},
 {id:'skills',title:'操作技能考核',icon:'TabletSmartphone',clause:'2.1.4、2.2.11—2.2.12、2.2.16',description:'技能题、准备要求与评分表，衔接抽题配发、现场评分和总分。',sample:'SK-1～6 · 技能题；SKILL-001预置评分18/26/44，合计88分。',steps:[
  {title:'技能试题与评分表',role:'expert',person:'skillAuthor',path:'/bank/questions?kind=技能',clause:'2.1.4、2.2.16',description:'查看或修订实操步骤、考生准备、考场准备和评分标准。'},
  {title:'抽题、准备与任务配发',role:'admin',person:'affairs',path:'/protocol/skills',clause:'2.2.11—2.2.12、2.2.16',description:'按工种、等级及模块指定或随机抽题，从场次名单选择考生，下载准备要求并配发现场任务。'},
  {title:'现场移动评分与留痕',role:'marker',person:'assessor',path:'/marking/skill',clause:'2.2.11',description:'选择任务、逐项评分，提交后计算总分并记录操作人员。'},
  {title:'技能成绩与过程追溯',role:'admin',person:'affairs',path:'/protocol/skills',clause:'2.2.11、2.2.13',description:'查看已提交总分、评分明细及任务来源，导出技能成绩。'}]},
 {id:'resources',title:'电子书资源管理与学习',icon:'BookOpen',clause:'2.2.17—2.2.18',description:'分类上传、发布、阅读、维护、下架与删除，保留操作记录。',sample:'BOOK-001～3 · 自制文本资料；不冒充500本正版图书交付。',steps:[
  {title:'分类上传与内容维护',role:'admin',person:'librarian',path:'/support/resources',clause:'2.2.17',description:'新增文本样例，维护标题、分类、来源与正文。'},
  {title:'发布供用户查看学习',role:'admin',person:'librarian',path:'/support/resources',clause:'2.2.17',description:'发布草稿，使其他角色可以阅读。'},
  {title:'查找、阅读与下载',role:'candidate',person:'learner',path:'/support/resources',clause:'2.2.17',description:'按名称或类别查找已发布资源，阅读并下载自制文本。'},
  {title:'下架、删除与日志',role:'admin',person:'librarian',path:'/support/resources',clause:'2.2.17',description:'下架废弃资源，再确认删除；相关操作保留审计。'},
  {title:'资源操作追溯',role:'admin',person:'organizer',path:'/support/permissions?tab=业务审计',clause:'2.2.17',description:'在业务审计中查询资料维护记录。'}]},
 {id:'integration',title:'数据共享与系统业务衔接',icon:'Cable',clause:'2.4.1—2.4.7',description:'以本地模拟接口连接员工、考务、题库资源与成绩数据。',sample:'固定来源业务ID用于重复同步去重；外部系统均未真实连接。',steps:[
  {title:'字段映射与模拟接收',role:'admin',person:'integrator',path:'/protocol/integration',clause:'2.4.1、2.4.3—2.4.4',description:'预览HR、考务、人社样例，确认后写入对应业务数据。'},
  {title:'同步考务计划与试题任务',role:'admin',person:'affairs',path:'/affairs/sessions',clause:'2.4.4',description:'检查同步创建的场次，并到命题计划查看对应任务。'},
  {title:'公开题库资源共享',role:'admin',person:'bank',path:'/bank/questions',clause:'2.4.1',description:'查看同步进入通用题库的合成草稿，经审核后使用。'},
  {title:'考试配卷与传统试卷配发',role:'admin',person:'affairs',path:'/protocol/papers',clause:'2.4.5',description:'查看机考关联与传统配发记录，下载考生卷。'},
  {title:'核定成绩回传模拟',role:'admin',person:'affairs',path:'/results/list',clause:'2.4.6',description:'发布核定成绩后发起模拟回传，记录原业务版本。'},
  {title:'交换回执与失败重试',role:'admin',person:'integrator',path:'/support/integrations',clause:'2.4.1—2.4.7',description:'查看交换明细、同键重试与对账回执。'}]}
]
