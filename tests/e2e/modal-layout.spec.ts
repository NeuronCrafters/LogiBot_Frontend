import {test,expect} from '@playwright/test';
import {mockApi,selectLanguage} from './fixtures';
for(const locale of ['pt-BR','en-US','es-ES']){
 test(`modais preservam foco e alcance em tela baixa ${locale}`,async({page},testInfo)=>{
  await page.setViewportSize({width:testInfo.project.name==='mobile'?393:1280,height:480});
  await mockApi(page,'professor');await page.goto('/profile');await selectLanguage(page,locale);
  for(const button of await page.locator('main button[title], main button:has(svg.lucide-key-round)').all()){
   await button.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
   const bounds=await dialog.boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(0);
   const actions=dialog.getByRole('button');await actions.last().scrollIntoViewIfNeeded();const end=await actions.last().boundingBox();expect(end!.y+end!.height).toBeLessThanOrEqual(481);
   const input=dialog.locator('input').first();await input.fill('Valor original preservado');await input.focus();await page.keyboard.press('Tab');
   expect(await dialog.evaluate(root=>root.contains(document.activeElement))).toBeTruthy();
   await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(button).toBeFocused();
  }
 });
}
