import type { Continuity } from './continuity'
import type { DemoPerson } from './identity'
import type { ProtocolData } from './protocol'
import type { CatalogNode } from './catalog'
export type Role = 'admin' | 'expert' | 'candidate' | 'marker'
export type QuestionType = '单选题' | '多选题' | '判断题' | '简答题' | '实操步骤题' | '评分表题'
export type QuestionStatus = '草稿' | '待初审' | '待复审' | '待终审' | '待入库' | '已入库' | '已退回' | '已停用'
export interface History { time: string; actor: string; action: string; note: string; version: number }
export interface Rubric { label: string; max: number }
export interface Question { module?:string; assignments?: Record<string,string>;
  id: string; title: string; type: QuestionType; kind: '理论' | '技能'; profession: string; level: string; subject: string; knowledge: string;
  bank: string; difficulty: string; status: QuestionStatus; author: string; version: number; options: string[]; answers: string[]; analysis: string;
  rubric: Rubric[]; preparation: string; venue: string; history: History[]; taskId?: string
}
export interface Plan { leadId?:string; reviewers?:Record<string,string>; id: string; name: string; profession: string; level: string; kind: string; target: number; expert: string; deadline: string; status: string; description: string }
export interface PaperQuestion { question: Question; score: number }
export interface Paper { id: string; name: string; version: number; status: string; questions: PaperQuestion[]; rule: string; created: string; overlap: number; report: string[] }
export interface Session { id: string; name: string; paperId: string; venue: string; room: string; date: string; status: string; candidates: number; duration: number; proctor: string; elapsedOffset: number }
export interface Attempt { personId?:string; ticket?:string; seat?:number; id: string; sessionId: string; candidate: string; anonymous: string; questions: PaperQuestion[]; answers: Record<string, string[]>; seq: Record<string, number>; marked: string[]; startedAt: number; offset: number; status: string; objective: number; subjective: number | null; scores: Record<string, number>; signature: string; submittedAt?: string; events: string[]; published: boolean; version: number }
export interface MarkRecord { questionThresholds?:number[]; thresholdScope?:'整卷'|'逐题'; questionIds?:string[]; finalDetails?:number[]; arbitratorId?:string; signatures?:Record<string,string>; reviewers?:string[]; revisions?:{time:string;reason:string;scores:Record<string,number>;signature:string}[]; rule?: string; threshold?: number; weights?: number[]; id: string; attemptId: string; anonymous: string; title: string; objective: number; max: number; answer: string; rubric: Rubric[]; scores: Record<string, number>; details: Record<string, number[]>; status: string; final: number | null; note: string; signature: string }
export interface Expert { id: string; name: string; org: string; profession: string; role: string; tasks: number; rate: number; status: string }
export interface Integration { id: string; system: string; object: string; direction: string; status: string; time: string; key: string; count: number; error: string }
export interface Resource { id: string; title: string; category: string; author: string; status: string; pages: number; content: string }
export interface Log { id: string; time: string; actor: string; module: string; action: string; object: string; result: string }
export interface SkillRecord { personId?:string; sessionId?:string; module?:string; assessorId?:string; batch?:string; venue?:string; assessor?:string; source?:string; questionSnapshot?:Question; id: string; candidate: string; questionId: string; scores: number[]; status: string; signature: string; note: string }
export interface State { continuity?:Continuity; people?:DemoPerson[];
  protocol?:ProtocolData; catalog?: CatalogNode[]; schema: number; questions: Question[]; plans: Plan[]; papers: Paper[]; sessions: Session[]; attempts: Attempt[]; marks: MarkRecord[]; experts: Expert[];
  integrations: Integration[]; resources: Resource[]; logs: Log[]; skills: SkillRecord[]; settings: { threshold: number; scoreRule: string; weights: number[]; late: number; early: number; faceInterval: number; autosave: number }; nodes: { id: string; name: string; parent: string }[]
}
