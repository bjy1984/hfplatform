import type { State, Question, QuestionType } from '../domain/types'
import { generatePaper, validatePaper } from '../domain/rules'
export const professions = ['航空发动机装配工', '航空发动机检验工']
export const knowledgePoints = ['安全与质量规范', '装配工艺基础', '精密测量技术', '零部件识别', '工具与设备使用', '质量检验与记录']
const samples: [string, string[]][] = [
  ['进入装配作业区前，应首先完成哪项准备工作？', ['确认安全防护与作业条件', '直接拆解零部件', '省略工具检查', '关闭所有记录设备']],
  ['零部件装配前，核对零件标识的主要目的是什么？', ['保证零件与工艺文件一致', '缩短休息时间', '替代质量检验', '减少作业记录']],
  ['使用测量工具前，应优先确认哪项信息？', ['检定状态与有效期', '包装颜色', '存放箱品牌', '购买日期']],
  ['对发现的异常零部件，正确的处理方式是？', ['隔离标识并按流程反馈', '继续装配', '自行修改合格记录', '与合格件混放']],
  ['装配过程中的力矩参数应以什么作为依据？', ['受控工艺文件', '个人经验', '上一班次口述', '工具外观']],
  ['完成作业后，过程记录应如何处理？', ['如实记录并按要求归档', '只记录合格结果', '完成后删除', '由他人任意补签']],
]
export function createSeed(): State {
  const stamp = '2026-09-21 09:00'
  const questions: Question[] = []
  const types: QuestionType[] = ['单选题', '多选题', '判断题']
  for (let i=0;i<180;i++) {
    const type = types[Math.floor(i/60)]!; const sample = samples[i%6]!; const bank = ['母题库','子题库','通用题库'][Math.floor(i/20)%3]!
    questions.push({id:`Q-${String(i+1).padStart(4,'0')}`,title:type==='判断题'?`【演示情境 ${i+1}】作业过程应按照受控工艺文件执行，并保留完整记录。`:`【演示情境 ${i+1}】${sample[0]}`,type,kind:'理论',profession:professions[0]!,level:'三级 / 高级工',subject:'专业理论',knowledge:knowledgePoints[i%6]!,bank,difficulty:['容易','中等','较难'][i%3]!,status:'已入库',author:['张明','李静','陈工'][i%3]!,version:1,options:type==='判断题'?['正确','错误']:type==='多选题'?['核对工艺文件','检查工具有效性','忽略安全防护','确认零件状态']:sample[1] as string[],answers:type==='多选题'?['0','1','3']:['0'],analysis:'演示题：按受控工艺文件进行作业准备与质量控制。该题仅用于功能演示，不作为实际职业认定依据。',rubric:[],preparation:'',venue:'',history:[{time:stamp,actor:'系统初始化',action:'合成题目入库',note:'演示数据',version:1}]})
  }
  for(let i=0;i<6;i++) questions.push({id:`SK-${i+1}`,title:['发动机部件装配与质量检查','精密测量与结果记录','装配工具检查与操作'][i%3]!,type:i%2?'评分表题':'实操步骤题',kind:'技能',profession:professions[i%2]!,level:'三级 / 高级工',subject:'操作技能',knowledge:knowledgePoints[i%6]!,bank:'子题库',difficulty:'中等',status:'已入库',author:'王立',version:1,options:[],answers:[],analysis:'按评分项目逐项评分，记录操作依据。',rubric:[{label:'作业准备与安全检查',max:20},{label:'操作步骤与过程规范',max:30},{label:'操作结果与质量记录',max:50}],preparation:'穿戴防护用品，核对任务单，检查量具与工具。',venue:'模拟装配台1套、工具箱1套、合成任务单与量具。',history:[{time:stamp,actor:'王立',action:'终审入库',note:'技能评分示例',version:1}]})
  for(let i=0;i<5;i++){const q=structuredClone(questions[i]!);q.id=`DRAFT-${i+1}`;q.title=`待开发 · ${samples[i]![0]}`;q.status=['待初审','待复审','待终审','草稿','已退回'][i] as Question['status'];q.author='张明';q.taskId='PLAN-001';q.history=[{time:stamp,actor:'张明',action:'提交命题',note:'等待专家处理',version:1}];questions.push(q)}
  const qa=generatePaper(questions,{seed:21,count:20});const qb=generatePaper(questions,{seed:42,count:20,excluded:qa.map(q=>q.question.id)})
  return {
    schema:1,questions,
    plans:[{id:'PLAN-001',name:'2026年第三季度装配工理论题库建设',profession:professions[0]!,level:'三级 / 高级工',kind:'理论',target:30,expert:'张明',deadline:'2026-10-15',status:'进行中',description:'围绕安全规范、装配工艺、质量检验开展理论题库开发。'}, {id:'PLAN-002',name:'发动机检验工技能题库专项修订',profession:professions[1]!,level:'四级 / 中级工',kind:'技能',target:12,expert:'王立',deadline:'2026-10-20',status:'待发布',description:'完善评分标准与考场准备要求。'}, {id:'PLAN-003',name:'通用安全知识题库年度更新',profession:professions[0]!,level:'三级 / 高级工',kind:'理论',target:20,expert:'张明',deadline:'2026-10-25',status:'进行中',description:'合成通用题库开发任务。'}],
    papers:[{id:'PAPER-A',name:'航空发动机装配工（三级）理论试卷 A',version:1,status:'已配发',questions:qa,rule:'1+X+Y · 20题 · 100分',created:stamp,overlap:0,report:validatePaper(qa)},{id:'PAPER-B',name:'航空发动机装配工（三级）理论试卷 B',version:1,status:'已冻结',questions:qb,rule:'AB卷 · 卷间重复率0%',created:stamp,overlap:0,report:validatePaper(qb)}],
    sessions:[{id:'EXAM-001',name:'2026年第三季度职业技能等级认定 · 理论考试',paperId:'PAPER-A',venue:'集团培训中心',room:'第一机考室',date:'2026-09-21 09:00',status:'进行中',candidates:30,duration:90,proctor:'赵敏',elapsedOffset:0},{id:'EXAM-002',name:'发动机检验工技能认定 · 预备场次',paperId:'',venue:'模拟技能考场',room:'实操工位A',date:'2026-09-28 14:00',status:'待配卷',candidates:12,duration:120,proctor:'刘伟',elapsedOffset:0}],
    attempts:[],
    marks:[{id:'MARK-001',attemptId:'HIST-001',anonymous:'N-0268',title:'装配过程异常分析与处置',objective:56,max:30,answer:'首先停止当前工序并隔离异常零件，核对工艺文件及零件编号，复测关键尺寸并保留记录，按质量流程提交复核。经授权处置后再继续作业。',rubric:[{label:'异常识别准确',max:10},{label:'处置流程合理',max:10},{label:'记录与追溯完整',max:10}],scores:{},details:{},status:'待阅卷',final:null,note:'',signature:''},{id:'MARK-002',attemptId:'HIST-002',anonymous:'N-0269',title:'质量问题原因分析',objective:52,max:30,answer:'依据工艺卡与检验记录定位异常工序，复核装配参数，分析工具、零件和操作因素，并提出改进措施。',rubric:[{label:'原因分析',max:10},{label:'措施合理',max:10},{label:'记录完整',max:10}],scores:{'评委一':18,'评委二':26},details:{'评委一':[6,6,6],'评委二':[9,9,8]},status:'待仲裁',final:null,note:'双评差值8分，超过演示阈值5分。',signature:''},{id:'MARK-003',attemptId:'HIST-003',anonymous:'N-0270',title:'装配质量记录规范',objective:60,max:30,answer:'完整记录过程参数，保证数据真实可追溯。',rubric:[{label:'记录规范',max:15},{label:'追溯完整',max:15}],scores:{'评委一':24,'评委二':24},details:{'评委一':[12,12],'评委二':[12,12]},status:'已核定',final:24,note:'双评结果一致。',signature:'演示评委'}],
    experts:['张明','李静','王立','陈工','赵敏','刘伟','周岚','孙强'].map((name,i)=>({id:`EXP-${i+1}`,name,org:i%2?'模拟第二单位':'模拟第一单位',profession:professions[i%2]!,role:['命题 / 初审','复审 / 终审','技能考评','阅卷 / 仲裁'][i%4]!,tasks:[3,2,2,1,1,2,1,0][i]!,rate:90+i,status:'已授权'})),
    integrations:[{id:'SYNC-001',system:'集团HR',object:'合成人员 30 条',direction:'接收',status:'成功',time:stamp,key:'HR-MOCK-001',count:1,error:''},{id:'SYNC-002',system:'原考务系统',object:'EXAM-001 场次',direction:'接收',status:'成功',time:stamp,key:'AFFAIRS-MOCK-001',count:1,error:''},{id:'SYNC-003',system:'集团认定系统',object:'历史成绩版本V1',direction:'发送',status:'失败',time:stamp,key:'RESULT-HIST-V1',count:1,error:'模拟接收端超时，可使用原幂等键重试。'}],
    resources:[{id:'BOOK-001',title:'装配作业安全与质量控制',category:'工业技术',author:'平台自制演示资料',status:'已发布',pages:12,content:'本资料为合成演示内容。\n\n一、作业准备\n确认作业环境、工具状态与受控工艺文件。\n\n二、过程控制\n遵循工艺要求，及时记录关键参数。发现异常先隔离再反馈。\n\n三、质量追溯\n保存检验记录与作业过程信息，确保问题可追溯。'},{id:'BOOK-002',title:'职业技能认定学习指南',category:'学习指南',author:'平台自制演示资料',status:'已发布',pages:8,content:'一、考前准备\n熟悉考试流程与操作方式。\n二、答题须知\n关注保存状态和剩余时间，按提示确认交卷。\n三、成绩查询\n最终结果以发布后的成绩为准。'},{id:'BOOK-003',title:'精密测量基础知识',category:'智能制造',author:'平台自制演示资料',status:'草稿',pages:16,content:'测量工具使用前应核对有效期、量程与环境条件。'}],
    logs:[{id:'LOG-001',time:stamp,actor:'系统',module:'演示环境',action:'初始化',object:'scenario-v1',result:'成功'}],
    skills:[{id:'SKILL-001',candidate:'演示考生01',questionId:'SK-1',scores:[18,26,44],status:'待评分',signature:'',note:''},{id:'SKILL-002',candidate:'演示考生02',questionId:'SK-2',scores:[0,0,0],status:'待评分',signature:'',note:''}],
    settings:{threshold:5,scoreRule:'平均分',weights:[.5,.5],late:30,early:15,faceInterval:10,autosave:3},
    nodes:knowledgePoints.map((name,i)=>({id:`KP-${i+1}`,name,parent:'专业理论'}))
  }
}
