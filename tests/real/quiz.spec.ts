import {test,expect,languages,text,signIn,language,choose,call,screenFits} from './support';
for(const locale of languages){
 test(`quiz real: criar, editar, publicar, resolver e excluir ${locale}`,async({page,lab,browser})=>{
  await signIn(page,lab.professor.email,lab.password);await page.goto('/quiz/manage');await language(page,locale);
  const title=`${lab.prefix} Quiz ${locale}`;
  await page.getByRole('button',{name:text(locale,'common.criarQuiz'),exact:true}).first().click();
  let dialog=page.getByRole('dialog');await dialog.getByRole('combobox',{name:text(locale,'language.content')}).selectOption(locale);
  await dialog.getByRole('textbox').first().fill(title);await choose(page,text(locale,'common.selecioneADisciplina'),lab.discipline.name);await choose(page,text(locale,'quiz.selecioneOTopico'),text(locale,'common.variaveis'));
  let pending=page.waitForResponse(r=>r.url().endsWith('/quiz/professor')&&r.request().method()==='POST');await dialog.getByRole('button',{name:text(locale,'common.criarQuiz'),exact:true}).click();
  const created=await pending;expect(created.status()).toBe(201);const quiz=await created.json();lab.quizzes.add(quiz.id);expect(quiz.language).toBe(locale);
  const card=page.locator('main div.overflow-hidden.rounded-2xl').filter({has:page.getByText(title,{exact:true})}).first();
  await card.getByRole('button',{name:text(locale,'quiz.perguntas'),exact:true}).click();await card.getByRole('button',{name:text(locale,'quiz.adicionarPergunta'),exact:true}).click();
  const form=card.locator('form');await form.locator('input').nth(0).fill('Qual valor a variável armazena?');
  for(let i=0;i<4;i++)await form.locator('input').nth(i+1).fill(['Valor original A','Valor original B','Valor original C','Valor original D'][i]);
  await form.getByRole('combobox').click();await page.getByRole('option',{name:'A — Valor original A',exact:true}).click();
  pending=page.waitForResponse(r=>r.url().endsWith(`/quiz/professor/${quiz.id}/questions`)&&r.request().method()==='POST');await form.getByRole('button',{name:text(locale,'quiz.adicionar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  await card.getByRole('button',{name:text(locale,'common.editar'),exact:true}).first().click();dialog=page.getByRole('dialog');await dialog.getByRole('textbox').first().fill(title+' editado');
  pending=page.waitForResponse(r=>r.url().endsWith(`/quiz/professor/${quiz.id}`)&&r.request().method()==='PUT');await dialog.getByRole('button',{name:text(locale,'quiz.salvarAlteracoes'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  const updated=page.locator('main div.overflow-hidden.rounded-2xl').filter({has:page.getByText(title+' editado',{exact:true})}).first();
  pending=page.waitForResponse(r=>r.url().endsWith(`/quiz/professor/${quiz.id}/publish`));await updated.getByRole('button',{name:text(locale,'quiz.publicar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  const studentContext=await browser.newContext({locale:'pt-BR',viewport:page.viewportSize()!});const student=await studentContext.newPage();
  try{
   await signIn(student,lab.student.email,lab.password);await student.goto(`/quiz/${quiz.id}`);await language(student,locale);await expect(student.getByText('Qual valor a variável armazena?',{exact:true})).toBeVisible();
   await student.getByRole('button').filter({hasText:'Valor original A'}).click();await screenFits(student);
   const attempt=student.waitForResponse(r=>r.url().endsWith(`/quiz/student/${quiz.id}/attempt`));await student.getByRole('button',{name:text(locale,'quiz.finalizar'),exact:true}).click();expect((await attempt).ok()).toBeTruthy();
   await expect(student.getByText(text(locale,'common.aproveitamento'),{exact:true})).toBeVisible();await call(student.request,'POST','/auth/logout',{});
  }finally{await studentContext.close();}
  await updated.getByRole('button',{name:text(locale,'quiz.resultados'),exact:true}).click();await expect(page.getByRole('dialog')).toContainText(lab.student.name);await page.keyboard.press('Escape');
  pending=page.waitForResponse(r=>r.url().endsWith(`/quiz/professor/${quiz.id}/unpublish`));await updated.getByRole('button',{name:text(locale,'quiz.despublicar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  await updated.getByRole('button',{name:new RegExp(title)}).click();dialog=page.getByRole('dialog');pending=page.waitForResponse(r=>r.url().endsWith(`/quiz/professor/${quiz.id}`)&&r.request().method()==='DELETE');await dialog.getByRole('button',{name:text(locale,'common.excluir'),exact:true}).click();expect((await pending).ok()).toBeTruthy();lab.quizzes.delete(quiz.id);
  await call(page.request,'POST','/auth/logout',{});
 });
}
