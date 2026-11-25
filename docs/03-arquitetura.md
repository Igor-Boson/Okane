# Okane: Arquitetura

> **Status:** 🟡 Rascunho v0.1, esperando green light
> **Etapa:** 3 de 4 (Propósito ✅ → Features ✅ → **Arquitetura** → Implementação)
> **Base:** [01: Propósito](01-proposito-principios-escopo.md) · [02: Features do MVP](02-features-mvp.md) · [protótipo](https://claude.ai/artifact/3q7UBam9pt6Kn8VsbqQdQ8)
> **Data:** 25/11/2026

---

## Como revisar

Mesmo esquema: IDs `A1`, `A2`... e decisões continuando a numeração (**D21 a D25**, na seção 9). Esta etapa é a mais técnica. Se algo não fizer sentido, pergunta que eu traduzo.

### Painel de aprovação

| Bloco | Itens | Status |
|---|---|---|
| 1. Visão geral | A1 | 🟡 proposta |
| 2. Stack | A2 | 🟡 proposta |
| 3. Dados | A3, A4 | 🟡 proposta |
| 4. Backup | A5 | 🟡 proposta |
| 5. PWA no iPhone | A6 | 🟡 proposta |
| 6. Hospedagem e custo | A7 | 🟡 proposta |
| 7. Qualidade | A8 | 🟡 proposta |
| 8. Plano de implementação | M0 a M4 | 🟡 proposta |
| 9. Decisões | D21 a D25 | ⏳ **preciso de respostas** |

---

## 0. Resumo

- **O app vive no celular.** Os dados ficam no próprio iPhone (IndexedDB) e tudo funciona sem internet. Não tem servidor no caminho do registro, então registrar é instantâneo.
- **A nuvem serve só pra backup**, e o backup é **criptografado no celular** antes de sair: o servidor guarda um bloco que só você consegue ler.
- **Um código de recuperação** faz o papel de login e de chave ao mesmo tempo. Sem cadastro, sem senha.
- **Svelte + TypeScript + Vite**, hospedado na **Cloudflare** de graça.
- **As regras de dinheiro ficam num módulo separado**, com funções puras e muitos testes. É a parte que não pode errar.
- **O primeiro passo é instalar no seu iPhone** e confirmar o comportamento do iOS antes de escrever o resto.

---

## 1. Visão geral (A1)

```
┌─────────────────────────── iPhone (app instalado na tela de início) ───────────────────────────┐
│                                                                                                 │
│   Telas (Svelte)  ──usa──▶  Motor de regras (TS puro)  ◀──lê──  Dados locais (IndexedDB)         │
│   Início, Gastos,           orçamento, pet, sequência,           gastos, plano, parcelas,        │
│   Plano, Ajustes            sugestão, falas                      categorias, ajustes             │
│                                                                        │                         │
│   Service worker: guarda o app pra abrir offline e instantâneo         │ backup (criptografado)  │
└────────────────────────────────────────────────────────────────────────┼─────────────────────────┘
                                                                         ▼
                                              ┌──────────────── Cloudflare (grátis) ────────────────┐
                                              │  Pages: serve o app (HTML/JS/CSS + moedinha)         │
                                              │  Worker + KV: guarda e devolve o backup cifrado      │
                                              │  (depois: lembretes, Atalho da Wallet, IA)           │
                                              └──────────────────────────────────────────────────────┘
```

**Por que local-first:**
- **Velocidade (P1):** salvar um gasto é escrever no próprio celular, em milissegundos, mesmo sem sinal.
- **Privacidade (P8):** seus gastos não ficam em nenhum servidor em texto aberto.
- **Custo e simplicidade (P7):** não tem banco de dados no servidor, nem login, nem API pra manter.

---

## 2. Stack (A2)

| Camada | Escolha | Por quê |
|---|---|---|
| Interface | **Svelte 5** + **TypeScript** | Gera o menor pacote entre os frameworks populares, o que significa abrir rápido no iPhone. Pouco código repetitivo. Ver D21 |
| Build | **Vite** | Padrão do mercado, rápido |
| PWA | **vite-plugin-pwa** (Workbox) | Gera o service worker e o manifesto; cuida de atualização do app |
| Dados locais | **Dexie** (sobre IndexedDB) | API simples, migrações de versão, consultas por data |
| Testes | **Vitest** (regras) + **Playwright** (fluxos) | Testes rápidos pras regras de dinheiro; teste ponta a ponta do registro |
| Backend de backup | **Cloudflare Worker** + **KV** | ~100 linhas, grátis, sem servidor pra manter |
| Datas | Funções próprias pequenas | Só precisamos de data local (sem fuso), sem biblioteca pesada |

**Regras de código:**
- **Dinheiro em centavos inteiros** (`2000` = R$ 20,00). Nunca `float`, que gera erro de arredondamento.
- **Datas como `AAAA-MM-DD`**, no horário do celular.
- **IDs com `crypto.randomUUID()`.**

---

## 3. Dados

### A3: Modelo

| Entidade | Campos principais | Observação |
|---|---|---|
| **Gasto** | id, data, valor (centavos), descrição, categoria, valeu (sim/não/vazio), criadoEm, alteradoEm | O centro de tudo |
| **DiaSemGasto** | data | Alimenta o pet e a sequência (F3) |
| **Categoria** | id, nome, emoji, essencial, ordem, arquivada | Arquivar em vez de apagar mantém o histórico certo |
| **Atalho** | descrição, valor, categoria, fixado | Aprendido (3 repetições) ou fixado na mão |
| **PlanoDoMês** | mês, salário, fixos [nome, valor], meta de guardar | Cada mês tem o seu; a virada copia o anterior |
| **Parcela** | nome, valor, **mês da 1ª parcela, total de parcelas** | "Faltam N" é **calculado**, não guardado. Não precisa atualizar nada todo mês |
| **EntradaExtra** | mês, descrição, valor, quanto foi liberado | 13º, freela (R6) |
| **FechamentoDaSemana** | semana, decisão (guardar / passar pra frente), valor | Só guarda a **decisão**; os números são recalculados |
| **Ajustes** | nome do pet, tom, último backup, versão do esquema | |

### A4: Motor de regras (o coração)

Um módulo `dominio/` com **funções puras**: recebem dados e "hoje" e devolvem números. Não acessam tela nem banco. É a regra R4 ("tudo é derivado") virando código.

```
calcularSemana(dados, hoje)   → cota, gasto, pode, status 🟢🟡🔴, por dia, ritmo
fecharSemana(dados, semana)   → sobra, maior categoria, "não valeu", sequência
resumoDoMes(dados, mês)       → livre, gasto, guardado, parcelas do mês
estadoDoPet(dados, hoje)      → fome, humor, sequência, nível
sugerirCategorias(dados, descrição, horário) → lista ordenada
fala(situação, tom)           → frase
```

- **Por que separar:** é a parte que mexe com dinheiro, então precisa de **muitos testes** (semana que cruza o mês, parcela que termina, gasto retroativo, estouro, 13º...). Função pura é fácil de testar e não quebra quando a tela muda.
- **Desempenho:** um ano de uso dá uns 2 mil registros. Recalcular tudo a cada mudança leva menos de 1 ms. Não precisa de cache.

---

## 4. Backup (A5)

**O risco:** os dados ficam só no iPhone. A pesquisa mostra que o app instalado na tela de início escapa da regra do Safari que apaga dados depois de 7 dias sem uso ([Apple Developer Forums][fa]), mas a Apple não promete que os dados nunca vão ser apagados, e um celular perdido ou trocado leva tudo junto. Por isso, **backup não é opcional**.

### Como funciona

```
mudou algo ─▶ espera 10 s (ou o app ir pro fundo)
           ─▶ junta tudo num JSON ─▶ comprime ─▶ criptografa (AES-GCM) no celular
           ─▶ envia pro Worker ─▶ KV guarda "último" + 1 cópia por dia (7 dias)
```

- **Código de recuperação:** gerado no primeiro uso, algo como `OKAN-7F3K-Q9XD-M2PL-W8HT` (~100 bits). Dele saem **duas coisas**:
  - o **endereço** do backup no servidor (um hash do código);
  - a **chave** que criptografa os dados.
- **O servidor nunca vê nada legível.** Se alguém roubar o bloco, não consegue abrir.
- **Trocou de celular?** Instala o app → "Já usa o Okane?" → digita o código → tudo volta.
- **Você guarda o código** nas Notas, nas Senhas do iPhone ou num papel. O app mostra o código no primeiro uso e em Ajustes. Ver D25.
- **Backup manual também:** exportar arquivo (Compartilhar → Salvar em Arquivos/iCloud Drive) e CSV pra planilha.
- **No fechamento da semana**, se o backup automático falhou há mais de 7 dias, o app avisa.

---

## 5. PWA no iPhone (A6)

| Tema | Como resolvemos |
|---|---|
| **Instalação** | O app detecta se está no Safari ou instalado. No Safari, só mostra como instalar (O0), porque o app instalado **não compartilha dados com o Safari** ([WebKit bug 181849][wk]) |
| **Abrir instantâneo / offline** | O service worker guarda o app inteiro no celular |
| **Atualizações** | Versão nova é baixada em segundo plano e entra na próxima abertura. Aparece um aviso discreto "Okane atualizado" |
| **Persistência** | Pede `navigator.storage.persist()` (se o iOS negar, tudo bem: o backup cobre) |
| **Ícone e abertura** | Ícone da moedinha, tela de abertura, barra de status da cor do app |
| **Teclado** | Teclado numérico próprio (já está no protótipo), sem o teclado do iPhone cobrindo a tela |
| **Áreas seguras** | Respeita o notch e a barra inferior (`safe-area-inset`) |
| **Notificações** | **Fora do MVP.** O iOS só permite com o app instalado e exige um servidor de push. Fica pra v1, no mesmo Worker |
| **Vibração** | O Safari não tem API de vibração. Sem háptico por enquanto |

> ⚠️ **Trocar o endereço do app depois de começar a usar deixa os dados pra trás**, porque os dados ficam presos ao endereço. O backup resolve, mas é chato. Por isso o endereço precisa ser decidido antes do uso de verdade (D24).

---

## 6. Hospedagem e custo (A7)

| Item | Onde | Custo |
|---|---|---|
| App (arquivos estáticos) | Cloudflare Pages | R$ 0 |
| Backup | Cloudflare Worker + KV (limite grátis: 1.000 gravações/dia; a gente usa ~30) ([Cloudflare][kv]) | R$ 0 |
| Deploy | Integração Git da Cloudflare: cada push na `main` publica; cada branch ganha um link de teste | R$ 0 |
| Domínio | `okane-xxxx.pages.dev` grátis, ou `.com.br` próprio (~R$ 40/ano) | R$ 0 ou ~R$ 40/ano |
| IA (depois: registro por voz/texto) | Gemini, chamado pelo Worker pra chave não ficar no app | Centavos por mês |

**O que eu não consigo fazer sozinho:** criar a conta na Cloudflare e conectar o repositório. Isso é com você (uns 10 minutos, e eu te guio). Depois, o deploy é automático.

---

## 7. Qualidade (A8)

- **Testes das regras:** cada regra de R1 a R8 e do pet vira teste com exemplos de entrada e saída, incluindo os casos chatos. Meta: **100% do módulo `dominio/` coberto**.
- **Teste ponta a ponta:** registrar → número muda → desfazer → volta. Roda no Chromium aqui; no iPhone, o teste é você.
- **Orçamento de desempenho:**
  - JavaScript < **100 KB** comprimido;
  - abrir em **< 1 s** no iPhone;
  - salvar um gasto em **< 100 ms**.
- **Sem rastreamento:** nada de analytics de terceiros. Os indicadores de sucesso (PR-3) são calculados no próprio app, a partir dos seus dados.
- **CI no GitHub Actions:** checagem de tipos, testes e build a cada push.

---

## 8. Plano de implementação

| Marco | Entrega | Pra quê |
|---|---|---|
| **M0: Esqueleto** | Projeto, PWA instalável, deploy na Cloudflare, moedinha como ícone | **Instalar no seu iPhone primeiro** e confirmar o comportamento do iOS antes de construir em cima |
| **M1: Motor** | `dominio/` com orçamento, pet, sequência e sugestão, com testes | A parte que mexe com dinheiro, testada antes de ter tela |
| **M2: Ciclo central** | Início (registro + número da semana + reflexão), plano básico, exportar arquivo | **Já dá pra usar de verdade.** Ideal pra começar o mês 0 em dezembro |
| **M3: Resto do MVP** | Gastos, Plano completo, primeiro uso, check de ontem, viradas de semana e mês, pet completo, ajustes | MVP completo |
| **M4: Backup na nuvem** | Código de recuperação, backup automático criptografado, restaurar | Segurança dos dados |

> Entre M2 e M4, o backup é manual: exportar o arquivo uma vez por semana. O app lembra.

---

## 9. Decisões (preciso de você)

| ID | Pergunta | Minha recomendação |
|---|---|---|
| **D21** | Svelte ou React? Você pretende mexer no código? | **Svelte**, a não ser que você já saiba React e queira manter o código. Aí React, sem drama |
| **D22** | Backup automático criptografado na nuvem já no MVP (M4)? | **Sim.** Dado financeiro de meses não pode depender de lembrar de exportar |
| **D23** | Hospedar na Cloudflare? Você cria a conta (grátis) e eu te guio pra conectar o repositório | **Sim** |
| **D24** | Endereço: `okane-xxxx.pages.dev` (grátis) ou domínio próprio (~R$ 40/ano)? | **pages.dev** pra começar. Se quiser domínio, melhor decidir **antes** do uso real |
| **D25** | Código de recuperação no lugar de login? Se perder o código **e** o celular, os dados se perdem | **Sim.** Login com e-mail e senha seria mais peso (P7) e mais coisa pra manter |

---

## 10. Próximos passos

1. **Você:** green light ou ajustes + respostas de D21 a D25.
2. **Eu:** M0 e M1 em seguida (esqueleto + motor com testes). M0 precisa da sua conta na Cloudflare pra ir pro ar.
3. **Você:** instala no iPhone e me conta se abriu certinho.

---

## Fontes

- [Safari iOS PWA Data Persistence Beyond 7 Days (Apple Developer Forums)][fa]
- [Bug 181849: "Add to homescreen" apps don't share storage with Safari (WebKit)][wk]
- [Updates to Storage Policy (WebKit)][wk-storage]
- [Workers KV: limites (Cloudflare)][kv]

[fa]: https://developer.apple.com/forums/thread/710157
[wk]: https://bugs.webkit.org/show_bug.cgi?id=181849
[wk-storage]: https://webkit.org/?p=14403
[kv]: https://developers.cloudflare.com/kv/platform/limits
