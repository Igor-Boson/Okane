# Okane: como colocar no ar

> Tempo: uns 15 minutos. Custo: **R$ 0**. Você só precisa de uma conta (grátis) na Cloudflare.
> Os nomes dos menus da Cloudflare mudam de vez em quando. Se algo estiver com outro nome, procure pelo equivalente.

## Antes: o código precisa estar na `main`

Todo o trabalho está na branch `claude/finance-app-scope-principles-6ai0dg`. Duas opções:

- **Recomendado:** abrir um PR dessa branch pra `main` e fazer o merge. Se quiser, é só me pedir que eu abro o PR.
- **Atalho:** no passo 3, usar essa branch como "production branch" em vez da `main`.

## 1. Criar a conta

1. Entre em **dash.cloudflare.com** e crie uma conta (e-mail e senha). Não precisa de cartão.

## 2. Criar o armazenamento do backup (KV)

1. No menu lateral: **Storage & Databases → KV** (às vezes aparece como **Workers KV**).
2. **Create namespace** → nome: `okane-backup` → criar.

## 3. Criar o projeto e conectar o GitHub

1. Menu lateral: **Workers & Pages → Create** → aba **Pages** → **Connect to Git** (ou "Import an existing Git repository").
2. Autorize o GitHub e escolha o repositório **Okane**.
3. Configuração do build:

| Campo | Valor |
|---|---|
| Project name | `okane-` + algo seu (vira o endereço: `okane-algo.pages.dev`) |
| Production branch | `main` (ou a branch do trabalho, se for o atalho) |
| Framework preset | `None` (ou `Vite`) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory (advanced) | `app` |
| Environment variable | `NODE_VERSION` = `22` |

4. **Save and Deploy**. O primeiro build leva uns 2 minutos.

> ⚠️ **Escolha bem o nome do projeto.** O endereço do app é onde os dados moram no iPhone. Trocar depois obriga a restaurar pelo backup (D24).

## 4. Ligar o backup no projeto

1. Abra o projeto → **Settings → Bindings** (em versões antigas: **Settings → Functions → KV namespace bindings**).
2. **Add → KV namespace**:
   - Variable name: `OKANE_BACKUP` (exatamente assim)
   - KV namespace: `okane-backup`
   - Faça isso pra **Production** (e pra Preview, se aparecer separado).
3. Vá em **Deployments** → no último deploy, **⋯ → Retry deployment**. O binding só vale depois de um deploy novo.

## 5. Conferir

Abra no navegador: `https://SEU-PROJETO.pages.dev/api/saude`

Tem que aparecer:

```json
{"ok":true,"backup":true}
```

Se aparecer `"backup":false`, o passo 4 não pegou: confira o nome `OKANE_BACKUP` e refaça o deploy.

## 6. Instalar no iPhone

1. Abra `https://SEU-PROJETO.pages.dev` no **Safari**.
2. O app mesmo vai pedir: **Compartilhar** → **Adicionar à Tela de Início**.
3. Abra pelo ícone da moedinha e faça o primeiro uso (2 minutos).
4. **Guarde o código de recuperação** que aparece no fim (Notas, Senhas do iPhone ou papel).

## 7. Checklist do primeiro dia (é o M0: confirmar o iPhone)

| Teste | Como | Esperado |
|---|---|---|
| Abre instantâneo | Feche e abra pelo ícone | Abre em menos de 1 s, sem barra do Safari |
| Funciona offline | Modo avião → abra e registre um gasto | Registra normal |
| Dados ficam | Feche o app (arraste pra cima) e abra de novo | Tudo continua lá |
| Backup ligado | Ajustes → Backup | "Nuvem: Ligada" e "Último backup: agora há pouco" (depois de registrar algo) |
| Barra de status | Olhe o topo | Hora e bateria visíveis sobre o fundo índigo |
| Atualização | Depois de um deploy novo, abra, saia e volte | Aparece "Okane atualizado ✨" |

Se algum desses falhar, me conta qual que eu resolvo.

## Depois do deploy

- **Atualizações** são automáticas: cada push na branch de produção publica uma versão nova, e o app se atualiza sozinho quando você sai dele.
- **Cada branch** ganha um link de teste próprio (`branch.okane-algo.pages.dev`), útil pra testar mudanças sem mexer no app que você usa.
- **Limites grátis:** 500 builds por mês, 100 mil requisições por dia e 1.000 gravações de backup por dia. O Okane usa uma fração disso.

## Se der problema

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Build falha com erro de Node | Versão antiga do Node | Confira `NODE_VERSION = 22` |
| Build falha com "package.json not found" | Root directory vazio | Root directory = `app` |
| `/api/saude` dá 404 | Functions não foram publicadas | Root directory precisa ser `app` (a pasta `functions/` fica lá dentro) |
| Backup "Não configurada" | Binding faltando | Passo 4 + refazer o deploy |
| App abre mas some tudo ao fechar | Abriu pelo Safari, não pelo ícone | Use sempre o ícone da tela de início |
