# LogiBots

Frontend React/TypeScript com interface em português do Brasil (`pt-BR`), inglês (`en-US`) e espanhol (`es-ES`).

## Execução local em Docker

É necessário ter Docker Compose e a API já executando na rede `logibot_backend_default`. Este Compose inicia somente o frontend; não altera nem recria os serviços da API, Embedding ou ChromaDB.

O `.env` local foi ajustado para este ambiente. Em outra máquina, copie `.env.example` para `.env` e preencha `VITE_API_KEY` com o mesmo valor de `API_KEY` da API.

| Variável | Valor local / finalidade |
|---|---|
| `VITE_API_BASE_URL` | `/api`, proxy na mesma origem do frontend |
| `VITE_API_KEY` | Chave exigida pela API; incorporada ao bundle público pelo Vite |
| `FRONTEND_PORT` | `5173` |
| `API_UPSTREAM` | `http://backend:43187`, endereço interno da API na rede Docker |
| `API_DOCKER_NETWORK` | `logibot_backend_default`, rede externa já existente |

```bash
docker compose up -d --build --wait --wait-timeout 120
docker compose ps
```

Abra **http://localhost:5173**. Use esse hostname para manter a origem já permitida pela API local. O proxy encaminha cookies, headers de idioma, uploads e streaming SSE, sem buffering. As rotas do React Router funcionam também em acesso direto e recarga.

As variáveis `VITE_*` são resolvidas durante o build. Depois de alterá-las, reconstrua o container. `API_UPSTREAM` é resolvido ao iniciar o Nginx. O `.env` é ignorado pelo Git e pelo contexto do Docker; o build recebe somente os argumentos declarados. Credenciais do OpenRouter e segredos de sessão pertencem à API.

Para encerrar somente este frontend:

```bash
docker compose down
```

A rede externa e os containers da API permanecem disponíveis.

## Validação sem dependências locais

```bash
docker compose -f docker-compose.test.yml --profile test run --build --rm tests sh -c 'npm run build && npm run check:i18n && npm test && npm run lint'
docker compose -f docker-compose.test.yml --profile browser run --build --rm browser-tests
```

O `docker-compose.yml` contém somente o serviço `frontend`. Os três serviços de teste ficam exclusivamente em `docker-compose.test.yml`, carregado explicitamente nos comandos de validação. O projeto Compose de testes tem nome próprio (`logibot-frontend-tests`), separando também seus containers e sua rede padrão dos da aplicação.

O primeiro comando verifica TypeScript, bundle, catálogos, testes Vitest e ESLint com zero avisos permitidos. O segundo executa Playwright em Chromium desktop e emulação mobile. O frontend precisa estar disponível em `localhost:5173`; os testes usam a rede do host Linux para acessar a porta publicada. Se o usuário local não tiver UID/GID 1000, defina `LOCAL_UID` e `LOCAL_GID` no `.env` para gravar os resultados com o proprietário correto.

Capturas, PNGs exportados e traces de falhas ficam em `test-results/artifacts`, ignorado pelo Git. Os perfis de teste instalam dependências com `npm ci` dentro das imagens. Não é necessário instalar Node, npm ou browsers na máquina. Execute as suítes em sequência, sem builds concorrentes, para evitar disputa de memória com os serviços locais.

## Homologação contra a API local

Preencha `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` no `.env` local com uma conta administrativa do ambiente de teste. Esses valores não são argumentos do build nem entram no bundle. API, worker, Embedding e ChromaDB precisam estar funcionando antes da execução.

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests sh -c 'npm exec tsc -- -p tsconfig.e2e.json && npm run test:e2e:real'
```

A suíte aceita apenas `localhost` ou `127.0.0.1`. Cria universidade, vínculos e contas temporárias com prefixo único, testa os fluxos pela interface e remove seus dados em `finally`, inclusive quando uma asserção falha. Uma interrupção forçada do container pode impedir essa limpeza. A preferência original da conta administrativa é restaurada. As contas de demonstração existentes são preservadas.

São verificados cadastro e consentimento, edição de nome/e-mail/senha, conflito de e-mail, preferência persistida, feedback, CRUD acadêmico, permissões de coordenador e o ciclo de publicação, resolução e resultados de quizzes em PT/EN/ES, no desktop e mobile. O cenário `generation.provider.spec.ts` também processa e reprocessa um TXT real, gera quiz com fontes, recebe streaming de chat, gera insights e exporta PNG. Ele roda somente no desktop e faz chamadas ao provedor configurado na API, com seu consumo normal.

Os relatórios e artefatos dessa suíte ficam em `test-results/real` e `test-results/real-report.json`. Para executar somente os fluxos sem geração de IA:

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests npm run test:e2e:real -- account.spec.ts academic.spec.ts entities.spec.ts quiz.spec.ts
```

Os testes de layout incluem os quatro perfis, os três idiomas, topo/fim do perfil alcançáveis, telas baixas, navegação por teclado, retorno de foco e auditoria axe de WCAG A/AA. A recuperação de senha por e-mail e a implantação na VPS não fazem parte desta homologação.

## Idiomas e preservação

O seletor aparece na página pública, autenticação, menu autenticado e perfil. A opção **Seguir o navegador** acompanha `navigator.languages`; variantes como `en-GB` e `es-MX` são normalizadas. O fallback é português do Brasil.

A escolha explícita feita na sessão tem prioridade sobre a preferência da conta. Sem escolha recente, a conta autenticada define o idioma; preferência da conta nula significa seguir o navegador. Para visitantes, vale a escolha local anterior e, na ausência dela, o navegador. Logout encerra a prioridade da escolha da sessão e a próxima conta pode restaurar sua própria preferência.

A preferência autenticada usa `PATCH /account/preferences` e o campo `preferredLanguage`. Restaurar o navegador envia `{"language":null}`. Falhas de gravação mantêm a escolha local e mostram a opção de tentar novamente. Requisições de gravação são ordenadas, e respostas antigas não substituem escolhas recentes ou o estado de outra conta.

A interface muda sem recarregar a aplicação. Conteúdos cadastrados, nomes, perguntas, alternativas, respostas do chat, históricos, materiais e códigos técnicos permanecem no idioma original. O idioma de um novo quiz pode ser escolhido separadamente da interface. Quizzes legados sem metadados apresentam idioma desconhecido.

Os catálogos ficam em `src/i18n/catalogs`. O verificador compara todas as chaves e interpolações, confere os textos originais do fixture português e detecta textos JSX e atributos operacionais fora dos catálogos. Os testes também verificam plurais, datas, números e percentuais. Marcas e unidades técnicas universais permanecem inalteradas.

O detalhamento da implementação e dos limites da validação está em [docs/multilinguagem.md](docs/multilinguagem.md).
