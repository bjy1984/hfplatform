import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:{})})
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
const base=process.env.DEMO_URL||'http://127.0.0.1:5173/'
const nav=async path=>{await page.goto(base+'#'+path);await page.waitForTimeout(100)}
async function person(name){await page.locator('.user-button').click();await page.locator('.role-menu button').filter({has:page.locator('span')}).filter({hasText:name}).click();await page.waitForTimeout(100)}
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hfplatform-demo-v1')||'null'))
const store=async(fn,args)=>page.evaluate(async({fn,args})=>{const {usePlatform}=await import('/src/stores/platform.ts');const s=usePlatform();return new Function('s','args',fn)(s,args)},{fn,args})
try{
 fs.mkdirSync('test-results',{recursive:true});await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();await page.waitForTimeout(250)
 const names=await page.evaluate(async()=>{const {createPeople}=await import('/src/domain/identity.ts');return createPeople().map(p=>p.name)})
 let count=0
 for(const name of names){await person(name);const paths=await page.locator('nav a').evaluateAll(a=>a.map(n=>n.getAttribute('href').slice(1)));for(const path of paths){await nav(path);assert.equal(new URL(page.url()).hash,'#'+path,`${name} ${path} redirected`);assert.ok((await page.locator('main').innerText()).length>20);assert.equal(await page.locator('vite-error-overlay').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`overflow ${name} ${path}`);count++}}
 console.log('PASS all personnel navigation',names.length,count)
 await person('张明');await nav('/authoring/tasks');await page.screenshot({path:'test-results/person-author.png',fullPage:true})
 await store("const q=s.data.questions.find(q=>q.id==='DRAFT-1');q.status='草稿';s.submitQuestion(q.id)")
 for(const [name,next] of [['李静','待复审'],['刘伟','待终审'],['周岚','待入库'],['周负责人','已入库']]){
  await person(name);await nav('/authoring/reviews');const row=page.locator('tbody tr').filter({hasText:'DRAFT-1'});assert.equal(await row.count(),1);await row.getByRole('button').click();await page.locator('.modal textarea').fill('按标准审核通过');await page.locator('.modal footer').getByRole('button',{name:next==='已入库'?'确认入库':'审核通过',exact:true}).click();assert.equal((await state()).questions.find(q=>q.id==='DRAFT-1').status,next)
 }
 console.log('PASS authoring handoff through four assigned personnel')
 await person('张明');await nav('/authoring/reviews');assert.equal(new URL(page.url()).hash,'#/workbench')
 // end-to-end UI scoring uses current identity, no reviewer impersonation select
 for(const [name,values] of [['陈工',[6,6,6]],['赵敏',[9,9,8]]]){
  await person(name);await nav('/marking/tasks');await page.locator('tbody tr').filter({hasText:'N-0268'}).getByRole('button').click();assert.equal(await page.locator('.modal select').count(),0);const inputs=page.locator('.modal input[type=number]');for(let i=0;i<3;i++)await inputs.nth(i).fill(String(values[i]));await page.locator('.modal input[placeholder="请输入专家签名"]').fill(name);await page.getByRole('button',{name:'提交本次评分',exact:true}).click()
 }
 assert.equal((await state()).marks.find(m=>m.id==='MARK-001').status,'待仲裁')
 await person('郑仲裁');await nav('/marking/arbitration');await page.locator('tbody tr').filter({hasText:'N-0268'}).getByRole('button').click();await page.locator('.modal input[type=number]').fill('22');await page.locator('.modal textarea').fill('按评分标准复核');await page.locator('.modal input[placeholder="请输入专家签名"]').fill('郑仲裁');await page.getByRole('button',{name:'确认仲裁并核定'}).click();assert.equal((await state()).marks.find(m=>m.id==='MARK-001').final,22)
 console.log('PASS separate reviewers and assigned arbitration')
 await person('李志远');await nav('/authoring/experts');await page.locator('.expert-card').filter({hasText:'李静'}).getByRole('button').click();await page.locator('.modal select').selectOption('false');await page.getByRole('button',{name:'保存授权',exact:true}).click();await person('李静');assert.equal(await page.locator('nav a[href="#/authoring/reviews"]').count(),0);await nav('/authoring/reviews');assert.equal(new URL(page.url()).hash,'#/workbench');await page.reload();assert.equal(await page.locator('nav a[href="#/authoring/reviews"]').count(),0)
 console.log('PASS disabled authorization persists and blocks route')
 await person('钱考评');await nav('/marking/skill');assert.equal(await page.getByText('考评员签名（演示文本留痕）').count(),0);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);assert.ok(await page.locator('.sidebar').evaluate(e=>e.getBoundingClientRect().right<=1));await page.screenshot({path:'test-results/person-skill-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
 await page.setViewportSize({width:1440,height:1000});await person('周负责人');await page.screenshot({path:'test-results/person-lead.png',fullPage:true})
 await person('学习用户01');await nav('/candidate/exams');assert.equal(new URL(page.url()).hash,'#/workbench')
 assert.deepEqual(errors,[]);console.log('PASS mobile layout, restricted learning identity, no runtime errors')
 fs.writeFileSync('test-results/identity-results.json',JSON.stringify({personnel:names.length,navigationVisits:count,errors,passed:true},null,2))
}finally{await browser.close()}
