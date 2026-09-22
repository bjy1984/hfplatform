export interface Distribution { id:string; paperId:string; batch:string; receiver:string; time:string; mode:string }
export interface Staff { id:string; name:string; identity:string; profession:string; level:string; source:string }
export interface ProtocolData { staff:Staff[]; distributions:Distribution[]; policy:{ipRange:string;faceInterval:number;faceBefore:boolean;faceDuring:boolean;faceAfter:boolean;preventSwitch:boolean;bindSeat:boolean}; exchanges:{key:string;system:string;objects:string[];time:string}[] }
export function createProtocol():ProtocolData{return {staff:[{id:'DEMO-0001',name:'演示考生01',identity:'MOCK-ID-0001',profession:'航空发动机装配工',level:'三级 / 高级工',source:'本地合成'}],distributions:[],policy:{ipRange:'192.168.10.0/24',faceInterval:10,faceBefore:true,faceDuring:true,faceAfter:false,preventSwitch:true,bindSeat:true},exchanges:[]}}
export const exchangeSamples={
 '集团HR':{key:'HR-DEMO-V2',description:'同步2名合成员工，按员工编码更新，姓名不作为唯一键。',fields:[['employeeCode','人员编码'],['name','姓名'],['identityNo','合成身份标识'],['professionCode','工种'],['skillLevel','技能等级']],rows:[{employeeCode:'DEMO-0001',name:'演示考生01',identityNo:'MOCK-ID-0001',professionCode:'航空发动机装配工',skillLevel:'三级 / 高级工'},{employeeCode:'DEMO-0002',name:'演示考生02',identityNo:'MOCK-ID-0002',professionCode:'航空发动机检验工',skillLevel:'三级 / 高级工'}]},
 '原考务系统':{key:'AFFAIRS-DEMO-V2',description:'同步一个未配卷场次和一项对应命题计划，不自动跳过审核或配卷。',fields:[['examCode','场次ID'],['title','考试名称'],['room','考场'],['proctor','监考人员']],rows:[{examCode:'EXT-EXAM-001',title:'外部同步 · 装配工认定模拟场',room:'第二机考室',proctor:'赵敏'}]},
 '人社题库':{key:'PUBLIC-DEMO-V1',description:'接收一条公开题库合成资源为通用题库草稿；同一来源版本重复同步不新增。可另行导出共享样例。',fields:[['resourceCode','来源题号'],['version','来源版本'],['title','试题题干']],rows:[{resourceCode:'PUBLIC-DEMO-001',version:1,title:'公开题库交换样例：作业记录应真实完整吗？'}]}
}
export type ExchangeSystem=keyof typeof exchangeSamples
