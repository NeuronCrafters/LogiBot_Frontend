import { test, expect } from '@playwright/test';
import { mockApi, selectLanguage } from './fixtures';

const headings = {
 'pt-BR': { personal: 'Informações pessoais', security: 'Segurança', language: 'Idioma', preferences: 'Aparência e acessibilidade' },
 'en-US': { personal: 'Personal information', security: 'Security', language: 'Language', preferences: 'Appearance and accessibility' },
 'es-ES': { personal: 'Información personal', security: 'Seguridad', language: 'Idioma', preferences: 'Apariencia y accesibilidad' },
};

for (const role of ['admin', 'student', 'professor', 'course-coordinator']) {
 for (const language of ['pt-BR', 'en-US', 'es-ES']) {
  test(`perfil ${role} em ${language} mantém topo e fim alcançáveis`, async ({ page }, testInfo) => {
   if (role === 'admin' && language === 'pt-BR') await page.addInitScript(() => localStorage.setItem('logibot.preferences', JSON.stringify({ theme: 'light' })));
   await mockApi(page, role);
   const heights = testInfo.project.name === 'mobile' ? [851] : [720, 884];
   for (const height of heights) {
    await page.setViewportSize({width:testInfo.project.name === 'mobile' ? 393 : 1920,height});
    await page.goto('/profile');
    await selectLanguage(page, language);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main').getByRole('heading', { name: headings[language].preferences, exact: true })).toHaveCount(0);
    const personal = page.locator('main section').filter({ has: page.getByRole('heading', { name: headings[language].personal, exact: true }) });
    const security = page.locator('main section').filter({ has: page.getByRole('heading', { name: headings[language].security, exact: true }) });
    const languageCard = page.locator('main section').filter({ has: page.getByRole('heading', { name: headings[language].language, exact: true }) });
    if (testInfo.project.name === 'desktop') {
     await expect.poll(async () => {
      const a = (await languageCard.boundingBox())!, b = (await security.boundingBox())!;
      return Math.max(Math.abs(a.y - b.y), Math.abs(a.height - b.height), Math.abs(a.width - b.width));
     }).toBeLessThanOrEqual(1);
     const a = (await personal.boundingBox())!, b = (await security.boundingBox())!;
     expect(a.width).toBeGreaterThan(b.width);
     expect(a.y + a.height).toBeLessThanOrEqual(b.y);
    }
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
    if (role === 'admin' && language === 'pt-BR' && height === heights.at(-1)) {
     await page.screenshot({path:testInfo.outputPath('profile-cards.png')});
     const opener = page.getByRole('button', { name: headings[language].preferences, exact: true }).first();
     if (!await opener.isVisible()) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
     await opener.click();
     const dialog = page.getByRole('dialog', { name: headings[language].preferences, exact: true });
     await expect(dialog).toBeVisible();
     await expect(dialog.getByRole('group', { name: 'Tema', exact: true })).toBeVisible();
     await page.keyboard.press('Escape');
     await expect(dialog).toHaveCount(0);
    }
   }
  });
 }
}
