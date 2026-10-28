import {test,expect,languages,text,signIn,language,choose,call,screenFits} from './support';
for(const locale of languages){
 test(`gestão real: criar, editar, vincular e remover ${locale}`,async({page,lab})=>{
  await signIn(page,process.env.E2E_ADMIN_EMAIL!,process.env.E2E_ADMIN_PASSWORD!);await page.goto('/profile');await language(page,locale);
  const title=`${lab.prefix} Universidade UI ${locale}`;
  await page.goto('/entities/create/university');await page.locator('main form input').first().fill(title);
  let pending=page.waitForResponse(r=>r.url().endsWith('/academic/universities')&&r.request().method()==='POST');await page.getByRole('button',{name:text(locale,'admin.criar'),exact:true}).click();const created=await pending;expect(created.status()).toBe(201);const university=(await created.json()).university;
  try{
   await page.goto('/entities/create/course');await page.locator('main form input').first().fill(`${lab.prefix} Curso UI ${locale}`);await choose(page,text(locale,'common.selecioneAUniversidade'),title);
   pending=page.waitForResponse(r=>r.url().endsWith('/academic/courses')&&r.request().method()==='POST');await page.getByRole('button',{name:text(locale,'admin.criar'),exact:true}).click();expect((await pending).status()).toBe(201);
   await page.goto('/entities');await choose(page,text(locale,'common.selecione_92'),text(locale,'common.universidades'));await page.getByRole('button',{name:text(locale,'admin.pesquisar'),exact:true}).click();
   let row=page.getByRole('row').filter({hasText:title});await row.hover();await row.getByRole('button',{name:text(locale,'admin.editarRegistro'),exact:true}).click();
   const dialog=page.getByRole('dialog');await dialog.locator('input').first().fill(title+' editada');
   pending=page.waitForResponse(r=>r.url().endsWith(`/academic/universities/${university.id}`)&&r.request().method()==='PATCH');
   await dialog.getByRole('button',{name:text(locale,'common.atualizar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
   await screenFits(page);
   row=page.getByRole('row').filter({hasText:title+' editada'});await row.hover();await row.getByRole('button',{name:text(locale,'common.excluir'),exact:true}).click();
   pending=page.waitForResponse(r=>r.url().endsWith(`/academic/universities/${university.id}`)&&r.request().method()==='DELETE');await page.getByRole('dialog').getByRole('button',{name:text(locale,'common.excluir'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  }finally{
   const list=await call(lab.admin,'GET','/academic/universities');if(list.some((u:any)=>u.id===university.id))await call(lab.admin,'DELETE',`/academic/universities/${university.id}`);
  }
  await call(page.request,'POST','/auth/logout',{});await page.goto('/signin');await signIn(page,lab.coordinator.email,lab.password);await page.goto('/profile');await language(page,locale);
  await page.goto('/entities/create/class');await page.locator('main form input[type=text]').first().fill(`${lab.prefix} Turma UI ${locale}`);
  const createdClass=page.waitForResponse(r=>r.url().endsWith('/academic/classes')&&r.request().method()==='POST');await page.getByRole('button',{name:text(locale,'admin.criar'),exact:true}).click();const classResponse=await createdClass;expect(classResponse.status()).toBe(201);const group=(await classResponse.json()).class;
  await call(lab.admin,'DELETE',`/academic/classes/${group.id}`);
  await page.goto('/entities/create/university');await expect(page.getByText(text(locale,'admin.voceNaoTemPermissaoParaAcessarEsta'),{exact:true})).toBeVisible();
  await call(page.request,'POST','/auth/logout',{});
 });
}
