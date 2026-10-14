import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const out='audit-output/textbook-overall-audit-2026-10-12';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const results=[];
try{
  for(const node of ['wall-damp-proof-course','bottom-landing-entrance-01']){
    await page.goto(`http://127.0.0.1:5177/#/node/${node}`);
    await page.waitForFunction(()=>document.querySelector('canvas')&&document.querySelector('h1'));
    await page.waitForTimeout(500);
    const pause=page.getByRole('button',{name:'暂停旋转',exact:true});
    if(await pause.count())await pause.click();
    if(node==='wall-damp-proof-course')await page.getByRole('button',{name:'方案 A: 密实材料垫层',exact:true}).click();
    await page.waitForTimeout(500);
    const canvas=await page.locator('canvas').boundingBox();
    const buttonNames=await page.locator('button[aria-label^="查看知识"]').evaluateAll(items=>items.map(item=>item.getAttribute('aria-label')));
    const attempt=[];
    for(const [x,y] of [[.26,.47],[.31,.54],[.17,.55],[.50,.53],[.50,.47],[.60,.55]]){
      await page.mouse.click(canvas.x+canvas.width*x,canvas.y+canvas.height*y);
      await page.waitForTimeout(120);
      const text=await page.locator('body').innerText();
      const state=await page.evaluate(async()=>{const {useNodeStore}=await import('/src/store/nodeStore.ts');const s=useNodeStore.getState();return {selectedObject:s.selectedObject,selectedVariantId:s.selectedVariantId};});
      const selected=text.match(/已选择：([^\n]+)/)?.[1];
      attempt.push({x,y,...state,selected:selected??null,unknownKnowledge:text.includes('该构件暂未配置教学内容')});
      if(state.selectedObject)break;
    }
    await page.screenshot({path:`${out}/${node}-clicked.png`});
    await writeFile(`${out}/${node}-clicked.txt`,await page.locator('body').innerText());
    let manual=null;
    if(node==='wall-damp-proof-course' && buttonNames.length && !await page.getByRole('button',{name:buttonNames[0],exact:true}).count())await page.getByRole('button',{name:'方案 A: 密实材料垫层',exact:true}).click();
    if(buttonNames.length){
      await page.getByRole('button',{name:buttonNames[0],exact:true}).click();
      await page.waitForTimeout(200);
      const text=await page.locator('body').innerText();
      manual={clicked:buttonNames[0],unknownKnowledge:text.includes('该构件暂未配置教学内容'),selected:text.match(/已选择：([^\n]+)/)?.[1]??null,pressed:await page.getByRole('button',{name:buttonNames[0],exact:true}).evaluateAll(items=>items[0]?.getAttribute('aria-pressed')??null)};
      await page.screenshot({path:`${out}/${node}-manual-card.png`});
    }
    if(node==='bottom-landing-entrance-01'){
      const before=await page.getByText('说明',{exact:true}).count();
      await page.getByRole('button').filter({hasText:'长跑梯段'}).first().click();
      await page.waitForTimeout(350);
      const state=await page.evaluate(async()=>{const {useNodeStore}=await import('/src/store/nodeStore.ts');const s=useNodeStore.getState();return {selectedObject:s.selectedObject,selectedVariantId:s.selectedVariantId};});
      manual={clicked:'长跑梯段',...state,detailBefore:before,detailAfter:await page.getByText('说明',{exact:true}).count()};
      await page.screenshot({path:`${out}/${node}-manual-card.png`});
    }
    results.push({node,canvas,knowledgeButtons:buttonNames,attempt,manual});
  }
  await writeFile(`${out}/node-interaction-evidence.json`,JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
