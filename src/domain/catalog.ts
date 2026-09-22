import type { Question } from './types'
export type CatalogKind = 'profession' | 'level' | 'subject' | 'knowledge'
export interface CatalogNode { id:string; parentId:string|null; name:string; kind:CatalogKind; disabled?:boolean }
export const catalogLabels:Record<CatalogKind,string>={profession:'职业工种',level:'技能等级',subject:'科目',knowledge:'知识点'}
export const catalogKinds:CatalogKind[]=['profession','level','subject','knowledge']
export function catalogPath(nodes:CatalogNode[],id:string|null):CatalogNode[]{
 const path:CatalogNode[]=[];const seen=new Set<string>();let node=nodes.find(n=>n.id===id)
 while(node&&!seen.has(node.id)){seen.add(node.id);path.unshift(node);node=nodes.find(n=>n.id===node!.parentId)}return path
}
export function matchesCatalog(q:Question,nodes:CatalogNode[],id:string|null){return catalogPath(nodes,id).every(n=>q[n.kind]===n.name)}
export function catalogActive(nodes:CatalogNode[],id:string){return catalogPath(nodes,id).every(n=>!n.disabled)}
export function createCatalog(questions:Question[],legacy:{name:string;parent:string}[]=[]):CatalogNode[]{
 const nodes:CatalogNode[]=[]
 function insert(values:string[]){let parentId:string|null=null;values.forEach((name,i)=>{let n=nodes.find(n=>n.parentId===parentId&&n.name===name);if(!n){n={id:`CAT-${nodes.length+1}`,parentId,name,kind:catalogKinds[i]!};nodes.push(n)}parentId=n.id})}
 questions.forEach(q=>insert(catalogKinds.map(k=>q[k])))
 if(questions[0])legacy.forEach(n=>insert([questions[0]!.profession,questions[0]!.level,n.parent,n.name]))
 return nodes
}
export function catalogLeaves(nodes:CatalogNode[],scope:Partial<Record<CatalogKind,string>>={}){return nodes.filter(n=>n.kind==='knowledge'&&catalogActive(nodes,n.id)&&catalogPath(nodes,n.id).every(p=>!scope[p.kind]||scope[p.kind]===p.name))}
