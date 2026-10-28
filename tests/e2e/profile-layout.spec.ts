import { test, expect } from '@playwright/test';
import { mockApi, selectLanguage } from './fixtures';

for (const role of ['admin', 'student', 'professor', 'course-coordinator']) {
 for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`perfil ${role} em ${language} mantém topo e fim alcançáveis`, async ({ page }, testInfo) => {
   await mockApi(page, role);
   const heights = testInfo.project.name === 'mobile' ? [851] : [720, 884];
   for (const height of heights) {
    await page.setViewportSize({width:testInfo.project.name === 'mobile' ? 393 : 1920,height});
    await page.goto('/profile');
    await selectLanguage(page, language);
    await expect(page.locator('main h1')).toBeVisible();
    const geometry = await page.locator('main').evaluate(main => {
     main.scrollTop = 0;
     const first = main.querySelector('section')!.getBoundingClientRect();
     const bounds = main.getBoundingClientRect();
     const top = first.top >= bounds.top - 1;
     main.scrollTop = main.scrollHeight;
     const bottom = main.firstElementChild!.getBoundingClientRect().bottom <= bounds.bottom + 1;
     main.scrollTop = 0;
     return {top,bottom,overflow:document.documentElement.scrollWidth > innerWidth + 2};
    });
    expect(geometry).toEqual({top:true,bottom:true,overflow:false});
   }
  });
 }
}
