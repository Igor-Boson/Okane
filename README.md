# Okane

App pessoal de finanças feito pra **sentir cada gasto na hora em que ele acontece**: registro em segundos, um momento curto de reflexão e uma moedinha que vive de você registrar.

<p align="center"><img src="app/public/pet/feliz.webp" width="120" alt="A moedinha"></p>

- **Testar agora (prévia, com dados de exemplo):** https://claude.ai/artifact/3q7UBam9pt6Kn8VsbqQdQ8
- **Colocar no ar:** [guia de deploy](docs/deploy.md) (Cloudflare grátis, ~15 min)

## Documentos

| Etapa | Documento | Status |
|---|---|---|
| 1 | [Propósito, princípios e escopo](docs/01-proposito-principios-escopo.md) | ✅ aprovado |
| 2 | [Features do MVP](docs/02-features-mvp.md) | ✅ aprovado |
| 3 | [Arquitetura](docs/03-arquitetura.md) | ✅ aprovado |
| 4 | [Implementação](docs/04-implementacao.md) | 🟡 feito, falta testar no iPhone |
| — | [Guia de deploy](docs/deploy.md) | — |

## Como é por dentro

- **PWA** em Svelte 5 + TypeScript + Vite, instalado na tela de início do iPhone.
- **Os dados ficam no celular** (IndexedDB) e tudo funciona offline.
- **Backup automático cifrado no próprio celular** (AES-GCM, chave derivada de um código de recuperação), guardado numa Pages Function + KV da Cloudflare que não consegue ler nada.
- **As regras de dinheiro** ficam em `app/src/dominio/`: funções puras, com 95 testes.

```bash
cd app
npm install
npm run dev        # desenvolvimento
npm test           # testes de unidade
npm run build      # produção
npm run e2e        # ponta a ponta (depois do build)
```

## Pastas

| Pasta | O que tem |
|---|---|
| `app/` | O app (código, testes, Functions) |
| `docs/` | Decisões de cada etapa e o guia de deploy |
| `design/pet/` | A moedinha nos 6 estados (PNG transparente, gerada com o Gemini) |
| `prototype/` | Protótipo clicável da etapa 2 (histórico) |
