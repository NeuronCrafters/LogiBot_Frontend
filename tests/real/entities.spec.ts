import {test,expect,languages,text,signIn,language,choose,call,screenFits} from './support';
for(const locale of languages){
 test(`entidades reais: cursos, professores, turmas e disciplinas ${locale}`,async({page,lab})=>{
  await signIn(page,process.env.E2E_ADMIN_EMAIL!,process.env.E2E_ADMIN_PASSWORD!);await page.goto('/profile');await language(page,locale);
  const create=async(path:string,endpoint:string,fill:()=>Promise<void>)=>{
   await page.goto(path);await fill();const pending=page.waitForResponse(r=>r.url().endsWith(endpoint)&&r.request().method()==='POST');
   await page.getByRole('button',{name:text(locale,'admin.criar'),exact:true}).click();const response=await pending;expect(response.status()).toBe(201);return response.json();
  };
  const courseName=`${lab.prefix} Curso completo ${locale}`;
  const course=(await create('/entities/create/course','/academic/courses',async()=>{
   await page.locator('main form input').first().fill(courseName);await choose(page,text(locale,'common.selecioneAUniversidade'),lab.university.name);
  })).course;
  const professorName=`${lab.prefix} Professor UI ${locale}`;
  const professor=(await create('/entities/create/professor','/admin/professors',async()=>{
   await page.locator('main form input[type=text]').fill(professorName);await page.locator('main form input[type=email]').fill(`${lab.prefix.toLowerCase()}-prof-${locale.toLowerCase()}@example.invalid`);
   await page.locator('main form input[type=password]').fill(lab.password);await choose(page,text(locale,'common.selecioneAUniversidade'),lab.university.name);await choose(page,text(locale,'common.selecioneOCurso'),courseName);
  })).professor;lab.accounts.add(professor.id);
  const className=`${lab.prefix} Turma completa ${locale}`;
  const group=(await create('/entities/create/class','/academic/classes',async()=>{
   await page.locator('main form input[type=text]').fill(className);await choose(page,text(locale,'common.selecioneAUniversidade'),lab.university.name);await choose(page,text(locale,'common.selecioneOCurso'),courseName);
  })).class;
  const subjectName=`${lab.prefix} Disciplina UI ${locale}`;
  const discipline=(await create('/entities/create/discipline','/academic/disciplines',async()=>{
   await page.locator('main form input[type=text]').fill(subjectName);await choose(page,text(locale,'common.selecioneAUniversidade'),lab.university.name);await choose(page,text(locale,'common.selecioneOCurso'),courseName);
   await page.getByRole('checkbox',{name:className,exact:true}).check();await page.getByRole('checkbox',{name:professorName,exact:true}).check();
  })).discipline;
  const hierarchy=await call(lab.admin,'GET','/academic/filters');const linkedCourse=hierarchy.data.universities.find((u:any)=>u.id===lab.university.id||u._id===lab.university.id).courses.find((c:any)=>c.id===course.id||c._id===course.id);
  const linkedSubject=linkedCourse.disciplines.find((d:any)=>d.id===discipline.id||d._id===discipline.id);expect(linkedSubject.classes).toHaveLength(1);expect(linkedSubject.professors).toHaveLength(1);
  for(const entry of [
   {name:subjectName,id:discipline.id,filter:'common.disciplinas',endpoint:'/academic/disciplines',course:true},
   {name:className,id:group.id,filter:'common.turmas',endpoint:'/academic/classes',course:true},
   {name:professorName,id:professor.id,filter:'common.professores',endpoint:'/admin/professors',course:false},
   {name:courseName,id:course.id,filter:'common.cursos',endpoint:'/academic/courses',course:false},
  ] as const){
   await page.goto('/entities');await choose(page,text(locale,'common.selecione_92'),text(locale,entry.filter));await choose(page,text(locale,'common.selecioneAUniversidade'),lab.university.name);
   if(entry.course)await choose(page,text(locale,'common.selecioneOCurso'),courseName);
   await page.getByRole('button',{name:text(locale,'admin.pesquisar'),exact:true}).click();let row=page.getByRole('row').filter({hasText:entry.name});
   const edit=row.getByRole('button',{name:text(locale,'admin.editarRegistro'),exact:true});await edit.focus();await expect(edit).toHaveCSS('opacity','1');await edit.press('Enter');
   let dialog=page.getByRole('dialog');await dialog.locator('input[type=text]').first().fill(entry.name+' editado');
   let pending=page.waitForResponse(r=>r.url().endsWith(`${entry.endpoint}/${entry.id}`)&&r.request().method()==='PATCH');await dialog.getByRole('button',{name:text(locale,'common.atualizar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
   await expect(dialog).toHaveCount(0);await screenFits(page);row=page.getByRole('row').filter({hasText:entry.name+' editado'});
   await row.getByRole('button',{name:text(locale,'common.excluir'),exact:true}).click();dialog=page.getByRole('dialog');pending=page.waitForResponse(r=>r.url().endsWith(`${entry.endpoint}/${entry.id}`)&&r.request().method()==='DELETE');await dialog.getByRole('button',{name:text(locale,'common.excluir'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
   if(entry.id===professor.id)lab.accounts.delete(professor.id);
  }
  await call(page.request,'POST','/auth/logout',{});
 });
}
