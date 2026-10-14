import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:960}});
try {
  await page.goto('http://127.0.0.1:5177/#/node/wall-damp-proof-course');
  await page.waitForFunction(()=>document.querySelector('canvas')&&document.querySelector('h1'));
  await page.waitForTimeout(1000);
  console.log(JSON.stringify(await page.locator('button').evaluateAll(items=>items.filter(item=>item.getBoundingClientRect().width>0).map(item=>({text:item.textContent?.trim(),aria:item.getAttribute('aria-label'),class:item.className}))),null,2));
  await page.screenshot({path:'audit-output/textbook-overall-audit-2026-10-12/node-wall-initial.png'});
  await writeFile('audit-output/textbook-overall-audit-2026-10-12/node-ui-text.txt',await page.locator('body').innerText());
} finally {await browser.close();}
