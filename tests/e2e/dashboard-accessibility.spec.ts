import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {mockApi,selectLanguage} from './fixtures';
for(const locale of ['pt-BR','en-US','es-ES']) {
 const dictionary=JSON.parse(readFileSync(new URL(`../../src/i18n/catalogs/${locale}.json`,import.meta.url),'utf8'));
 test(`gráficos preenchidos e insight acessíveis ${locale}`,async({page},testInfo)=>{
  await mockApi(page,'admin');await page.goto('/dashboard');await selectLanguage(page,locale);
  await page.getByRole('combobox',{name:dictionary['dashboard.selecioneUmaEntidade'],exact:true}).click();
  await page.getByRole('option',{name:dictionary['common.aluno'],exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Universidade original',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:dictionary['academic.selecioneOCurso'],exact:true}).click();
  await page.getByRole('option',{name:'Curso original',exact:true}).click();
  await page.getByRole('combobox',{name:dictionary['academic.selecioneATurma'],exact:true}).click();
  await page.getByRole('option',{name:'Turma original',exact:true}).click();
  await page.getByRole('combobox',{name:dictionary['academic.selectStudent'],exact:true}).click();
  await page.getByRole('option',{name:'João da Silva',exact:true}).click();
  await expect(page.locator('.recharts-scatter-symbol')).toHaveCount(2);
  const audit=async()=>{
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   expect(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  };
  await audit();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
  await page.screenshot({path:testInfo.outputPath(`dashboard-${locale}.png`),fullPage:true});
  let previous='',stable=0;
  await expect.poll(async()=>{
   const paths=await page.locator('.recharts-pie-sector path').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('d')).join(''));
   stable=paths===previous?stable+1:0;previous=paths;return stable>=3;
  },{intervals:[300],timeout:10000}).toBeTruthy();
  for(const id of ['effort-matrix-chart','correct-wrong-chart','access-pattern-chart']) {
   const chart=page.locator(`#${id}`);await chart.screenshot({path:testInfo.outputPath(`${id}-${locale}.png`)});
  }
  await page.setViewportSize({width:testInfo.project.name==='mobile'?393:1280,height:480});
  const trigger=page.getByRole('button',{name:dictionary['dashboard.gerarAnaliseGeral'],exact:true});await trigger.click();
  const dialog=page.getByRole('dialog');await expect(dialog.locator(`[lang="${locale}"]`)).toBeVisible();
  await audit();
  await page.screenshot({path:testInfo.outputPath(`insight-${locale}.png`)});
  const region=dialog.getByRole('region');await region.focus();await page.keyboard.press('End');await expect(region).toBeFocused();
  const close=dialog.getByRole('button',{name:dictionary['common.fechar'],exact:true});await close.scrollIntoViewIfNeeded();
  const box=await close.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(481);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
 });
}
