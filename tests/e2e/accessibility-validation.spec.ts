import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './fixtures';

const KEY = 'logibot.preferences';
const CHARTS = ['usage-chart', 'correct-wrong-chart', 'general-score-card', 'category-chart', 'proficiency-radar-chart', 'effort-matrix-chart', 'learning-journey-chart'];

test.use({ locale: 'pt-BR' });

async function withPreferences(page: Page, preferences: Record<string, string>) {
  await page.addInitScript(([key, value]) => { localStorage.setItem(key, value); }, [KEY, JSON.stringify(preferences)] as const);
}

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), label).toEqual([]);
}

const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2);

async function openUniversityDashboard(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('combobox', { name: 'Selecione uma Entidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade', exact: true }).click();
  await page.getByRole('combobox', { name: 'Selecione a universidade', exact: true }).click();
  await page.getByRole('option', { name: 'Universidade original', exact: true }).click();
  await expect(page.locator('#proficiency-radar-chart .recharts-polar-angle-axis-tick text').first()).toBeVisible();
}

async function choosePreference(page: Page, group: string, option: string) {
  const opener = page.getByRole('button', { name: 'Aparência e acessibilidade' }).first();
  if (!(await opener.isVisible())) await page.locator('#chat-header-menu-button').click();
  await page.getByRole('button', { name: 'Aparência e acessibilidade' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Aparência e acessibilidade' });
  await dialog.getByRole('group', { name: group }).getByText(option, { exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const menu = page.getByRole('button', { name: /Fechar menu/ });
  if (await menu.count() && await menu.first().isVisible()) await menu.first().click();
}

const fontSize = (page: Page, selector: string) => page.locator(selector).first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));

/** Reads the animation flag React passed to the Recharts element that drew this node. */
const animationFlag = (page: Page, selector: string) => page.locator(selector).first().evaluate(node => {
  const key = Object.keys(node).find(name => name.startsWith('__reactFiber$'));
  let fiber = key ? (node as any)[key] : null;
  while (fiber) {
    if (fiber.memoizedProps && typeof fiber.memoizedProps.isAnimationActive === 'boolean') return fiber.memoizedProps.isAnimationActive;
    fiber = fiber.return;
  }
  return null;
});

test.describe('preferências nos gráficos já abertos', () => {
  test('rótulos dos gráficos aumentam com o texto sem recarregar', async ({ page }) => {
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    const selectors = ['#proficiency-radar-chart .recharts-polar-angle-axis-tick text', '#category-chart .recharts-polar-angle-axis-tick text', '#learning-journey-chart .recharts-xAxis .recharts-cartesian-axis-tick text', '#learning-journey-chart .recharts-label-list text', '#learning-journey-chart .recharts-reference-line text', '#effort-matrix-chart .recharts-yAxis .recharts-cartesian-axis-tick text', '#usage-chart .recharts-xAxis .recharts-cartesian-axis-tick text'];
    const before = await Promise.all(selectors.map(selector => fontSize(page, selector)));
    expect(before.slice(0, 5)).toEqual([11, 11, 11, 11, 11]);
    await choosePreference(page, 'Tamanho do texto', 'Muito maior');
    await expect(page.locator('html')).toHaveAttribute('data-text', 'larger');
    const after = await Promise.all(selectors.map(selector => fontSize(page, selector)));
    selectors.forEach((selector, index) => expect(after[index], selector).toBeCloseTo(before[index] * 1.25, 1));
    expect(await noHorizontalScroll(page)).toBeTruthy();
    for (const id of CHARTS) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box!.x, id).toBeGreaterThanOrEqual(0);
    }
  });

  test('movimento reduzido chega aos gráficos já abertos sem recarregar', async ({ page }) => {
    await withPreferences(page, { motion: 'full' });
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    const selectors = ['#correct-wrong-chart .recharts-pie', '#proficiency-radar-chart .recharts-radar', '#category-chart .recharts-radar', '#learning-journey-chart .recharts-line', '#usage-chart .recharts-bar', '#effort-matrix-chart .recharts-scatter'];
    for (const selector of selectors) expect(await animationFlag(page, selector), selector).toBe(true);
    await choosePreference(page, 'Movimento', 'Reduzido');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    for (const selector of selectors) expect(await animationFlag(page, selector), selector).toBe(false);
  });

  test('movimento reduzido do sistema vale desde o primeiro carregamento quando segue o sistema', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    expect(await animationFlag(page, '#correct-wrong-chart .recharts-pie')).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    expect(await animationFlag(page, '#correct-wrong-chart .recharts-pie')).toBe(true);
  });
});

test.describe('cores, formas e padrões', () => {
  test('paleta alternativa é aplicada, preservada e mantém formas e padrões', async ({ page }) => {
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    const sector = page.locator('#correct-wrong-chart .recharts-pie-sector path').first();
    const defaultFill = await sector.evaluate(node => getComputedStyle(node).fill);
    await choosePreference(page, 'Cores dos gráficos', 'Para dificuldade com vermelho e verde');
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'redGreen');
    await expect.poll(() => sector.evaluate(node => getComputedStyle(node).fill)).toBe('rgb(86, 180, 233)');
    expect(defaultFill).not.toBe('rgb(86, 180, 233)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'redGreen');
    await openUniversityDashboard(page);
    const wrong = page.locator('#correct-wrong-chart .recharts-pie-sector path').nth(1);
    const fill = await wrong.getAttribute('fill');
    expect(fill).toMatch(/^url\(#wrong-hatch-/);
    await expect(page.locator(`#correct-wrong-chart pattern#${fill!.slice(5, -1)}`)).toHaveCount(1);
    await expect(page.locator('#correct-wrong-chart .recharts-pie-labels text')).toHaveText([/✓ 80\s?%/, /✗ 20\s?%/]);
    await expect(page.locator('#correct-wrong-chart .recharts-legend-wrapper li')).toHaveText(['Acertos', 'Erros']);
  });

  test('cada quadrante da matriz usa uma forma diferente, repetida na legenda', async ({ page }) => {
    await mockApi(page, 'admin');
    await page.route('**/api/dashboard/effort-matrix', route => route.fulfill({ json: { points: [
      { name: 'Ana', effort: 90, performance: 90 }, { name: 'Bia', effort: 10, performance: 95 },
      { name: 'Caio', effort: 95, performance: 20 }, { name: 'Davi', effort: 5, performance: 10 },
      { name: 'Média do grupo', effort: 50, performance: 54, isAverage: true }, { name: 'Edu', effort: 3, performance: null },
    ], unassessedCount: 1, averages: { avgPerformance: 54, avgEffort: 50 } } }));
    await openUniversityDashboard(page);
    const shapes = await page.locator('#effort-matrix-chart .recharts-scatter-symbol path').evaluateAll(nodes => nodes.map(node => node.getAttribute('d')!.replace(/[\d.\-]+/g, 'n')));
    expect(new Set(shapes).size).toBe(5);
    const legend = await page.locator('#effort-matrix-chart .recharts-symbols').count();
    expect(legend).toBeGreaterThanOrEqual(10);
    await page.locator('#effort-matrix-chart').getByRole('button', { name: 'Ver dados em tabela' }).click();
    const table = page.locator('#effort-matrix-chart').getByRole('table');
    await expect(table.getByRole('row', { name: /Edu/ })).toContainText('Sem respostas de quiz');
    await expect(table.getByRole('row', { name: /Edu/ })).toContainText('Sem avaliação');
    await expect(table.getByRole('row', { name: /Davi/ })).toContainText('10,0%');
  });
});

test.describe('tabelas equivalentes', () => {
  test('todos os gráficos oferecem tabela pelo teclado e a página continua sem violações', async ({ page }) => {
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    for (const id of CHARTS) {
      const toggle = page.locator(`#${id} button[aria-controls]`);
      await expect(toggle, id).toHaveText('Ver dados em tabela');
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle, id).toHaveAttribute('aria-expanded', 'true');
      await expect(toggle, id).toHaveText('Ocultar tabela');
      await expect(toggle, id).toBeFocused();
      const table = page.locator(`#${id}`).getByRole('table');
      await expect(table, id).toBeVisible();
      await expect(table.locator('caption'), id).toContainText('dados do filtro selecionado');
      expect(await table.locator('thead th[scope="col"]').count(), id).toBeGreaterThanOrEqual(2);
      expect(await table.locator('tbody th[scope="row"]').count(), id).toBeGreaterThanOrEqual(1);
    }
    await expect(page.locator('#usage-chart').getByRole('table')).toContainText('60');
    await expect(page.locator('#correct-wrong-chart').getByRole('table')).toContainText('80,0%');
    await expect(page.locator('#category-chart').getByRole('table').getByRole('row', { name: /Listas/ })).toContainText('0');
    await audit(page, 'dashboard com tabelas abertas');
    expect(await noHorizontalScroll(page)).toBeTruthy();
    const region = page.locator('#learning-journey-chart').getByRole('region');
    await region.focus();
    await expect(region).toBeFocused();
  });

  test('a tabela continua aberta quando a preferência muda durante a leitura', async ({ page }) => {
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    await page.locator('#category-chart').getByRole('button', { name: 'Ver dados em tabela' }).click();
    await choosePreference(page, 'Tema', 'Claro');
    await choosePreference(page, 'Tamanho do texto', 'Maior');
    await expect(page.locator('#category-chart').getByRole('table')).toBeVisible();
  });

  test('a exportação em PNG não inclui o controle da tabela', async ({ page }) => {
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    await expect(page.locator('#usage-chart [data-export-ignore="true"]')).toHaveCount(1);
  });
});

test.describe('ampliação, refluxo e espaçamento', () => {
  test('texto a 200% mantém conteúdo e controles alcançáveis', async ({ page }) => {
    await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '32px'; }); });
    await mockApi(page, 'admin');
    for (const route of ['/', '/signin', '/signup', '/profile']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(await noHorizontalScroll(page), route).toBeTruthy();
    }
    await openUniversityDashboard(page);
    expect(await fontSize(page, '#proficiency-radar-chart .recharts-polar-angle-axis-tick text')).toBeCloseTo(22, 0);
    expect(await noHorizontalScroll(page)).toBeTruthy();
    await page.locator('#usage-chart').getByRole('button', { name: 'Ver dados em tabela' }).click();
    await expect(page.locator('#usage-chart').getByRole('table')).toBeVisible();
  });

  test('refluxo em 320 px de largura sem rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await withPreferences(page, { textSize: 'larger' });
    await mockApi(page, 'admin');
    for (const route of ['/', '/signin', '/signup', '/profile', '/chat']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(await noHorizontalScroll(page), route).toBeTruthy();
    }
    await openUniversityDashboard(page);
    await page.locator('#effort-matrix-chart').getByRole('button', { name: 'Ver dados em tabela' }).click();
    expect(await noHorizontalScroll(page)).toBeTruthy();
  });

  test('espaçamento de texto (WCAG 1.4.12) não corta conteúdo', async ({ page }) => {
    await mockApi(page, 'admin');
    const spacing = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';
    for (const route of ['/signin', '/signup', '/dashboard', '/profile']) {
      if (route === '/dashboard') await openUniversityDashboard(page); else await page.goto(route);
      await page.addStyleTag({ content: spacing });
      await page.waitForTimeout(100);
      expect(await noHorizontalScroll(page), route).toBeTruthy();
      const clipped = await page.evaluate(() => [...document.querySelectorAll('button, a, label, h1, h2, h3, legend, th, td, [role="tab"]')]
        .filter(node => {
          const element = node as HTMLElement; const style = getComputedStyle(element);
          if (!element.offsetParent || !element.innerText.trim() || style.textOverflow === 'ellipsis' || element.classList.contains('sr-only')) return false;
          const hides = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY);
          return hides && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
        })
        .map(node => (node as HTMLElement).innerText.trim().slice(0, 40)));
      expect(clipped, route).toEqual([]);
    }
  });
});

test.describe('alto contraste do sistema', () => {
  test('cores forçadas mantêm a opção escolhida identificável e a página sem violações', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/signin');
    // Contrast is defined by the person's system colors in this mode, so axe's color-contrast rule does not apply.
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).disableRules(['color-contrast']).analyze();
    expect(results.violations.map(item => item.id), 'login em cores forçadas').toEqual([]);
    await page.getByRole('button', { name: 'Aparência e acessibilidade' }).click();
    const dialog = page.getByRole('dialog', { name: 'Aparência e acessibilidade' });
    const checked = dialog.locator('.preference-option[data-checked]').first();
    await expect(checked).toBeVisible();
    expect(await checked.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
    const unchecked = dialog.locator('.preference-option:not([data-checked])').first();
    expect(await unchecked.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('solid');
  });

  test('gráficos continuam desenhados em cores forçadas', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await mockApi(page, 'admin');
    await openUniversityDashboard(page);
    const fill = await page.locator('#correct-wrong-chart .recharts-pie-sector path').first().evaluate(node => getComputedStyle(node).fill);
    expect(fill).not.toBe('none');
  });
});

test.describe('campos e blocos de código', () => {
  const contrast = (page: Page, selector: string, property: 'borderTopColor' | 'color', backgroundSelector?: string) => page.evaluate(([selector, property, backgroundSelector]) => {
    const lum = (rgb: number[]) => rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const parse = (value: string) => { const m = value.match(/[\d.]+/g)!.map(Number); return { rgb: m.slice(0, 3), a: m[3] ?? 1 }; };
    const opaque = (element: Element | null) => { let bg = [255, 255, 255]; const layers: { rgb: number[]; a: number }[] = []; while (element) { const c = parse(getComputedStyle(element).backgroundColor); if (c.a > 0) layers.unshift(c); if (c.a > .99) break; element = element.parentElement; } for (const layer of layers) bg = layer.rgb.map((v, i) => v * layer.a + bg[i] * (1 - layer.a)); return bg; };
    const node = document.querySelector(selector)!;
    const fg = parse((getComputedStyle(node) as any)[property]);
    const bg = opaque(backgroundSelector ? document.querySelector(backgroundSelector) : node);
    const mixed = fg.rgb.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));
    const [x, y] = [lum(mixed), lum(bg)];
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }, [selector, property, backgroundSelector] as const);

  for (const theme of ['dark', 'light']) {
    test(`bordas dos campos de autenticação atingem 3:1 no contraste padrão (${theme})`, async ({ page }) => {
      await withPreferences(page, { theme, contrast: 'default' });
      await page.goto('/signin');
      const field = '#signin-email-input';
      await expect(page.locator(field)).toBeVisible();
      const wrapper = await page.locator(field).evaluate(node => { node.parentElement!.id = 'field-wrapper'; return true; });
      expect(wrapper).toBeTruthy();
      expect(await contrast(page, '#field-wrapper', 'borderTopColor')).toBeGreaterThanOrEqual(3);
      expect(await contrast(page, '#field-wrapper', 'borderTopColor', '#field-wrapper > input')).toBeGreaterThanOrEqual(3);
      await page.locator(field).focus();
      expect(await contrast(page, '#field-wrapper', 'borderTopColor')).toBeGreaterThanOrEqual(3);
    });

    test(`bloco de código segue o tema e mantém comentários legíveis (${theme})`, async ({ page }) => {
      await withPreferences(page, { theme });
      await mockApi(page, 'student');
      await page.route('**/api/chat/messages/stream', route => route.fulfill({ status: 200, contentType: 'text/event-stream', body: `event: session\ndata: {"sessionId":"session","userMessageId":"m"}\n\nevent: token\ndata: ${JSON.stringify({ text: 'Exemplo:\n\n```python\n# comentario explicativo\nvalor = 10  # uma linha bem longa para verificar a rolagem horizontal do bloco de codigo sem quebrar a interface\nprint(valor)\n```' })}\n\nevent: done\ndata: {}\n\n` }));
      await page.goto('/chat');
      await page.getByRole('textbox').first().fill('Mostre um exemplo');
      await page.keyboard.press('Enter');
      const code = page.getByRole('region', { name: 'Código em PYTHON' });
      await expect(code).toBeVisible();
      await expect(code).toHaveAttribute('tabindex', '0');
      const background = await code.evaluate(node => getComputedStyle(node).backgroundColor);
      expect(background).toBe(theme === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(246, 248, 250)');
      await code.locator('span', { hasText: '# comentario explicativo' }).first().evaluate(node => { node.id = 'code-comment'; });
      await code.evaluate(node => { node.id = 'code-block'; });
      expect(await contrast(page, '#code-comment', 'color', '#code-block')).toBeGreaterThanOrEqual(4.5);
      await expect(page.getByRole('button', { name: 'Copiar' })).toBeVisible();
      expect(await noHorizontalScroll(page)).toBeTruthy();
      await code.focus();
      await page.keyboard.press('ArrowRight');
      await expect(code).toBeFocused();
      await audit(page, `chat com código ${theme}`);
    });
  }
});

test.describe('chat e conteúdo dinâmico', () => {
  test('resposta completa aparece só no fim e é anunciada', async ({ page }) => {
    await withPreferences(page, { chatDisplay: 'complete' });
    await mockApi(page, 'student');
    await page.goto('/chat');
    await page.getByRole('textbox').first().fill('O que é uma variável?');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Uma variável armazena um valor.')).toBeVisible();
    await expect(page.locator('[role="status"][aria-live="polite"]').first()).toHaveText('Resposta do LogiBot recebida.');
  });

  test('rolagem só acompanha o fim quando a pessoa já está nele', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await mockApi(page, 'student');
    const long = Array.from({ length: 40 }, (_, i) => `Parágrafo ${i + 1} da resposta.`).join('\n\n');
    await page.route('**/api/chat/messages/stream', route => route.fulfill({ status: 200, contentType: 'text/event-stream', body: `event: session\ndata: {"sessionId":"session","userMessageId":"m"}\n\nevent: token\ndata: ${JSON.stringify({ text: long })}\n\nevent: done\ndata: {}\n\n` }));
    await page.goto('/chat');
    await page.getByRole('textbox').first().fill('Explique');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Parágrafo 40 da resposta.')).toBeVisible();
    const container = page.locator('#chat-container');
    await expect.poll(() => container.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight < 100)).toBeTruthy();
    await container.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
    const jump = page.getByRole('button', { name: 'Ir para a última mensagem' });
    await expect(jump).toBeVisible();
    await page.waitForTimeout(200);
    expect(await container.evaluate(node => node.scrollTop)).toBeLessThan(100);
    await jump.click();
    await expect.poll(() => container.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight < 100)).toBeTruthy();
  });

  test('chat de teste do RAG anuncia a resposta e oferece ir para a última mensagem', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockApi(page, 'admin');
    const long = Array.from({ length: 40 }, (_, i) => `Linha ${i + 1} do teste.`).join('\n\n');
    await page.route('**/api/rag/classes/*/test-chat', route => route.fulfill({ json: { answer: long, response: long, content: long, retrievedChunks: [] } }));
    await page.goto('/rag');
    await page.getByRole('tab', { name: /Chat de teste/i }).or(page.getByRole('button', { name: /Chat de teste/i })).first().click();
    const input = page.getByPlaceholder(/Enter para enviar/);
    await input.fill('Pergunta de teste');
    await input.press('Enter');
    await expect(page.getByText('Linha 40 do teste.')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Resposta do LogiBot recebida.' })).toHaveCount(1);
    const scroller = page.getByText('Linha 1 do teste.').locator('xpath=ancestor::div[contains(@class,"overflow-y-auto")][1]');
    await scroller.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event('scroll')); });
    await expect(page.getByRole('button', { name: 'Ir para a última mensagem' })).toBeVisible();
  });
});
