import {test,expect} from '@playwright/test';
import {mockApi,selectLanguage} from './fixtures';
for(const language of ['pt-BR','en-US','es-ES']) {
 test(`seletor junto à borda mantém opções alcançáveis ${language}`,async({page},testInfo)=>{
  await page.setViewportSize({width:testInfo.project.name==='mobile'?393:1280,height:480});
  await mockApi(page,'admin');await page.goto('/entities/create/professor');await selectLanguage(page,language);
  const combos=page.locator('main button[role=combobox]');await combos.first().click();await page.getByRole('option',{name:'Universidade original',exact:true}).click();
  const course=combos.last();await course.evaluate(element=>element.scrollIntoView({block:'end'}));await course.click();
  const menu=page.getByRole('listbox');const box=await menu.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(480);
  await page.getByRole('option',{name:'Curso original',exact:true}).click();await expect(course).toHaveText('Curso original');await expect(course).toBeFocused();await expect(menu).toHaveCount(0);
 });
}
