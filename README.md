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
docker compose --profile test run --build --rm tests sh -c 'npm run build && npm run check:i18n && npm test && npm run lint'
docker compose --profile browser run --build --rm browser-tests
```

O primeiro comando verifica TypeScript, bundle, catálogos, testes Vitest e ESLint com zero avisos permitidos. O segundo executa Playwright em Chromium desktop e emulação mobile. O frontend precisa estar disponível em `localhost:5173`; os testes usam a rede do host Linux para acessar a porta publicada. Se o usuário local não tiver UID/GID 1000, defina `LOCAL_UID` e `LOCAL_GID` no `.env` para gravar os resultados com o proprietário correto.

Capturas, PNGs exportados e traces de falhas ficam em `test-results/artifacts`, ignorado pelo Git. Os perfis de teste instalam dependências com `npm ci` dentro das imagens. Não é necessário instalar Node, npm ou browsers na máquina.

## Idiomas e preservação

O seletor aparece na página pública, autenticação, menu autenticado e perfil. A opção **Seguir o navegador** acompanha `navigator.languages`; variantes como `en-GB` e `es-MX` são normalizadas. O fallback é português do Brasil.

A escolha explícita feita na sessão tem prioridade sobre a preferência da conta. Sem escolha recente, a conta autenticada define o idioma; preferência da conta nula significa seguir o navegador. Para visitantes, vale a escolha local anterior e, na ausência dela, o navegador. Logout encerra a prioridade da escolha da sessão e a próxima conta pode restaurar sua própria preferência.

A preferência autenticada usa `PATCH /account/preferences` e o campo `preferredLanguage`. Restaurar o navegador envia `{"language":null}`. Falhas de gravação mantêm a escolha local e mostram a opção de tentar novamente. Requisições de gravação são ordenadas, e respostas antigas não substituem escolhas recentes ou o estado de outra conta.

A interface muda sem recarregar a aplicação. Conteúdos cadastrados, nomes, perguntas, alternativas, respostas do chat, históricos, materiais e códigos técnicos permanecem no idioma original. O idioma de um novo quiz pode ser escolhido separadamente da interface. Quizzes legados sem metadados apresentam idioma desconhecido.

Os catálogos ficam em `src/i18n/catalogs`. O verificador compara todas as chaves e interpolações, confere os textos originais do fixture português e detecta textos JSX e atributos operacionais fora dos catálogos. Os testes também verificam plurais, datas, números e percentuais. Marcas e unidades técnicas universais permanecem inalteradas.

O detalhamento da implementação e dos limites da validação está em [docs/multilinguagem.md](docs/multilinguagem.md).
