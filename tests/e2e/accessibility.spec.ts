import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, selectLanguage } from './fixtures';

async function audit(page:Page, label:string) {
 const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(results.violations.map(item=>({id:item.id,impact:item.impact,targets:item.nodes.map(node=>node.target)})),label).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 2),`${label}: largura`).toBeTruthy();
 const main=page.locator('main').first();
 if(await main.count())expect(await main.evaluate(node=>{node.scrollTop=0;return !node.firstElementChild || node.firstElementChild.getBoundingClientRect().top >= node.getBoundingClientRect().top-1;}),`${label}: topo alcançável`).toBeTruthy();
}
for (const language of ['pt-BR','en-US','es-ES']) {
 for (const route of ['/','/signin','/signup','/profile','/chat','/quiz','/entities/create/university','/entities/create/course','/entities/create/class','/entities/create/discipline','/entities/create/professor','/entities/manage','/entities','/rag','/quiz/manage','/feedback','/admin/feedbacks','/dashboard']) {
  test(`acessibilidade ${route} ${language}`,async({page})=>{
   if (!['/','/signin','/signup'].includes(route)) await mockApi(page,['/chat','/quiz'].includes(route)?'student':'admin');
   await page.goto(route);await selectLanguage(page,language);await audit(page,route);
   if(route==='/profile'){
    for(const button of await page.locator('main button[title], main button:has(svg.lucide-key-round)').all()){
     await button.click();await expect(page.getByRole('dialog')).toBeVisible();await audit(page,'perfil: modal');
     await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(button).toBeFocused();
    }
   }
   if(route==='/quiz/manage'){
    await page.locator('main button').filter({has:page.locator('svg.lucide-plus')}).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();await audit(page,'quiz: modal');
    const combo=page.getByRole('dialog').locator('button[role=combobox]').first();
    await combo.focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
   }
  });
 }
}
