import { test,expect,languages,text,signIn,language,call,screenFits,selectLanguage } from './support';

for(const locale of languages){
 test(`conta real: cadastro, edição e preferência ${locale}`,async({page,lab})=>{
  const suffix=locale.toLowerCase();
  const email=`${lab.prefix.toLowerCase()}-${suffix}@example.invalid`;
  await page.goto('/signin');
  await selectLanguage(page,'pt-BR');
  await page.getByRole('button',{name:text('pt-BR','auth.facaSeuCadastro'),exact:true}).click();
  if(await page.getByRole('dialog').count())await page.getByRole('button',{name:text('pt-BR','common.aceitoOsTermos'),exact:true}).click();
  await page.locator('#signup-name-input').fill(`${lab.prefix.replaceAll("-"," ")} ${locale.replace("-"," ")}`);
  await page.locator('#signup-email-input').fill(email);await page.locator('#signup-password-input').fill(lab.password);await page.locator('#signup-code-input').fill(lab.group.registrationCode);
  const registered=page.waitForResponse(r=>r.url().endsWith('/auth/register')&&r.request().method()==='POST');
  await page.locator('#signup-submit-button').click();const response=await registered;expect(response.status()).toBe(201);
  const account=(await response.json()).user.user;lab.accounts.add(account.id);
  await page.waitForURL(url=>!['/signup','/signin'].includes(url.pathname));await page.goto('/profile');await language(page,locale);
  await screenFits(page);
  await page.getByRole('button',{name:text(locale,'account.editName'),exact:true}).click();
  let dialog=page.getByRole('dialog');await dialog.getByRole('textbox').fill(`${lab.prefix} Nome editado`);
  let pending=page.waitForResponse(r=>r.url().endsWith('/account/name')&&r.request().method()==='PATCH');
  await dialog.getByRole('button',{name:text(locale,'common.salvar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  await expect(page.locator('main h1')).toHaveText(`${lab.prefix} Nome editado`);
  const changedEmail=email.replace('@','-edited@');
  await page.getByRole('button',{name:text(locale,'account.editEmail'),exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByRole('textbox').fill(changedEmail);
  pending=page.waitForResponse(r=>r.url().endsWith('/account/email')&&r.request().method()==='PATCH');
  await dialog.getByRole('button',{name:text(locale,'common.salvar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();
  await expect(page.getByText(changedEmail,{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:text(locale,'account.editEmail'),exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByRole('textbox').fill(process.env.E2E_ADMIN_EMAIL!);
  pending=page.waitForResponse(r=>r.url().endsWith('/account/email')&&r.request().method()==='PATCH');
  await dialog.getByRole('button',{name:text(locale,'common.salvar'),exact:true}).click();expect((await pending).status()).toBe(409);
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('textbox')).toHaveValue(process.env.E2E_ADMIN_EMAIL!);await expect(dialog.getByRole('button',{name:text(locale,'common.salvar'),exact:true})).toBeEnabled();await dialog.getByRole('textbox').focus();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:text(locale,'account.alterarSenha_73'),exact:true}).click();dialog=page.getByRole('dialog');
  await dialog.locator('input').nth(0).fill(lab.password);await dialog.locator('input').nth(1).fill(lab.password+'new');await dialog.locator('input').nth(2).fill(lab.password+'new');
  pending=page.waitForResponse(r=>r.url().endsWith('/account/password')&&r.request().method()==='PATCH');await dialog.getByRole('button',{name:text(locale,'common.salvar'),exact:true}).click();expect((await pending).ok()).toBeTruthy();await expect(dialog).toHaveCount(0);
  await call(page.request,'POST','/auth/logout',{});await page.goto('/signin');await signIn(page,changedEmail,lab.password+'new');await page.goto('/profile');
  await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('main h1')).toHaveText(`${lab.prefix} Nome editado`);
  const saved=page.waitForResponse(r=>r.url().endsWith('/account/preferences')&&r.request().postDataJSON()?.language===null);
  const selector=page.locator('main select').first();await selector.selectOption('system');expect((await saved).ok()).toBeTruthy();
  await page.reload();await expect(page.locator('main select').first()).toHaveValue('system');
  await language(page,locale);await page.goto('/feedback');await page.getByRole('button').filter({has:page.getByText(text(locale,'common.geral'),{exact:true})}).click();
  await page.getByRole('textbox').fill(`${lab.prefix} Feedback ${locale}`);
  const feedback=page.waitForResponse(r=>r.url().endsWith('/feedback')&&r.request().method()==='POST');await page.getByRole('button',{name:text(locale,'feedback.enviarFeedback'),exact:true}).click();expect((await feedback).ok()).toBeTruthy();await expect(page.getByRole('textbox')).toHaveValue('');
  await call(page.request,'POST','/auth/logout',{});
 });
}
