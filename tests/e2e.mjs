import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import XLSX from 'xlsx'
const browser = await chromium.launch({headless:true,...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:{})})
const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1})
const errors=[];const results=[]
page.on('pageerror',e=>errors.push(e.message))
const base=process.env.DEMO_URL||'http://127.0.0.1:5173/'
const actorForPath={'/authoring/plans':'李志远','/authoring/experts':'李志远','/authoring/tasks':'张明','/authoring/reviews':'李静','/authoring/editor':'张明','/bank/questions':'许库管','/bank/structure':'许库管','/papers':'孙强','/affairs/sessions':'赵考务','/affairs/monitor':'赵考务','/results/list':'赵考务','/results/analytics':'赵考务','/marking/tasks':'陈工','/marking/arbitration':'郑仲裁','/marking/skill':'钱考评','/marking/progress':'吴阅卷','/marking/history':'陈工','/support/resources':'林资料','/support/integrations':'接口维护员','/support/permissions':'李志远','/support/settings':'吴阅卷'}
const navigate=async(path)=>{if(actorForPath[path])await role(actorForPath[path]);await page.goto(base+'#'+path);await page.waitForTimeout(140)}
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hfplatform-demo-v1')||'null'))
async function role(label){label=({管理人员:"李志远",命审专家:"张明",考生:"演示考生01",阅卷评分:"陈工"})[label]||label;await page.locator('.user-button').click();await page.locator('.role-menu button').filter({hasText:label}).click();await page.waitForTimeout(120)}
async function shot(name){await page.waitForTimeout(350);await page.screenshot({path:`test-results/${name}.png`,fullPage:true})}
const ok=(name)=>{results.push(name);console.log('PASS',name)}
try{
  fs.mkdirSync('test-results',{recursive:true})
  await page.goto(base);await page.evaluate(()=>{localStorage.removeItem('hfplatform-demo-v1');sessionStorage.clear()});await page.reload();await page.waitForTimeout(400)
  await shot('admin-dashboard')
  const navByRole={
    '管理人员':['/workbench','/authoring/plans','/authoring/experts','/authoring/reviews','/bank/questions','/bank/structure','/papers','/affairs/sessions','/affairs/monitor','/results/list','/results/analytics','/support/resources','/support/integrations','/support/permissions','/support/settings'],
    '命审专家':['/workbench','/authoring/tasks','/authoring/editor','/authoring/reviews','/bank/questions','/papers','/authoring/history','/support/resources'],
    '考生':['/workbench','/candidate/exams','/candidate/reports','/support/resources','/candidate/profile','/candidate/help'],
    '阅卷评分':['/workbench','/marking/tasks','/marking/arbitration','/marking/skill','/marking/progress','/marking/history','/support/resources']
  }
  for(const [name,paths]of Object.entries(navByRole)){
    await role(name)
    for(const path of paths){await navigate(path);assert.ok((await page.locator('main').innerText()).length>30,`${name} ${path} empty`);assert.equal(await page.locator('vite-error-overlay').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`horizontal overflow ${path}`)}
  }
  ok('按职责切换人员后各业务入口均可渲染，无页面错误或桌面横向溢出')
  await role('管理人员');await navigate('/authoring/plans')
  await page.getByRole('button',{name:'新建命题计划'}).click();await page.getByPlaceholder('如：2026年装配工理论题库专项开发').fill('E2E-命题闭环计划');await page.getByRole('button',{name:'保存计划',exact:true}).click();
  await page.getByRole('row').filter({hasText:'E2E-命题闭环计划'}).getByRole('button',{name:'发布任务'}).click();
  assert.equal((await state()).plans.find(p=>p.name==='E2E-命题闭环计划').status,'进行中')
  await role('命审专家');await navigate('/authoring/tasks');await page.getByRole('row').filter({hasText:'E2E-命题闭环计划'}).getByRole('button',{name:'开始命题'}).click()
  await page.getByPlaceholder('请输入清晰、完整的题目内容…').fill('E2E：规范操作前应核对什么？')
  for(const [i,label]of ['受控工艺文件','个人猜测','无关材料','任意参数'].entries())await page.getByRole('textbox',{name:'选项'+String.fromCharCode(65+i),exact:true}).fill(label)
  await page.getByPlaceholder('补充解析、评分依据或参考标准…').fill('以受控工艺文件为准。')
  await page.getByRole('button',{name:'保存并提交初审'}).click()
  const questionId=(await state()).questions.find(q=>q.title==='E2E：规范操作前应核对什么？').id
  await navigate('/authoring/reviews')
  for(const stage of ['待初审','待复审','待终审','待入库']){
    await role(({'待初审':'李静','待复审':'刘伟','待终审':'周岚','待入库':'周负责人'})[stage]);await page.goto(base+'#/authoring/reviews');await page.waitForTimeout(100);await page.locator('.tabs button').filter({hasText:stage}).click()
    await page.getByRole('row').filter({hasText:'E2E：规范操作前应核对什么？'}).getByRole('button').click()
    await page.getByRole('dialog').getByRole('button',{name:stage==='待入库'?'确认入库':'审核通过',exact:true}).click()
  }
  assert.equal((await state()).questions.find(q=>q.id===questionId).status,'已入库')
  ok('计划发布 → 专家任务 → 新题命制 → 三审 → 入库')
  await navigate('/papers');await page.getByRole('button',{name:'新建规则组卷'}).click();await page.getByRole('dialog').getByLabel('试卷名称').fill('E2E-AB演示卷');await page.getByRole('button',{name:'生成并校验'}).click();
  await page.getByRole('dialog').getByRole('button',{name:'冻结试卷',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'关闭',exact:true}).click();
  const papers=(await state()).papers.filter(p=>p.name.startsWith('E2E-AB'));assert.equal(papers.length,2);assert.equal(papers[0].status,'已冻结');assert.equal(papers[0].questions.length,20)
  await role('管理人员');await navigate('/affairs/sessions');await page.getByRole('row').filter({hasText:'EXAM-002'}).getByRole('button',{name:'配卷',exact:true}).click();await page.getByRole('dialog').getByLabel('选择已冻结试卷').selectOption(papers[0].id);await page.getByRole('button',{name:'确认配发并发布'}).click()
  assert.equal((await state()).sessions.find(e=>e.id==='EXAM-002').paperId,papers[0].id)
  ok('AB组卷 → 冻结 → 场次配卷（来源和题量规则已通过单测）')
  await role('考生');await navigate('/candidate/exams');await page.locator('.exam-card').filter({hasText:'第三季度职业技能等级认定'}).getByRole('button',{name:'进入考前检查'}).click()
  await page.getByRole('button',{name:'模拟核验',exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'确认并开始考试'}).click();await page.waitForTimeout(200)
  await page.locator('.answer-options button').first().click();await page.getByRole('button',{name:'标记本题',exact:true}).click();
  let attempt=(await state()).attempts[0];assert.equal(Object.keys(attempt.answers).length,1);assert.equal(attempt.marked.length,1)
  const order=attempt.questions.map(q=>q.question.id);await page.reload();await page.waitForTimeout(200);assert.deepEqual((await state()).attempts[0].questions.map(q=>q.question.id),order);assert.equal(await page.locator('.answer-options .chosen').count(),1)
  await page.getByRole('checkbox',{name:'模拟保存失败'}).check();await page.locator('.answer-options button').nth(1).click();assert.ok((await page.locator('.save-indicator').innerText()).includes('待同步'));await page.getByRole('checkbox',{name:'模拟保存失败'}).uncheck();await page.getByRole('button',{name:'重试未同步答案'}).click();assert.ok((await page.locator('.save-indicator').innerText()).includes('已保存'))
  await shot('candidate-answer');await page.getByRole('button',{name:'推进16分钟'}).click();await page.getByRole('button',{name:'提交答卷',exact:true}).click();await page.getByPlaceholder('请输入签名，确认本人提交').fill('演示考生01');await page.getByRole('button',{name:'确认交卷',exact:true}).click();assert.equal((await state()).attempts[0].status,'已核定')
  ok('考前核验 → 答题 → 标记 → 刷新续考 → 保存失败重试 → 交卷判分')
  await role('阅卷评分');await navigate('/marking/tasks')
  await page.getByRole('row').filter({hasText:'N-0268'}).getByRole('button',{name:'开始阅卷'}).click();
  for(let i=0;i<3;i++)await page.getByRole('dialog').locator('.rubric-score input').nth(i).fill('6')
  await page.getByPlaceholder('请输入专家签名').fill('评委一');await page.getByRole('button',{name:'提交本次评分'}).click()
  await role('赵敏');await page.goto(base+'#/marking/tasks');await page.waitForTimeout(150);await page.getByRole('row').filter({hasText:'N-0268'}).getByRole('button',{name:'开始阅卷'}).click();for(const [i,value]of ['9','9','8'].entries())await page.getByRole('dialog').locator('.rubric-score input').nth(i).fill(value)
  await page.getByPlaceholder('请输入专家签名').fill('评委二');await shot('marker-review');await page.getByRole('button',{name:'提交本次评分'}).click();assert.equal((await state()).marks.find(m=>m.id==='MARK-001').status,'待仲裁')
  await navigate('/marking/arbitration');await page.getByRole('row').filter({hasText:'N-0268'}).getByRole('button',{name:'开始仲裁'}).click();await page.getByRole('dialog').getByLabel('仲裁最终分').fill('22');await page.getByPlaceholder('请说明依据与定分原因').fill('复核三个评分项，按演示评分标准核定22分。');await page.getByPlaceholder('请输入专家签名').fill('仲裁专家');await page.getByRole('button',{name:'确认仲裁并核定'}).click();assert.equal((await state()).marks.find(m=>m.id==='MARK-001').final,22)
  ok('双评18/26 → 超差仲裁 → 主观22分核定')
  await navigate('/marking/skill');await page.getByRole('button',{name:'确认提交现场评分'}).click();assert.equal((await state()).skills[0].status,'已提交');assert.equal((await state()).skills[0].scores.reduce((a,b)=>a+b),88)
  await page.setViewportSize({width:390,height:844});await shot('mobile-skill');assert.ok(await page.locator('.sidebar').evaluate(e=>e.getBoundingClientRect().right<=1),'mobile sidebar must be hidden');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'mobile skill overflow');await page.setViewportSize({width:1440,height:1050});await page.waitForTimeout(300)
  ok('现场技能评分88分、操作留痕与390px移动布局')
  await role('管理人员');await navigate('/results/list');await page.getByRole('row').filter({hasText:'N-0268'}).getByRole('button',{name:'发布',exact:true}).click();await page.getByRole('row').filter({hasText:'N-0268'}).getByRole('button',{name:'回传',exact:true}).click();await navigate('/support/integrations');await page.getByRole('row').filter({hasText:'RESULT-MARK-001-V1'}).getByRole('button',{name:'原键重试'}).click();assert.equal((await state()).integrations.find(i=>i.key==='RESULT-MARK-001-V1').status,'成功')
  ok('成绩发布 → 模拟回传失败 → 原幂等键重试成功')
  await navigate('/bank/questions');await page.getByPlaceholder('输入题干或题号…').fill('E2E：规范操作前应核对什么？');assert.equal(await page.locator('tbody tr').count(),1);await shot('bank-resources')
  await navigate('/support/resources');await page.getByRole('button',{name:'阅读资料'}).first().click();assert.ok((await page.locator('.reading-content').innerText()).length>40);await page.getByRole('button',{name:'完成阅读'}).click()
  ok('题库搜索与学习资料阅读')
  await navigate('/bank/questions');await page.getByRole('button',{name:'导入试题',exact:true}).click()
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{题干:'E2E导入：操作前应检查工具吗？',题型:'判断题',知识点:'工艺规范',答案:'A'}]),'试题导入')
  const buffer=XLSX.write(wb,{type:'buffer',bookType:'xlsx'})
  await page.getByRole('dialog').locator('input[type=file]').setInputFiles({name:'test.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer})
  await page.getByRole('button',{name:'确认导入草稿'}).click();assert.equal((await state()).questions.find(q=>q.title.startsWith('E2E导入')).status,'草稿')
  await page.getByRole('button',{name:'导入试题',exact:true}).click();await page.getByRole('dialog').locator('input[type=file]').setInputFiles({name:'duplicate.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer})
  await page.getByText('第2行：题干完全重复').waitFor();assert.equal(await page.getByRole('button',{name:'确认导入草稿'}).isDisabled(),true);await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click()
  await role('孙强');await page.goto(base+'#/bank/questions');await page.waitForTimeout(150);await page.locator('tbody input[type=checkbox]:enabled').first().check();await page.getByRole('button',{name:'按选题固定组卷'}).click();assert.equal((await state()).papers[0].rule,'固定组卷 · 自动均分100分')
  ok('Excel真实解析导入、重复行拒绝与手工固定组卷')
  await page.setViewportSize({width:1280,height:720});await navigate('/authoring/reviews');await shot('projector-reviews');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  assert.deepEqual(errors,[])
  fs.writeFileSync('test-results/e2e-results.json',JSON.stringify({time:new Date().toISOString(),passed:results.length,results,pageErrors:errors},null,2))
  console.log(`完成：${results.length}组验证，页面错误0`)
}catch(error){await shot('failure');fs.writeFileSync('test-results/e2e-failure.txt',String(error));console.error(error);process.exitCode=1}finally{await browser.close()}
