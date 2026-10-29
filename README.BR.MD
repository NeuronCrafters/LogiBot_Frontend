# LogiBots Frontend

[English](README.md)

Interface React e TypeScript para a plataforma educacional LogiBots. Oferece assistência à programação por chat, quizzes para alunos, gerenciamento de materiais didáticos, administração acadêmica e dashboards de atividades. A interface suporta português do Brasil, inglês e espanhol.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Aplicação | React, TypeScript, Vite |
| Roteamento | React Router |
| Estado remoto | TanStack Query |
| Comunicação com a API | Axios e Fetch com Server-Sent Events (SSE) |
| Interface | Tailwind CSS, ícones Lucide |
| Renderização de conteúdo | React Markdown, remark-gfm, destaque de sintaxe |
| Gráficos e exportação | Recharts, html-to-image |
| Internacionalização | i18next, react-i18next, APIs Intl do navegador |
| Validação | TypeScript, ESLint, Vitest, Testing Library, Playwright, axe-core |
| Execução em container | Nginx servindo a aplicação de página única compilada |

## Funcionalidades da interface

| Módulo | Funcionalidades |
|---|---|
| Autenticação | Login, cadastro com código de acesso da turma e consentimento dos termos, restauração de sessão, logout e formulários de recuperação/redefinição de senha |
| Conta | Alteração de nome, e-mail e senha; preferência de idioma; informações acadêmicas associadas à conta |
| Chat do aluno | Respostas por streaming, histórico de conversas, renderização de Markdown e código, indicadores de processamento e referências aos materiais recuperados |
| Quizzes do aluno | Quizzes disponíveis, navegação entre questões, seleção de alternativas, envio de tentativas, resultados e histórico |
| Gerenciamento de quizzes | Criação manual ou com IA, seleção do idioma do conteúdo, edição de questões, publicação, despublicação e resultados dos alunos |
| Base de conhecimento RAG | Seleção de turma, upload de PDF/TXT/DOCX, estado do processamento, reprocessamento, exclusão, configurações de recuperação e chat de teste |
| Administração acadêmica | Universidades, cursos, turmas, disciplinas, professores, códigos de acesso das turmas, buscas de entidades e vínculos entre turmas/disciplinas/professores |
| Dashboards | Filtros acadêmicos, tempo de uso, acertos e erros, desempenho por tópico, proficiência, progresso de aprendizagem, sessões de acesso, gráficos de esforço/desempenho, insights com IA e exportação PNG |
| Feedback | Envio de feedback por categoria e listagem administrativa de feedbacks |

A navegação se adapta aos perfis de aluno, professor, coordenador de curso e administrador. A API autoriza as operações e determina os registros acadêmicos disponíveis para cada conta. O layout inclui navegação desktop, menu mobile, controles acessíveis por teclado e modais com gerenciamento de foco.

### Rotas principais

| Rota | Interface |
|---|---|
| `/` | Página inicial pública |
| `/signin`, `/signup` | Autenticação e cadastro |
| `/forgot-password`, `/reset-password?token=...` | Recuperação e redefinição de senha |
| `/home` | Entrada autenticada |
| `/chat` | Chat do aluno |
| `/quiz`, `/quiz/:id` | Quizzes e tentativas dos alunos |
| `/quiz/manage` | Gerenciamento de quizzes |
| `/rag` | Materiais didáticos e configurações RAG |
| `/dashboard` | Dashboards de atividades e insights |
| `/entities/manage` | Gerenciamento de entidades e vínculos acadêmicos |
| `/entities/create/:entityType` | Criação de entidades |
| `/entities` | Busca, edição e exclusão de entidades |
| `/profile` | Configurações da conta e do idioma |
| `/feedback` | Envio de feedback |
| `/admin/feedbacks` | Listagem administrativa de feedbacks |

As rotas autenticadas usam um layout compartilhado. As páginas de cada funcionalidade e as permissões da API determinam as operações disponíveis em cada rota.

## Comportamento dos idiomas

Os idiomas disponíveis são `pt-BR`, `en-US` e `es-ES`. O seletor de idioma aparece nas páginas públicas, nas telas de autenticação, no menu autenticado e no perfil.

- **Seguir o navegador** consulta `navigator.languages`, normaliza variantes como `en-GB` e `es-MX` e usa `pt-BR` como fallback.
- Uma seleção explícita feita na sessão atual tem prioridade sobre a preferência da conta. Na ausência dela, aplica-se a preferência da conta autenticada; uma preferência nula segue o navegador.
- Visitantes usam a preferência local salva ou o idioma do navegador. O logout encerra a prioridade da sessão para que outra conta possa restaurar sua própria preferência.
- A preferência da conta usa `PATCH /account/preferences`; retornar à detecção do navegador envia `{"language":null}`. Falhas ao salvar mantêm a seleção local e apresentam uma ação para tentar novamente.
- As chamadas da API enviam `Accept-Language`; escolhas explícitas também usam `X-Language`. Gerações do chat conservam o idioma capturado no início da requisição, e os caches de insights distinguem os idiomas.
- A troca da interface preserva valores digitados, materiais existentes, nomes, perguntas, respostas e histórico de conversas. Novos quizzes podem usar um idioma de conteúdo selecionado independentemente da interface.
- Datas, números, percentuais, durações e plurais seguem o idioma ativo. Idiomas conhecidos do conteúdo são expostos por atributos HTML `lang`.

Os catálogos ficam em `src/i18n/catalogs`. O comando `npm run check:i18n` verifica a paridade de chaves e interpolações, os textos portugueses preservados em fixtures e os textos da interface fora dos catálogos. Os detalhes da implementação estão em [docs/multilinguagem.md](docs/multilinguagem.md).

## Organização do código

```text
src/
  app/          Provedores da aplicação e roteamento
  assets/       Recursos estáticos da interface
  components/   Componentes básicos compartilhados de interface
  features/     Conta, autenticação, chat, quizzes, RAG, administração,
                filtros acadêmicos, dashboards, feedback e páginas públicas
  i18n/         Catálogos, negociação, persistência e funções de localização
  services/     Clientes compartilhados da API e adaptadores de endpoints
  shared/       Layouts, modais, transporte HTTP, hooks e formatação
scripts/        Verificações de internacionalização
tests/          Testes de navegador, cenários de integração com a API e fixtures
```

Os módulos de funcionalidades agrupam suas páginas, componentes, adaptadores da API, hooks e tipos. O TanStack Query gerencia os dados remotos e o cache. As requisições HTTP autenticadas usam cookies de sessão da API; o streaming do chat usa Fetch/SSE.

## Configuração

Copie o modelo de ambiente e defina os valores para a API de destino:

```bash
cp .env.example .env
```

| Variável | Finalidade | Padrão / exemplo |
|---|---|---|
| `VITE_API_BASE_URL` | URL base da API no navegador; `/api` usa o proxy Nginx | `/api` |
| `VITE_API_KEY` | Chave de API esperada pelo backend | Mesmo valor de `API_KEY` no backend |
| `FRONTEND_PORT` | Porta publicada no host pela interface de loopback | `5173` |
| `API_UPSTREAM` | URL do backend acessível pelo container Nginx | `http://backend:43187` |
| `API_DOCKER_NETWORK` | Rede Docker existente compartilhada com o backend | `logibot_backend_default` |
| `E2E_ADMIN_EMAIL` | Conta administrativa para testes de integração com a API local | Definir no ambiente local de testes |
| `E2E_ADMIN_PASSWORD` | Senha dessa conta de teste | Definir no ambiente local de testes |
| `LOCAL_UID`, `LOCAL_GID` | Propriedade dos artefatos gerados pelo container de testes de navegador | `1000`, `1000` |

Os valores `VITE_*` são incorporados ao bundle público do navegador durante o build. Reconstrua o frontend após alterá-los. Credenciais do provedor e segredos de sessão pertencem ao backend. `API_UPSTREAM` é substituído quando o Nginx inicia. As credenciais `E2E_*` são passadas somente ao serviço de testes de integração com a API.

O arquivo `.env` é excluído do Git e do contexto de build do Docker. O build recebe somente os argumentos declarados.

## Execução com Docker

Requisitos: Docker Engine, Docker Compose, uma API compatível em execução e a rede externa definida em `API_DOCKER_NETWORK`. Geração por IA, processamento de materiais e recuperação também exigem que o worker do backend, o provedor de modelos, o serviço de Embedding e o ChromaDB estejam configurados em seus próprios serviços.

```bash
docker compose up -d --build --wait --wait-timeout 120
docker compose ps
```

Acesse [http://localhost:5173](http://localhost:5173), ou a porta configurada por `FRONTEND_PORT`. A API precisa permitir a origem do navegador e suportar os cookies de sessão necessários.

O container serve a aplicação compilada na porta `5190`, publicada como `127.0.0.1:FRONTEND_PORT`. O Nginx oferece fallback de rotas SPA e um endpoint `/health`. Com `VITE_API_BASE_URL=/api`, as requisições em `/api/` são encaminhadas para `API_UPSTREAM` sem esse prefixo. O proxy suporta cookies de sessão, uploads e respostas SSE sem buffering.

A imagem final de execução contém os arquivos compilados e a configuração do Nginx. Node.js, ferramentas de build e dependências dos testes de navegador ficam nas imagens de build/teste. Esse fluxo dispensa a instalação de Node.js, npm e navegadores no host.

```bash
docker compose down
```

Esse comando encerra o projeto do frontend. A rede externa da API e os serviços do backend continuam gerenciados pelos próprios projetos.

## Validação

O `docker-compose.yml` define somente `frontend`. Os serviços de teste ficam separados em `docker-compose.test.yml`, com o nome de projeto Compose `logibot-frontend-tests`. Execute as suítes em sequência para limitar a disputa de recursos com os serviços da aplicação.

### Build, catálogos, testes unitários e lint

```bash
docker compose -f docker-compose.test.yml --profile test run --build --rm tests sh -c 'npm run build && npm run check:i18n && npm test && npm run lint'
```

Esse comando verifica TypeScript, bundle Vite, catálogos de idiomas, testes Vitest e ESLint com zero avisos permitidos. As dependências são instaladas com `npm ci` dentro da imagem.

### Testes de interface no navegador

Inicie o frontend antes de executar:

```bash
docker compose -f docker-compose.test.yml --profile browser run --build --rm browser-tests
```

O Playwright executa Chromium desktop e emulação mobile com respostas controladas da API. A cobertura inclui troca de idioma, preservação de valores digitados, contratos de requisições, navegação por perfil, rolagem do perfil, modais em telas baixas, posicionamento de seletores, gráficos, exportação PNG e verificações de acessibilidade com axe.

Os serviços de testes de navegador usam a rede do host Linux para acessar a porta do frontend. Os artefatos ficam em `test-results/artifacts`; `LOCAL_UID` e `LOCAL_GID` controlam a propriedade dos arquivos.

### Testes de integração com a API local

Configure `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` e inicie a aplicação e suas dependências da API:

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests sh -c 'npm exec tsc -- -p tsconfig.e2e.json && npm run test:e2e:real'
```

Essa suíte aceita somente `localhost` ou `127.0.0.1`. Ela cria registros acadêmicos e contas com prefixos únicos e exercita alterações da conta, feedback, CRUD acadêmico, permissões de coordenador e os fluxos de publicação/tentativa/resultados de quizzes nos três idiomas em desktop e mobile. A limpeza é executada em `finally` e restaura a preferência original de idioma do administrador; encerrar o container à força pode interromper a limpeza.

O cenário `generation.provider.spec.ts`, exclusivo de desktop, também envia e reprocessa um documento TXT, gera um quiz com fontes recuperadas, recebe streaming do chat, solicita um insight com IA, exporta PNG e exclui o material. Esses cenários chamam o provedor configurado no backend e consomem sua cota normal de API.

Para executar somente os fluxos sem geração de IA:

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests npm run test:e2e:real -- account.spec.ts academic.spec.ts entities.spec.ts quiz.spec.ts
```

Os artefatos da integração ficam em `test-results/real` e `test-results/real-report.json`. Os resultados dos testes são excluídos do Git.
