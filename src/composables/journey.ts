import { ref } from 'vue'
const saved=(()=>{try{return JSON.parse(sessionStorage.getItem('hf-journey')||'null')}catch{return null}})()
export const journeyContext=ref<{id:string;step:number}|null>(saved)
export function setJourney(id:string,step:number){journeyContext.value={id,step};sessionStorage.setItem('hf-journey',JSON.stringify(journeyContext.value))}
export function clearJourney(){journeyContext.value=null;sessionStorage.removeItem('hf-journey')}
