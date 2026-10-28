import { test as base, expect, request, type APIRequestContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type dictionary from '../../src/i18n/catalogs/pt-BR.json';
const pt=JSON.parse(readFileSync(new URL('../../src/i18n/catalogs/pt-BR.json',import.meta.url),'utf8')) as typeof dictionary;
const en=JSON.parse(readFileSync(new URL('../../src/i18n/catalogs/en-US.json',import.meta.url),'utf8')) as typeof dictionary;
const es=JSON.parse(readFileSync(new URL('../../src/i18n/catalogs/es-ES.json',import.meta.url),'utf8')) as typeof dictionary;
import { selectLanguage } from '../e2e/fixtures';
export type Language = 'pt-BR'|'en-US'|'es-ES';
export const languages:Language[] = ['pt-BR','en-US','es-ES'];
export const text=(language:Language,key:keyof typeof pt)=>({'pt-BR':pt,'en-US':en,'es-ES':es}[language][key]);
export async function call(api:APIRequestContext, method:string,path:string,data?:unknown,language:Language='pt-BR') {
 const response=await api.fetch(`/api${path}`,{method,data,headers:{'x-api-key':process.env.E2E_API_KEY||'','Accept-Language':language,'X-Language':language}});
 const value=await response.json();
 expect(response.ok(),`${method} ${path}: ${response.status()} ${value.code||value.message||''}`).toBeTruthy();
 return value;
}
export async function signIn(page:Page,email:string,password:string) {
 await page.goto('/signin');await page.locator('#signin-email-input').fill(email);await page.locator('#signin-password-input').fill(password);
 await Promise.all([page.waitForURL(url=>url.pathname!=='/signin'),page.locator('#signin-submit-button').click()]);
 await expect(page.getByRole('heading',{level:1}).first()).toBeVisible();
}
export async function language(page:Page,value:Language) {
 const current=page.locator('select').filter({has:page.locator('option[value=system]')}).first();
 if(await current.count() && await current.inputValue()===value) return;
 const saved=page.waitForResponse(response=>response.url().endsWith('/account/preferences')&&response.request().method()==='PATCH'&&response.request().postDataJSON()?.language===value);
 await selectLanguage(page,value);
 const response=await saved;expect(response.ok()).toBeTruthy();await expect(page.locator('html')).toHaveAttribute('lang',value);
}
export async function choose(page:Page,name:string,value:string) {
 await page.getByRole('combobox',{name,exact:true}).click();
 await page.getByRole('option',{name:value,exact:true}).click();
}
export async function screenFits(page:Page) {
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'largura da página').toBeTruthy();
 const dialog=page.getByRole('dialog');
 if(await dialog.count()) {
  const box=await dialog.last().boundingBox();expect(box).not.toBeNull();
  const size=page.viewportSize()!;expect(box!.x).toBeGreaterThanOrEqual(-1);expect(box!.x+box!.width).toBeLessThanOrEqual(size.width+1);
 }
}
export type Lab={prefix:string;university:any;course:any;group:any;discipline:any;professor:any;coordinator:any;student:any;password:string;admin:APIRequestContext;accounts:Set<string>;quizzes:Set<string>;documents:Set<string>};
export const test=base.extend<{}, {lab:Lab}>({
 lab:[async({},use,workerInfo)=>{
  const origin=new URL(process.env.E2E_BASE_URL||'http://localhost:5173');
  if(!['localhost','127.0.0.1'].includes(origin.hostname)||process.env.E2E_REAL_API!=='1')throw new Error('Testes reais exigem E2E_REAL_API=1 e frontend local.');
  if(!process.env.E2E_ADMIN_EMAIL||!process.env.E2E_ADMIN_PASSWORD)throw new Error('Configure E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD no .env local.');
  const admin=await request.newContext({baseURL:origin.origin});
  await call(admin,'POST','/auth/session',{email:process.env.E2E_ADMIN_EMAIL,password:process.env.E2E_ADMIN_PASSWORD});
  const original=await call(admin,'GET','/auth/me');
  const prefix=`E2E-${workerInfo.project.name}-${randomUUID().slice(0,8)}`;
  const lab:Lab={prefix,password:`Teste-${randomUUID()}!`,admin,accounts:new Set(),quizzes:new Set(),documents:new Set()} as Lab;
  try{
   lab.university=(await call(admin,'POST','/academic/universities',{name:`${prefix} Universidade`})).university;
   lab.course=(await call(admin,'POST','/academic/courses',{name:`${prefix} Curso`,universityId:lab.university.id})).course;
   lab.discipline=(await call(admin,'POST','/academic/disciplines',{name:`${prefix} Programação`,courseId:lab.course.id})).discipline;
   lab.group=(await call(admin,'POST','/academic/classes',{name:`${prefix} Turma`,courseId:lab.course.id,disciplineIds:[lab.discipline.id]})).class;
   for(const role of ['professor','coordinator'] as const){
    const account=(await call(admin,'POST','/admin/professors',{name:`${prefix} ${role}`,email:`${prefix.toLowerCase()}-${role}@example.invalid`,password:lab.password,school:lab.university.id,courses:[lab.course.id],classes:[lab.group.id],disciplines:[lab.discipline.id]})).professor;
    lab.accounts.add(account.id);lab[role]=account;
    if(role==='coordinator')await call(admin,'PATCH',`/admin/professors/${account.id}/role`,{action:'add'});
   }
   lab.student=(await call(admin,'POST','/auth/register',{name:`${prefix} Aluno`,email:`${prefix.toLowerCase()}-student@example.invalid`,password:lab.password,code:lab.group.registrationCode})).user.user;
   lab.accounts.add(lab.student.id);
   await use(lab);
  }finally{
   const failures:string[]=[];
   const clean=async(path:string)=>{try{await call(admin,'DELETE',path);}catch(error){failures.push(String(error));}};
   for(const id of lab.documents)await clean(`/rag/documents/${id}`);
   for(const quiz of await call(admin,'GET','/quiz/professor'))if(quiz.title?.startsWith(prefix))lab.quizzes.add(quiz.id);
   for(const id of lab.quizzes)await clean(`/quiz/professor/${id}`);
   const students=await call(admin,'GET','/admin/students');
   for(const account of students)if(account.email.startsWith(prefix.toLowerCase()))lab.accounts.add(account.id);
   for(const id of lab.accounts)await clean(`/admin/professors/${id}`);
   if(lab.university)await clean(`/academic/universities/${lab.university.id}`);
   await call(admin,'PATCH','/account/preferences',{language:original.preferredLanguage??null});
   await admin.dispose();expect(failures,'limpeza de fixtures reais').toEqual([]);
  }
 },{scope:'worker'}]
});
export {expect,selectLanguage};
