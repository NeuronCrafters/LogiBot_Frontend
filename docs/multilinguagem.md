# Implementação do levantamento de multilinguagem

## Correspondência com as tarefas

| Seção do levantamento | Implementação no frontend |
|---|---|
| Preservação e fundação | Catálogos independentes para PT/EN/ES, fallback português, tipo `Language`, chaves tipadas, i18next/react-i18next inicializados antes da autenticação; `html.lang` reativo; fixture de textos portugueses |
| Seleção e persistência | `LanguageSwitcher`, `LanguagePreferenceSync`, normalização das variantes, preferência local/conta/navegador, fila de gravação, resposta atrasada protegida e retry visível |
| Transporte | Interceptors de `api` e `publicApi` e headers do `fetch` SSE consultam o idioma por requisição; `Accept-Language`, `X-Language` explícito, tipos `preferredLanguage`, `outputLanguage` e `language` |
| Áreas da interface | Páginas públicas, autenticação e consentimento, recuperação de senha, sidebar/mobile, conta, gestão acadêmica, administração, chat, quizzes, RAG, dashboard, feedback e componentes compartilhados |
| Erros e validações | Mensagens da API preservadas quando correspondem ao idioma atual; fallback localizado para rede, erro inesperado ou resposta em idioma anterior; validação nativa localizada; toasts locais usam chaves e parâmetros |
| Chat | Estágios operacionais traduzidos; parser SSE e Markdown preservados; tokens e metadados da geração atual mantidos; próxima geração acompanha a nova escolha; histórico não é traduzido |
| Quizzes | Campo `language` nos tipos e na criação manual/IA; idioma do conteúdo independente; legado desconhecido; códigos dos tópicos, enunciados, alternativas e seleções preservados |
| Caches e concorrência | Insights com idioma na chave e no pedido; proteção contra resposta antiga; retorno ao idioma anterior reutiliza seu cache; rótulos de gráficos recalculados na interface |
| Formatação regional | `Intl.DateTimeFormat`, `Intl.NumberFormat` e `Intl.RelativeTimeFormat`, duração e plurais; datas técnicas e cálculos mantidos; datas sem horário não deslocam o dia |
| Gráficos e exportações | Títulos, descrições, legendas, unidades, tooltips, estados e ações traduzidos; PNG captura o gráfico atual e usa nome localizado; séries e `dataKey` mantidos |
| Acessibilidade e responsividade | Idioma do documento e conteúdo conhecido, nomes acessíveis, controles nativos de idioma, semântica dos selects e modais, Escape, foco e retorno ao acionador; cenários desktop/mobile |
| Testes e empacotamento | Lockfile, `npm ci`, build e testes Docker, auditoria de catálogo, Vitest, Playwright e ESLint alinhado ao projeto; Nginx com proxy local e fallback de rotas SPA |

O helper de CSV existente não tinha consumidores na aplicação inspecionada. Foi preservado, sem alterar seus contratos ou introduzir uma exportação nova.

## Contratos utilizados

- `Accept-Language` acompanha o idioma efetivo de cada nova chamada.
- `X-Language` representa a escolha explícita da sessão. O idioma automático do navegador não é convertido em uma escolha explícita antes do login.
- Gerações e insights capturam o idioma no início. Mudar a interface não reescreve uma resposta já produzida.
- A preferência usa `PATCH /account/preferences`, com `{language: "pt-BR" | "en-US" | "es-ES" | null}`.
- Quizzes usam `language` no conteúdo e no pedido de criação. Editar um quiz existente não inventa nem altera seu idioma.
- `Content-Language` é considerado pelo tratamento de erros. Não se compara uma frase traduzida para decidir status HTTP ou permissões.
- A recuperação usa `POST /auth/password-reset-requests` e `POST /auth/password-reset`; as rotas públicas correspondentes são `/forgot-password` e `/reset-password?token=...`.
- O componente legado de mensagens pode receber `type: "instruction"` para a apresentação operacional; não infere essa apresentação comparando frases traduzidas. O texto recebido é preservado.

## Matriz automatizada

| Cenário | Evidência |
|---|---|
| Navegador, variantes, fallback, storage inválido, conta e logout | Testes de negociação e precedência |
| Preferência salva, retorno ao navegador e falha de persistência | Testes de integração de componentes e requests simulados |
| Clientes públicos/autenticados e headers congelados por requisição | Testes de transporte Axios |
| SSE fragmentado e UTF-8 | Testes do parser com resposta fragmentada |
| Mudança durante geração | Teste do hook conserva os tokens e o idioma inicial e aplica a escolha à próxima geração |
| Formulários e consentimento | Componentes e navegador conservam os valores e traduzem as ações |
| Quiz em tentativa | Navegador conserva enunciado e alternativa selecionada ao mudar a interface |
| Interface PT e conteúdo EN/ES | Navegador verifica o payload da criação manual e por IA, sem traduzir os materiais |
| Insights concorrentes e cache | Resposta ES chega antes da EN; a EN antiga não substitui ES e é reutilizada ao retornar a EN |
| Datas, duração, números, percentuais e plurais | Testes unitários de convenções regionais e valores originais |
| Perfis | Aluno, professor, coordenador e administrador na navegação/perfil; páginas de gestão verificadas como administrador |
| Desktop e mobile | Mesma matriz nos dois projetos Playwright; preservação de entrada e verificação de largura nas telas públicas e perfil |
| Acessibilidade | Testes de idioma, rótulos, foco/Escape do modal, validação nativa e navegação dos selects |
| PNG | Download real de `html-to-image`, com nome de arquivo e capturas do dashboard em inglês e perfil em espanhol |
| Proxy/API real | Saúde HTTP 200 e erro de autenticação HTTP 401 com `Content-Language` e código estável nos três idiomas |

## Alcance e limites

A suíte controlada continua verificando contratos, preservação dos dados, concorrência e falhas sem depender do provedor. Foi acrescentada uma suíte com sessões reais contra a API local, contas temporárias de aluno/professor/coordenador e a conta administrativa configurada no `.env`. Os dados temporários são removidos e a preferência administrativa original é restaurada ao terminar.

A homologação real cobre cadastro/consentimento, nome, e-mail, conflito HTTP 409, alteração de senha autenticada, novo login e preferência persistida; envio de feedback; criação, edição, exclusão e vínculos acadêmicos; permissões de coordenador; criação manual, pergunta, edição, publicação, tentativa, resultados, despublicação e exclusão de quiz. Esses fluxos rodam nos três idiomas em desktop e mobile.

O cenário de integração dos serviços realiza upload de TXT, processamento pelo worker, reprocessamento, geração real de três questões a partir do documento, chat por SSE, insight geral, exportação PNG e exclusão do material. Verifica metadados de idioma, fontes do quiz e respostas sem erro; guarda o conteúdo gerado para revisão. A geração usa os serviços e credenciais existentes, não certifica a correção semântica de toda resposta possível do modelo nem todos os formatos de material.

A auditoria axe cobre WCAG 2 A/AA e 2.1 A/AA nas 18 rotas da matriz, nos três idiomas e dois tamanhos de tela, além de modais do perfil/quiz e dashboard com gráficos preenchidos. Inclui nomes dos pontos e setores dos gráficos, contraste, foco e rolagem do insight. A inspeção visual usa capturas desktop/mobile; a automação não substitui uma avaliação manual exaustiva com todas as tecnologias assistivas.

Por decisão do usuário, a validação da entrega de e-mail e do link de recuperação de senha está excluída. A alteração autenticada de senha foi validada. A implantação em VPS também está excluída. Nenhum arquivo do backend foi alterado nesta etapa.

O build original foi compilado em Docker antes da implementação. O aviso de tamanho de chunk do Vite também existia na base; a implementação não altera sua classificação para erro nem aumenta o limite para ocultá-lo. A configuração original de lint foi alinhada ao formato flat config e às dependências já declaradas. Os ajustes de hooks preservam permissões e evitam chamadas condicionais e efeitos com dependências instáveis.

Nenhum arquivo fonte, logo ou mídia original foi excluído. Os comentários existentes foram preservados. `.env`, resultados de testes e dependências locais ficam fora do versionamento. Não foi criado commit nem realizado push nesta etapa.

## Resultado da validação local — 28/10/2026

- Build TypeScript/Vite aprovado em container.
- ESLint aprovado, sem erros ou avisos.
- 871 chaves equivalentes por catálogo, interpolações compatíveis e 734 textos do fixture português preservados literalmente.
- 27 testes Vitest aprovados em seis arquivos.
- 196 cenários Playwright com respostas controladas aprovados em desktop/mobile, incluindo 24 regressões do perfil (quatro perfis × três idiomas × dois projetos), 108 auditorias por rota e testes adicionais de modais/gráficos e seis regressões de seletores na borda da tela.
- 24 cenários reais de conta/feedback, gestão acadêmica e quizzes aprovados nos três idiomas em desktop/mobile; três cenários adicionais de RAG/IA aprovados no desktop.
- PNGs e capturas do dashboard/perfil/insights gerados e inspecionados.
- Cada geração real de quiz utilizou um documento e recuperou dois trechos; os exemplos de chat e insights foram conferidos em PT/EN/ES.
- Conferência final do banco: zero contas, universidades, quizzes e feedbacks temporários E2E; quatro contas de demonstração preservadas e idioma administrativo restaurado.
- Saúde do frontend confirmada pelo Compose; acesso em `http://localhost:5173`.
- Chave do frontend conferida com a API local, sem literais de credenciais nos arquivos versionáveis.
- `git diff --check` aprovado; nenhum arquivo original excluído, nenhuma alteração em linhas de comentários existentes e repositório do backend sem alterações.

Os comandos para reproduzir a validação estão no README. Os resultados respeitam o alcance descrito acima; a matriz automatizada não equivale a uma certificação de todos os dados e cenários possíveis da aplicação.

## Fechamento das pendências autorizadas

| Ponto | Resultado |
|---|---|
| 1 — Homologação integrada | Suíte real reproduzível em Docker, com dados isolados, três idiomas, quatro perfis e serviços de geração configurados |
| 2 — Recuperação de senha por e-mail | Excluída por solicitação do usuário |
| 3 — Revisão visual/acessibilidade | Contraste corrigido; ações acessíveis no toque/teclado; seletores retornam foco e abrem dentro da tela; modais preservam alcance em telas baixas; gráficos e áreas roláveis com nomes/foco; métricas do gráfico em duas linhas no celular; edição de conta aguarda a API e conserva dados em falha |
| 4 — Regressão do perfil | Teste permanente verifica topo e final alcançáveis em aluno, professor, coordenador e administrador, em PT/EN/ES e desktop/mobile |

O contador de feedback e os metadados acessíveis dos gráficos receberam traduções adicionais, mantendo os textos portugueses existentes. As opções selecionadas e expansores também expõem seu estado às tecnologias assistivas.
