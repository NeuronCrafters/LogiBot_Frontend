import type { Page } from "@playwright/test";

export const ids = {university:"00000000-0000-4000-8000-000000000001",course:"00000000-0000-4000-8000-000000000002",class:"00000000-0000-4000-8000-000000000003",discipline:"00000000-0000-4000-8000-000000000004",quiz:"00000000-0000-4000-8000-000000000005"};
export const quiz={id:ids.quiz,title:"Quiz original em português",topic:"variaveis",description:"Descrição original",disciplineId:ids.discipline,disciplineName:"Lógica original",questionCount:1,status:"published",language:"pt-BR",createdAt:"2026-10-28T12:00:00Z",questions:[{id:"question",question:"Qual é o valor original?",options:["Valor original A","Valor original B","Valor original C","Valor original D"],orderIndex:0}]};

export async function mockApi(page:Page,role:string="student"){
 const requests:{path:string;language:string;body:any}[]=[];
 let preference:string|null=null;
 await page.addInitScript(()=>{localStorage.setItem("has_session","1");});
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),pathname=url.pathname.replace(/^\/api/,"");
  const language=request.headers()['x-language']||request.headers()['accept-language']||'pt-BR';
  let body:any;try{body=request.postDataJSON();}catch{}
  requests.push({path:pathname,language,body});
  const user={id:"test-user",_id:"test-user",name:"João da Silva",email:"joao@example.invalid",role:[role],preferredLanguage:preference,school:ids.university,schoolId:[ids.university],schoolName:["Universidade original"],courseId:[ids.course],courseName:["Curso original"],classId:[ids.class],className:["Turma original"],courses:[ids.course],classes:[ids.class],disciplines:[{id:ids.discipline,_id:ids.discipline,name:"Lógica original"}],disciplineId:[ids.discipline]};
  const university={id:ids.university,_id:ids.university,name:"Universidade original",courses:[{id:ids.course,_id:ids.course,name:"Curso original",classes:[{id:ids.class,_id:ids.class,name:"Turma original",disciplines:[{id:ids.discipline,_id:ids.discipline,name:"Lógica original"}],students:[]}],disciplines:[{id:ids.discipline,_id:ids.discipline,name:"Lógica original",professors:[{id:"test-user",_id:"test-user",name:user.name}]}]}]};
  let data:any=[];
  if(pathname==='/auth/me')data=user;
  else if(pathname==='/auth/session')data={success:true,user};
  else if(pathname==='/account/preferences'){preference=body.language;data={preferredLanguage:preference,language,message:"ok"};}
  else if(pathname==='/academic/filters')data={data:{universities:[university]}};
  else if(pathname==='/rag/classes')data={classes:[{id:ids.class,name:"Turma original",courseName:"Curso original",universityName:"Universidade original"}]};
  else if(pathname.endsWith('/settings'))data={classId:ids.class,ragMode:"context",topK:4,minScore:40,systemPrompt:null};
  else if(pathname.endsWith('/documents'))data={documents:[{id:"document",title:"Material original em português",originalFileName:"material-original.txt",status:"ready",chunkCount:1,fileSize:1000,createdAt:"2026-10-28T12:00:00Z"}]};
  else if(pathname==='/quiz/professor/generate-ai')data={quiz:{...quiz,language:body.language},questionCount:5};
  else if(pathname==='/quiz/professor'&&request.method()==='POST')data={...quiz,...body};
  else if(pathname==='/quiz/student/hub'||pathname==='/quiz/professor')data=[quiz];
  else if(pathname===`/quiz/student/${ids.quiz}`)data=quiz;
  else if(pathname.endsWith('/questions'))data=quiz.questions.map(q=>({...q,correctOption:"A",explanation:"Explicação original"}));
  else if(pathname.startsWith('/quiz/history'))data=[];
  else if(pathname.includes('/summary'))data={totalCorrectAnswers:8,totalWrongAnswers:2,usageTimeInSeconds:3600,dailyUsage:[{date:"2026-10-28",usage:60}],subjectCounts:{variaveis:4}};
  else if(pathname.includes('topic-performance'))data=[{topic:"variaveis",successPercentage:80,errorPercentage:20}];
  else if(pathname.includes('proficiency'))data={labels:["variaveis"],data:[80]};
  else if(pathname.includes('effort'))data={points:[],averages:{avgPerformance:80,avgEffort:60}};
  else if(pathname.includes('learning'))data={labels:["Quiz original em português"],data:[80]};
  else if(pathname.includes('insights/'))data={language,insight:language==='en-US'?'## Main findings\nEnglish insight.':language==='es-ES'?'## Lectura principal\nAnálisis en español.':'## Leitura principal\nAnálise em português.',generatedAt:"2026-10-28T12:00:00Z",cached:false};
  else if(pathname.startsWith('/chat/sessions')&&pathname.endsWith('/messages'))data=[{id:"message",role:"assistant",content:"Resposta original em português.",metadata:{outputLanguage:"pt-BR"}}];
  else if(pathname.startsWith('/chat/sessions'))data=[];
  else if(pathname==='/chat/messages/stream'){
   const answer=language==='en-US'?'A variable stores a value.':language==='es-ES'?'Una variable almacena un valor.':'Uma variável armazena um valor.';
   await route.fulfill({status:200,contentType:'text/event-stream',body:`event: session\ndata: {"sessionId":"session","userMessageId":"message"}\n\nevent: token\ndata: ${JSON.stringify({text:answer})}\n\nevent: done\ndata: {"provider":"openrouter"}\n\n`});return;
  }
  await route.fulfill({status:200,contentType:'application/json',headers:{'Content-Language':language},body:JSON.stringify(data)});
 });
 return requests;
}

export async function selectLanguage(page:Page,language:string){
 let selector=page.locator('select:visible').filter({has:page.locator('option[value="system"]')}).first();
 const open=page.getByRole('button',{name:/Abrir menu|Open menu|Abrir menú/});
 await selector.or(open).first().waitFor({state:'visible'});
 if(!await selector.isVisible()){
  await open.click();
  selector=page.locator('select:visible').filter({has:page.locator('option[value="system"]')}).first();
 }
 await selector.selectOption(language);
 const close=page.getByRole('button',{name:/Fechar menu|Close menu|Cerrar menú/});
 if(await close.count())await close.first().click();
}
