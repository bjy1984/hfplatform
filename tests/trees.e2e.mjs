import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:{})})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
const base=process.env.DEMO_URL||'http://127.0.0.1:5173/'
try{
 await page.goto(base);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();sessionStorage.setItem('hf-person','bank')});await page.reload();await page.goto(base+'#/bank/questions');await page.locator('.catalog-row').first().waitFor()
 const all=await page.locator('.catalog-row').count();await page.getByRole('button',{name:'收起全部',exact:true}).click();assert.ok(await page.locator('.catalog-row').count()<all);await page.getByRole('button',{name:'展开全部',exact:true}).click()
 await page.getByPlaceholder('搜索目录节点…').fill('精密测量');assert.ok(await page.locator('.catalog-row').count()<all);await page.getByRole('button',{name:'清除目录搜索'}).click()
 const row=page.locator('.catalog-row').filter({hasText:'操作技能'}).first();await row.locator('.catalog-select').click();await page.waitForTimeout(100);assert.ok((await page.locator('tbody').innerText()).includes('SK-'));assert.ok(!(await page.locator('tbody').innerText()).includes('Q-0001'))
 const hash=await page.evaluate(()=>location.hash);await page.reload();await page.locator('.catalog-row.active').waitFor();assert.equal(await page.evaluate(()=>location.hash),hash)
 await page.goto(base+'#/bank/structure');await page.locator('.catalog-row').first().waitFor();await page.locator('.catalog-row').filter({hasText:'专业理论'}).first().locator('.catalog-select').click()
 await page.getByRole('button',{name:'新增知识点',exact:true}).click();await page.getByPlaceholder('请输入节点名称').fill('树联动演示知识点');await page.getByRole('button',{name:'保存节点'}).click();await page.getByRole('row').filter({hasText:'树联动演示知识点'}).waitFor()
 await page.getByRole('row').filter({hasText:'树联动演示知识点'}).getByRole('button',{name:'重命名',exact:true}).click();await page.getByPlaceholder('请输入节点名称').fill('树联动已更名');await page.getByRole('button',{name:'保存节点'}).click()
 await page.getByRole('row').filter({hasText:'树联动已更名'}).getByRole('button',{name:'查看试题'}).click();await page.locator('.empty').waitFor();assert.ok((await page.locator('.catalog-breadcrumb').innerText()).includes('树联动已更名'))
 await page.goto(base+'#/authoring/editor');await page.getByRole('button',{name:'从目录树选择'}).click();await page.getByRole('dialog').getByPlaceholder('搜索目录节点…').fill('树联动已更名');await page.getByRole('dialog').locator('.catalog-select').filter({hasText:'树联动已更名'}).click();await page.getByRole('button',{name:'使用此知识点'}).click();assert.ok((await page.locator('.catalog-editor-path').innerText()).includes('树联动已更名'))
 await page.goto(base+'#/bank/structure');await page.getByPlaceholder('搜索目录节点…').fill('树联动已更名');await page.locator('.catalog-select').filter({hasText:'树联动已更名'}).click();await page.getByRole('button',{name:'停用当前节点'}).click();await page.getByRole('button',{name:'启用当前节点'}).waitFor();await page.reload();await page.getByRole('button',{name:'启用当前节点'}).waitFor();await page.getByRole('button',{name:'启用当前节点'}).click()
 await page.screenshot({path:'test-results/catalog-structure.png',fullPage:true})
 await page.getByRole('row').filter({hasText:'树联动已更名'}).getByRole('button',{name:'删除',exact:true}).click();await page.getByRole('button',{name:'确认删除节点'}).click();assert.equal(await page.locator('.catalog-select').filter({hasText:'树联动已更名'}).count(),0)
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});assert.deepEqual(errors,[])
 console.log('PASS 树展开收起、搜索、跨层筛选、路由恢复、节点新增更名停用删除、命题联动、390px布局；页面错误0')
}finally{await browser.close()}
