import type { Question, PaperQuestion, QuestionStatus } from './types'
export function nextReview(status: QuestionStatus): QuestionStatus {
  const order: QuestionStatus[] = ['待初审', '待复审', '待终审', '待入库', '已入库']
  const index = order.indexOf(status)
  if (index < 0 || index === order.length - 1) throw new Error('当前状态不允许审核或入库')
  return order[index + 1]!
}
export function scoreObjective(q: Question, answer: string[], max: number) {
  if (!['单选题', '多选题', '判断题'].includes(q.type)) return 0
  return [...new Set(answer)].sort().join('|') === [...q.answers].sort().join('|') && answer.length > 0 ? max : 0
}
export function overlap(a: PaperQuestion[], b: PaperQuestion[]) {
  const x = new Set(a.map(q => q.question.id)); const y = new Set(b.map(q => q.question.id))
  if (!x.size || !y.size) return 0
  return Math.round([...x].filter(id => y.has(id)).length / Math.min(x.size, y.size) * 100)
}
export function seededShuffle<T>(items: T[], seed: number) {
  const result = [...items]; let s = seed >>> 0
  for (let i = result.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [result[i], result[j]] = [result[j]!, result[i]!] }
  return result
}
export function generatePaper(questions: Question[], options: { seed: number; count: number; excluded?: string[]; difficulty?: string; profession?: string; banks?: string[] }): PaperQuestion[] {
  if (!Number.isInteger(options.count) || options.count < 4 || options.count > 100 || options.count % 4) throw new Error('题量须为4的倍数，范围4～100')
  const available = questions.filter(q => q.status === '已入库' && q.kind === '理论' && !options.excluded?.includes(q.id) && (!options.profession || q.profession === options.profession) && (!options.difficulty || options.difficulty === '不限' || q.difficulty === options.difficulty))
  const unique = [...new Map(available.map(q => [q.id, q])).values()]
  const banks = options.banks?.length ? options.banks : ['母题库', '子题库', '通用题库']
  const types = [{ type: '单选题', count: options.count / 2, total: 40 }, { type: '多选题', count: options.count / 4, total: 40 }, { type: '判断题', count: options.count / 4, total: 20 }]
  const selected: PaperQuestion[] = []
  const ratios = banks.length === 3 ? [.5, .3, .2] : banks.map(() => 1 / banks.length)
  function allocate(total: number, weights: number[]) {
    const quotas=weights.map(r=>Math.floor(total*r))
    const rank=weights.map((r,i)=>({i,rest:total*r-quotas[i]!})).sort((a,b)=>b.rest-a.rest||a.i-b.i)
    const left=total-quotas.reduce((a,b)=>a+b,0)
    for(let n=0;n<left;n++) quotas[rank[n%rank.length]!.i]!++
    return quotas
  }
  const remaining=allocate(options.count,ratios)
  for (const [index, rule] of types.entries()) {
    const rest=remaining.reduce((a,b)=>a+b,0)
    const quotas=allocate(rule.count,remaining.map(r=>r/rest))
    for (const [bi, bank] of banks.entries()) {
      const pool = seededShuffle(unique.filter(q => q.type === rule.type && q.bank === bank), options.seed + index * 13 + bi)
      if (pool.length < quotas[bi]!) throw new Error(`${bank} · ${rule.type}需要${quotas[bi]}道，符合条件仅${pool.length}道。请调整规则，不会自动降低约束。`)
      pool.slice(0, quotas[bi]).forEach(q => selected.push({ question: structuredClone(q), score: rule.total / rule.count }))
      remaining[bi]!-=quotas[bi]!
    }
  }
  return selected
}
export function validatePaper(items: PaperQuestion[]) {
  if (!items.length) throw new Error('试卷不能为空')
  if (new Set(items.map(q => q.question.id)).size !== items.length) throw new Error('同一试卷存在重复题目')
  if (items.some(q => q.question.status !== '已入库')) throw new Error('仅能使用已入库题目')
  if (items.some(q => !Number.isFinite(q.score) || q.score <= 0)) throw new Error('每题分值必须大于0')
  const total = items.reduce((a, q) => a + q.score, 0)
  if (Math.abs(total - 100) > .001) throw new Error(`当前总分${total}，须调整到100分`)
  return [`总分 ${Math.round(total)} 分`, `题量 ${items.length} 道`, '卷内重复 0 道', '全部题目已审核入库', `知识点覆盖 ${new Set(items.map(q => q.question.knowledge)).size} 个`, ...['母题库', '子题库', '通用题库'].map(b => `${b} ${items.filter(q => q.question.bank === b).length} 道`)]
}
export function aggregateScores(scores: number[], rule: string, weights: number[] = []) {
  if (!scores.length || scores.some(s => !Number.isFinite(s) || s < 0)) throw new Error('评分数据无效')
  if (rule === '去极值平均') { if (scores.length < 3) throw new Error('去极值平均至少需要3位评委'); const middle = [...scores].sort((a,b) => a-b).slice(1,-1); return Math.round(middle.reduce((a,b) => a+b,0)/middle.length*100)/100 }
  if (rule === '权重评分') { if (weights.length !== scores.length || weights.some(w => w < 0) || Math.abs(weights.reduce((a,b) => a+b,0)-1)>.00001) throw new Error('评委权重数量须一致，且总和须为1'); return Math.round(scores.reduce((a,s,i) => a+s*weights[i]!,0)*100)/100 }
  return Math.round(scores.reduce((a,b) => a+b,0)/scores.length*100)/100
}
export function canEnter(elapsedSeconds: number, lateMinutes = 30) { return elapsedSeconds >= 0 && elapsedSeconds <= lateMinutes * 60 }
export function canSubmit(elapsedSeconds: number, earlyMinutes = 15) { return elapsedSeconds >= earlyMinutes * 60 }
export function candidateQuestions(items: PaperQuestion[]) { return items.map(({question, score}) => ({id: question.id, title: question.title, type: question.type, options: question.options, score, knowledge: question.knowledge})) }
