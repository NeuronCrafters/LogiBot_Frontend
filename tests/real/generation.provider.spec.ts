import {test,expect,languages,text,signIn,language,choose,call,screenFits} from './support';
import type {Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const material=`Material original para teste de programação.
Variáveis e atribuição: uma variável associa um nome a um valor. A atribuição x = 7 armazena o número 7 em x. Uma nova atribuição x = 9 substitui o valor anterior. Uma constante não permite reatribuição. Em JavaScript let permite reatribuir; const impede reatribuir a mesma referência. Uma expressão calcula um valor, como 2 + 3, cujo resultado é 5. Um valor inteiro representa um número sem parte fracionária. Uma string representa texto. Um booleano representa verdadeiro ou falso. Um if executa um bloco quando a condição é verdadeira. Um for repete um bloco conforme uma condição.
Variables and assignment: a variable associates a name with a value. Assignment x = 7 stores number 7 in x. Assignment x = 9 replaces the previous value. A constant does not allow reassignment. JavaScript let allows reassignment; const prevents reassignment of the same reference. Expression 2 + 3 evaluates to 5. Integers have no fractional part. Strings represent text. Booleans represent true or false. An if executes its block when its condition is true. A for repeats a block according to its condition.
Variables y asignación: una variable asocia un nombre con un valor. La asignación x = 7 guarda el número 7 en x. La asignación x = 9 reemplaza el valor anterior. Una constante no permite reasignación. En JavaScript let permite reasignar y const impide reasignar la misma referencia. La expresión 2 + 3 produce 5. Los enteros no tienen parte fraccionaria. Las cadenas representan texto. Los booleanos representan verdadero o falso. Un if ejecuta su bloque cuando la condición es verdadera. Un for repite un bloque según su condición.`;
async function auditContent(page:Page){
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 expect(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);await screenFits(page);
}
for(const locale of languages){
 test(`serviços reais: RAG, quiz IA, chat e insight ${locale}`,async({page,lab,browser},testInfo)=>{
  test.setTimeout(300000);
  await signIn(page,lab.professor.email,lab.password);await page.goto('/rag');await language(page,locale);
  const classSelect=page.locator('main button[role=combobox]').first();await classSelect.click();await page.getByRole('option',{name:`${lab.course.name} — ${lab.group.name}`,exact:true}).click();
  await page.getByRole('button').filter({has:page.getByText(text(locale,'common.context'),{exact:true})}).click();
  const save=page.waitForResponse(r=>r.url().endsWith(`/rag/classes/${lab.group.id}/settings`)&&r.request().method()==='PATCH');
  await page.getByRole('button',{name:text(locale,'rag.salvarConfiguracoes'),exact:true}).click();expect((await save).ok()).toBeTruthy();
  await page.getByRole('button',{name:text(locale,'common.documentos'),exact:true}).click();
  await page.locator('input[type=file]').setInputFiles({name:`${lab.prefix}-${locale}.txt`,mimeType:'text/plain',buffer:Buffer.from(material)});
  const title=`${lab.prefix} Material original ${locale}`;await page.getByPlaceholder(text(locale,'rag.tituloOpcional')).fill(title);
  const upload=page.waitForResponse(r=>r.url().endsWith(`/rag/classes/${lab.group.id}/documents`)&&r.request().method()==='POST');
  await page.getByRole('button',{name:text(locale,'rag.enviar'),exact:true}).click();const uploaded=await upload;expect(uploaded.status()).toBe(201);
  const document=(await uploaded.json()).document;lab.documents.add(document.id);
  await expect.poll(async()=>{const data=await call(page.request,'GET',`/rag/classes/${lab.group.id}/documents`);return data.documents.find((d:any)=>d.id===document.id)?.status;},{timeout:120000,intervals:[1000,2000,3000]}).toBe('ready');
  await page.reload();await page.getByRole('button',{name:text(locale,'common.documentos'),exact:true}).click();await expect(page.getByText(title,{exact:true})).toBeVisible();await auditContent(page);
  const row=page.getByRole('listitem').filter({has:page.getByText(title,{exact:true})});
  const reprocessed=page.waitForResponse(r=>r.url().endsWith(`/rag/documents/${document.id}/reprocess`));await row.getByRole('button',{name:text(locale,'rag.reprocessar'),exact:true}).click();expect((await reprocessed).status()).toBe(202);
  await expect.poll(async()=>{const data=await call(page.request,'GET',`/rag/classes/${lab.group.id}/documents`);return data.documents.find((d:any)=>d.id===document.id)?.status;},{timeout:120000,intervals:[1000,2000,3000]}).toBe('ready');
  await page.goto('/quiz/manage');await page.getByRole('button',{name:text(locale,'common.criarComIa'),exact:true}).first().click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('combobox',{name:text(locale,'language.content')}).selectOption(locale);await dialog.locator('select').nth(1).selectOption(lab.discipline.id);
  await dialog.getByRole('textbox').first().fill('Variables, assignment and constants / Variáveis, atribuição e constantes / Variables, asignación y constantes');
  await dialog.getByRole('button',{name:'3',exact:true}).click();await dialog.getByRole('button').filter({hasText:title}).click();
  const quizTitle=`${lab.prefix} IA ${locale}`;await dialog.getByPlaceholder(text(locale,'quiz.deixeEmBrancoParaAIaSugerir')).fill(quizTitle);
  await auditContent(page);
  const generated=page.waitForResponse(r=>r.url().endsWith('/quiz/professor/generate-ai'),{timeout:180000});await dialog.getByRole('button',{name:text(locale,'quiz.gerarQuizComIa'),exact:true}).click();const generatedResponse=await generated;expect(generatedResponse.status()).toBe(201);const quiz=await generatedResponse.json();lab.quizzes.add(quiz.quiz.id);
  expect(quiz.quiz.language).toBe(locale);expect(quiz.questions).toHaveLength(3);expect(quiz.sourceSummary.documentCount).toBeGreaterThan(0);
  const card=page.locator('main div.overflow-hidden.rounded-2xl').filter({has:page.getByText(quizTitle,{exact:true})}).first();await expect(card).toBeVisible();await card.getByRole('button',{name:text(locale,'quiz.perguntas'),exact:true}).click();await auditContent(page);
  const studentContext=await browser.newContext({locale:'pt-BR'});const student=await studentContext.newPage();let answer='';
  try{
   await signIn(student,lab.student.email,lab.password);await student.goto('/profile');await language(student,locale);await student.goto('/chat');
   const question={ 'pt-BR':'Segundo o material, o que acontece ao atribuir x = 7 e depois x = 9?', 'en-US':'According to the material, what happens when assigning x = 7 and then x = 9?', 'es-ES':'Según el material, ¿qué ocurre al asignar x = 7 y luego x = 9?' }[locale];
   const streamed=student.waitForResponse(r=>r.url().endsWith('/chat/messages/stream'),{timeout:120000});await student.getByRole('textbox').fill(question);await student.getByRole('button',{name:text(locale,'chat.enviarMensagem'),exact:true}).click();
   const streamResponse=await streamed;expect(streamResponse.ok()).toBeTruthy();const stream=await streamResponse.text();expect(stream).toContain('event: done');expect(stream).not.toContain('event: error');
   answer=stream.split('\n').filter(line=>line.startsWith('data: ')).flatMap(line=>{try{const value=JSON.parse(line.slice(6));return value.text?[value.text]:[];}catch{return [];}}).join('');
   expect(answer.length).toBeGreaterThan(30);await expect(student.getByText(question,{exact:true})).toBeVisible();await expect(student.locator(`[lang="${locale}"]`).filter({has:student.locator('p')}).last()).toBeVisible();
   await auditContent(student);await call(student.request,'POST','/auth/logout',{});
  }finally{await studentContext.close();}
  await page.goto('/dashboard');await choose(page,text(locale,'dashboard.selecioneUmaEntidade'),text(locale,'common.disciplina'));
  await expect(page.getByRole('combobox',{name:lab.course.name,exact:true})).toBeVisible();
  await choose(page,text(locale,'academic.selectSubject'),lab.discipline.name);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:text(locale,'dashboard.baixarGraficoComoPng')}).first().click();await (await download).saveAs(testInfo.outputPath(`chart-${locale}.png`));
  const insightPending=page.waitForResponse(r=>r.url().endsWith('/dashboard/insights/overview'),{timeout:120000});await page.getByRole('button',{name:text(locale,'dashboard.gerarAnaliseGeral'),exact:true}).click();const insightResponse=await insightPending;expect(insightResponse.ok()).toBeTruthy();const insight=await insightResponse.json();expect(insight.language).toBe(locale);expect(insight.insight.length).toBeGreaterThan(30);
  await testInfo.attach('generated-content',{body:JSON.stringify({language:locale,quiz,answer,insight},null,2),contentType:'application/json'});
  await expect(page.getByRole('dialog').locator(`[lang="${locale}"]`)).toBeVisible();await auditContent(page);await page.keyboard.press('Escape');
  await page.goto('/rag');await page.getByRole('button',{name:text(locale,'common.documentos'),exact:true}).click();
  const removal=page.waitForResponse(r=>r.url().endsWith(`/rag/documents/${document.id}`)&&r.request().method()==='DELETE');await page.getByRole('listitem').filter({hasText:title}).getByRole('button',{name:text(locale,'common.remover'),exact:true}).click();expect((await removal).ok()).toBeTruthy();await expect(page.getByText(title,{exact:true})).toHaveCount(0);lab.documents.delete(document.id);
  await call(page.request,'POST','/auth/logout',{});
 });
}
