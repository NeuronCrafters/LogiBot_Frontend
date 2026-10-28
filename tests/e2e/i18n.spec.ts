import { test, expect } from "@playwright/test";
import { mockApi, selectLanguage, ids } from "./fixtures";

for(const language of ['pt-BR','en-US','es-ES']){
 test(`página pública, HTML e navegação em ${language}`,async({page})=>{
  await page.goto('/');
  await selectLanguage(page,language);
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  const heading={"pt-BR":"Aprenda, pratique","en-US":"Learn, practice","es-ES":"Aprende, practica"}[language]!;
  await expect(page.getByRole('heading',{level:1})).toContainText(heading);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang',language);
 });
}

for(const role of ['student','professor','course-coordinator','admin']){
 test(`preferência e navegação do perfil ${role}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const requests=await mockApi(page,role);
  await page.goto('/profile');
  await expect(page.getByText('João da Silva').first()).toBeVisible();
  for(const language of ['en-US','es-ES','pt-BR']){
   await selectLanguage(page,language);
   await expect(page.locator('html')).toHaveAttribute('lang',language);
   await expect.poll(()=>requests.some(request=>request.path==='/account/preferences'&&request.body?.language===language&&request.language===language)).toBeTruthy();
   await expect(page.getByText('João da Silva').first()).toBeVisible();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
  expect(errors).toEqual([]);
 });
}

test('cadastro mantém dados e consentimento é traduzido',async({page})=>{
 await page.goto('/signup');
 await page.locator('#signup-name-input').fill('João da Silva');
 await page.locator('#signup-email-input').fill('joao@example.invalid');
 await page.locator('#signup-password-input').fill('senha-original-123');
 await page.locator('#signup-code-input').fill('TURMA-739');
 await selectLanguage(page,'en-US');
 await expect(page.locator('#signup-name-input')).toHaveValue('João da Silva');
 await expect(page.locator('#signup-password-input')).toHaveValue('senha-original-123');
 await selectLanguage(page,'es-ES');
 await expect(page.locator('#signup-code-input')).toHaveValue('TURMA-739');
 await expect(page.locator('#signup-email-input')).toHaveValue('joao@example.invalid');
 await page.goto('/signin');
 await page.getByRole('button',{name:'Regístrate'}).click();
 await expect(page.getByRole('dialog')).toContainText('Consentimiento para la recopilación de datos');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('quiz conserva conteúdo e alternativa ao mudar interface',async({page})=>{
 await mockApi(page,'student');await page.goto(`/quiz/${ids.quiz}`);
 await expect(page.getByText('Qual é o valor original?')).toBeVisible();
 await page.getByText('Valor original B',{exact:true}).click();
 await selectLanguage(page,'en-US');
 await expect(page.getByText('Qual é o valor original?')).toBeVisible();
 await expect(page.getByText('Valor original B',{exact:true})).toBeVisible();
 const option=page.getByRole('button').filter({hasText:'Valor original B'});
 await expect(option).toHaveClass(/indigo/);
 await selectLanguage(page,'es-ES');
 await expect(option).toHaveClass(/indigo/);
 await expect(page.getByText('Quiz original em português',{exact:true})).toBeVisible();
});

test('chat envia idioma atual e preserva a pergunta',async({page})=>{
 const requests=await mockApi(page,'student');await page.goto('/chat');
 await selectLanguage(page,'en-US');
 await page.getByRole('textbox').fill('O que é uma variável?');
 await page.getByRole('button',{name:'Send message'}).click();
 await expect(page.getByText('A variable stores a value.')).toBeVisible();
 expect(requests.find(request=>request.path==='/chat/messages/stream')).toMatchObject({language:'en-US',body:{message:'O que é uma variável?'}});
 await selectLanguage(page,'es-ES');
 await expect(page.getByText('A variable stores a value.')).toBeVisible();
 await page.getByRole('textbox').fill('Explique novamente.');
 await page.getByRole('button',{name:'Enviar mensaje'}).click();
 await expect(page.getByText('Una variable almacena un valor.')).toBeVisible();
});

const areas: Record<string,[string,string]> = {
 '/entities/create':['Academic Management','Gestión académica'], '/entities/manage':['Academic Management','Gestión académica'], '/entities':['List entities','Listar entidades'], '/rag':['RAG Knowledge Base','Base de conocimiento RAG'], '/dashboard':['Activity dashboard','Panel de actividades'], '/feedback':['Share your opinion','Envía tu opinión'], '/admin/feedbacks':['Student Feedback','Comentarios de los estudiantes'], '/quiz/manage':['My Quizzes','Mis cuestionarios']
};
for(const route of Object.keys(areas)){
 test(`tela ${route} traduz sem erros de execução`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await mockApi(page,'admin');await page.goto(route);
  await selectLanguage(page,'en-US');await expect(page.locator('html')).toHaveAttribute('lang','en-US');
  await expect(page.getByRole('main').getByText(areas[route][0],{exact:true}).first()).toBeVisible();
  await selectLanguage(page,'es-ES');await expect(page.locator('html')).toHaveAttribute('lang','es-ES');
  await expect(page.getByRole('main').getByText(areas[route][1],{exact:true}).first()).toBeVisible();
  await expect(page.locator('main, [id=header-menu-options]').first()).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
  expect(errors).toEqual([]);
 });
}

test('proxy local entrega saúde e erros reais da API nos três idiomas',async({page})=>{
 for(const language of ['pt-BR','en-US','es-ES']){
  const health=await page.request.get('/api/health/simple');expect(health.ok()).toBeTruthy();
  const response=await page.request.get('/api/auth/me',{headers:{'Accept-Language':language,'x-api-key':process.env.E2E_API_KEY||''}});
  expect(response.status()).toBe(401);expect(response.headers()['content-language']).toBe(language);
  expect((await response.json()).code).toBe('auth.tokenMissing');
 }
});

test('recuperação de senha preserva entrada, valida e usa os endpoints existentes',async({page})=>{
 const sent:{path:string;body:any;language:string}[]=[];
 await page.route('**/api/auth/password-reset*',async route=>{sent.push({path:new URL(route.request().url()).pathname,body:route.request().postDataJSON(),language:route.request().headers()['x-language']});await route.fulfill({json:{message:'ok'}});});
 await page.goto('/forgot-password');await selectLanguage(page,'en-US');
 await page.getByRole('textbox',{name:'Email'}).fill('joao@example.invalid');
 await selectLanguage(page,'es-ES');await expect(page.getByRole('textbox')).toHaveValue('joao@example.invalid');
 await page.locator('form button[type=submit]').click();await expect(page.getByRole('status')).toBeVisible();
 expect(sent[0]).toMatchObject({path:'/api/auth/password-reset-requests',language:'es-ES',body:{email:'joao@example.invalid'}});
 await page.goto('/reset-password');await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('form')).toHaveCount(0);
 await page.goto('/reset-password?token=synthetic-test-token');await selectLanguage(page,'en-US');
 await page.locator('input[type=password]').nth(0).fill('original-password-123');
 await page.locator('input[type=password]').nth(1).fill('different-password');
 await page.locator('form button[type=submit]').click();await expect(page.getByRole('alert')).toBeVisible();
 await selectLanguage(page,'pt-BR');await expect(page.locator('input[type=password]').nth(0)).toHaveValue('original-password-123');
 await page.locator('input[type=password]').nth(1).fill('original-password-123');
 await page.locator('form button[type=submit]').click();await expect(page.getByRole('status')).toBeVisible();
 expect(sent[1]).toMatchObject({path:'/api/auth/password-reset',language:'pt-BR',body:{token:'synthetic-test-token',newPassword:'original-password-123'}});
});

test('criação manual separa idioma do conteúdo e interface',async({page})=>{
 const requests=await mockApi(page,'professor');await page.goto('/quiz/manage');await selectLanguage(page,'pt-BR');
 await page.getByRole('button',{name:'Criar Quiz',exact:true}).first().click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('combobox',{name:'Idioma do conteúdo'}).selectOption('en-US');
 await dialog.getByRole('textbox').first().fill('Título original do professor');
 await dialog.getByRole('combobox',{name:'Selecione a disciplina'}).click();await page.getByRole('option',{name:'Lógica original',exact:true}).click();
 await dialog.getByRole('combobox',{name:'Selecione o tópico'}).click();await page.getByRole('option',{name:'Variáveis',exact:true}).click();
 await dialog.getByRole('button',{name:'Criar Quiz',exact:true}).click();
 await expect.poll(()=>requests.some(r=>r.path==='/quiz/professor'&&r.body?.title==='Título original do professor')).toBeTruthy();
 expect(requests.find(r=>r.body?.title==='Título original do professor')).toMatchObject({language:'pt-BR',body:{language:'en-US',topic:'variaveis',disciplineId:ids.discipline}});
});

test('geração de quiz envia idioma escolhido e conserva materiais',async({page})=>{
 const requests=await mockApi(page,'professor');await page.goto('/quiz/manage');await selectLanguage(page,'pt-BR');
 await page.getByRole('button',{name:'Criar com IA',exact:true}).first().click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('combobox',{name:'Idioma do conteúdo'}).selectOption('es-ES');
 await dialog.locator('select').nth(1).selectOption(ids.discipline);
 await dialog.getByRole('textbox').first().fill('Variáveis e tipos originais');
 await dialog.getByRole('button').filter({hasText:'Material original em português'}).click();
 await dialog.getByRole('button',{name:'Gerar Quiz com IA',exact:true}).click();
 await expect.poll(()=>requests.some(r=>r.path==='/quiz/professor/generate-ai')).toBeTruthy();
 expect(requests.find(r=>r.path==='/quiz/professor/generate-ai')).toMatchObject({language:'pt-BR',body:{language:'es-ES',theme:'Variáveis e tipos originais',documentIds:['document']}});
});

test('exportação PNG usa gráfico atual e registra tela responsiva',async({page},testInfo)=>{
 await mockApi(page,'admin');await page.goto('/dashboard');await selectLanguage(page,'en-US');
 await page.getByRole('combobox',{name:'Select an Entity'}).click();await page.getByRole('option',{name:'University',exact:true}).click();
 await page.getByRole('combobox',{name:'Select the university'}).click();await page.getByRole('option',{name:'Universidade original',exact:true}).click();
 const button=page.getByRole('button',{name:'Download chart as PNG'}).first();await expect(button).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await button.click();const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('usage_time.png');await download.saveAs(testInfo.outputPath('usage-time-en.png'));
 await page.screenshot({path:testInfo.outputPath('dashboard-en.png'),fullPage:true});
 await page.goto('/profile');await selectLanguage(page,'es-ES');await page.screenshot({path:testInfo.outputPath('profile-es.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
});
