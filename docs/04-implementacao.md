# Okane: Implementação

> **Status:** 🟡 Feito, esperando você testar no iPhone
> **Etapa:** 4 de 4 (Propósito ✅ → Features ✅ → Arquitetura ✅ → **Implementação**)
> **Base:** [01](01-proposito-principios-escopo.md) · [02](02-features-mvp.md) · [03](03-arquitetura.md) · [guia de deploy](deploy.md)
> **Prévia pra testar agora:** https://claude.ai/artifact/3q7UBam9pt6Kn8VsbqQdQ8

---

## 0. Resumo

- **O MVP inteiro está pronto** (M0 a M4), mais **várias features da v1** e uma da lista "depois" (conferência com extrato).
- **Dá pra testar hoje, sem configurar nada:** a prévia acima roda o app de verdade. Na primeira tela, toque em **"Explorar com dados de exemplo"**.
- **Pra usar de verdade** falta só você seguir o [guia de deploy](deploy.md) (conta grátis na Cloudflare, ~15 min) e instalar no iPhone.
- **Qualidade:** 96 testes de unidade, 4 testes ponta a ponta, tipos sem erro e sem aviso, CI no GitHub Actions.

---

## 1. O que foi feito

### MVP (docs/02)

| ID | Feature | Status |
|---|---|---|
| T1 | Início: número da semana, status 🟢🟡🔴, ritmo de hoje, moedinha e teclado na mesma tela | ✅ |
| F1 | Registrar com valor + 1 toque; categoria sugerida pela descrição, horário e dia; atalhos de 1 toque | ✅ |
| F2 | Reflexão: impacto na semana, % da semana em gasto grande, "valeu a pena?", desfazer, some sozinha | ✅ |
| F3 | Check de ontem: "foi dia sem gastos?" na primeira abertura do dia | ✅ |
| T2 | Gastos: semana/mês, navegar pra trás, barras por categoria, "não valeu", editar/apagar com desfazer | ✅ |
| T3 | Plano: salário, fixos, parcelas, entradas extras, meta de guardar; planejar até 3 meses à frente | ✅ |
| T4 | Ajustes: moedinha (nome e tom), categorias, atalhos, backup, exportar | ✅ |
| T5 | Ficha da moedinha: humor, fome, sequência, folga da semana, nível | ✅ |
| O0 | Tela de instalação no iPhone (antes de qualquer dado) | ✅ |
| O1 | Primeiro uso em ~2 min, com código de recuperação e opção de restaurar | ✅ |
| R1–R8 | Todas as regras do orçamento | ✅ |
| PET-R1–R5 | Todas as regras da moedinha, 6 caras, falas nos 2 tons | ✅ |
| A5 | Backup automático cifrado no celular + servidor (Pages Function + KV) | ✅ |

### Adiantado da v1 e de "depois"

| Feature | Onde |
|---|---|
| Revisão atrasada do "valeu a pena?" (J4) | Fechamento da semana |
| Ritual do mês com as 4 perguntas do Kakeibo (J5) | Fechamento do mês |
| Lista de desejos com quarentena (3, 7 ou 30 dias) + total que você desistiu | Plano |
| Custo em horas de trabalho | Ajustes (desligado por padrão) |
| Compra parcelada nova pelo registro (D5) | Início → "Hoje ▾" → Parcelado |
| Texto livre: "uber 12,50" sem usar o teclado | Início |
| Exportar planilha (CSV) e arquivo de backup | Ajustes |
| **Conferência com o extrato do banco** (OFX/CSV) com % de completude (meta PR-3: 90%) | Gastos → "Conferir com o extrato" |
| **Modo discreto:** troca todos os valores por "R$ •••" pra mostrar o app pra alguém (planilha e backup não mudam) | Ajustes → 🙈 Modo discreto |

---

## 2. Decisões que eu tomei sozinho (veta se quiser)

Coisas que os documentos não cobriam e que tive que decidir pra implementar:

| # | Decisão | Por quê |
|---|---|---|
| I1 | **Primeiro mês proporcional:** começou no dia 25, o mês conta só os dias que faltam | Senão a primeira semana teria o mês inteiro de dinheiro |
| I2 | **Semana que cruza a virada:** depois que o mês acaba, a sobra dele vai pro guardado e some do número da semana | Consequência direta da D16 (mês começa limpo) |
| I3 | **Compra parcelada nova:** a 1ª parcela entra como gasto da semana; as outras viram parcela no plano a partir do mês seguinte | Dói agora (consciência) sem contar duas vezes |
| I4 | **App ficou semanas sem abrir:** as semanas antigas fecham sozinhas passando a folga pra frente; só a última pergunta | Evita uma fila de 5 folhas seguidas |
| I5 | **Moedinha no feminino** ("obrigada", "orgulhosa") | "A moedinha" |
| I6 | **Sem filtro** usa "porra" e um "caralho" (no estouro, homenagem ao "caralho, comprei muita coisa") | D20 |
| I7 | **Atalho aprendido** = mesmo gasto (descrição + valor + categoria) 3× em 120 dias | F1 dizia 3×; a janela evita atalho velho |
| I8 | **Conferência:** casa por valor igual e data até ±2 dias; valores parecidos com fixos/parcelas (±2%) vão pra "prováveis fixos" | Pix e débito às vezes caem no dia seguinte |
| I9 | **Sugestão de meta** no fim do 1º mês: 75% da sobra real, arredondada pra baixo | Deixa folga pra variação |
| I10 | **Backup:** espera 10 s depois de uma mudança (ou o app ir pro fundo); guarda o último + 1 cópia por dia por 8 dias | Pouca gravação, dá pra voltar uns dias |
| I11 | **Nível 1** já no começo; sobe a cada 7 dias registrados | PET-R4 |
| I12 | **Fixo que não é todo mês** (a cada 2, 3, 6 ou 12 meses): você põe o valor real (ex.: R$ 500) e o plano reserva o valor ÷ N todo mês (R$ 250) | A semana não oscila: o mês do pagamento não aperta e o mês sem pagamento não sobra dinheiro "de mentira". Na conferência com o extrato, o débito de R$ 500 cai em "prováveis fixos" |
| I13 | **Faixa embaixo das abas no iPhone:** algumas versões do iOS desenham o app instalado 47 px mais curto que a tela (nada da página pinta ali). O app percebe e tira das abas o espaço da barrinha do iPhone, que já ficou pra fora; a faixa tem a mesma cor das abas. O teclado encolhe as teclas (54 → 40 px) em tela baixa | Sobrava uma faixa de outra cor e a última linha do teclado ficava escondida. Ajustes → Sobre mostra os números da tela pra diagnóstico |
| I14 | **Atualização:** se a versão nova chega logo depois de abrir (ou voltar pro app) e você ainda não tocou em nada, o app recarrega na hora; senão aparece "Tem versão nova · Atualizar" e ela entra quando o app vai pro fundo. Ajustes → Sobre mostra a data da versão | Antes só entrava quando o app ia pro fundo, e no iPhone isso podia levar horas |

---

## 3. Como o código está organizado

```
app/
├── src/
│   ├── dominio/      ← regras puras (orçamento, pet, sugestão, extrato, falas) + testes
│   ├── dados/        ← IndexedDB (Dexie), estado reativo, backup cifrado, arquivos, dados de exemplo
│   ├── ui/           ← telas (Svelte 5) e folhas (cartões que sobem)
│   └── app.css       ← tokens índigo + ouro, claro e escuro
├── server/backup.ts  ← lógica do servidor de backup (testada sem Cloudflare)
├── functions/api/    ← Pages Functions: /api/backup/* e /api/saude
├── e2e/              ← testes ponta a ponta (Playwright)
└── public/           ← moedinha (6 caras) e ícones
design/pet/           ← moedinha em PNG transparente 640px (arte-mestre)
prototype/            ← o protótipo clicável da etapa 2 (histórico)
```

**Comandos** (dentro de `app/`):

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda local em modo desenvolvimento |
| `npm test` | 96 testes do motor de regras, cripto e servidor |
| `npm run check` | Tipos (app + Functions) |
| `npm run build` | Build de produção (PWA) em `dist/` |
| `npm run e2e` | Testes ponta a ponta (precisa do build) |
| `npm run build:previa` | HTML único da prévia em `dist-previa/artifact.html` |

---

## 4. O que os testes cobrem

- **Motor de regras (72 testes):** cota da semana, tolerância do status, folga e estouro passando pra frente, registro retroativo, semana que cruza o mês (antes e depois da virada), primeiro mês proporcional, fechamento de semana (guardar, passar pra frente, sem escolha, fim do mês, cruzando o mês), fechamento do mês, 13º, parcelas terminando, fome, sequência com perdão, nível, sugestão, atalhos, texto livre, falas.
- **Extrato (15):** OFX, CSV de conta, CSV de fatura, ponto e vírgula, valores brasileiros, conferência e limpeza de descrição.
- **Cripto e servidor (8):** código de recuperação, derivação de chave, cifra/decifra, adulteração, servidor com KV falso.
- **Dados de exemplo da prévia (1).**
- **Ponta a ponta (4), num iPhone emulado:**
  1. instalação → primeiro uso → registro → reflexão → texto livre → atalho → gasto grande → desfazer → editar → plano → ajustes → recarregar → virada do mês e da semana → check de ontem;
  2. backup num aparelho e restauração em outro pelo código, conferindo que o servidor só guarda bytes ilegíveis;
  3. conferência com um CSV no formato do Nubank;
  4. modo discreto: nenhum valor aparece no Início, nos Gastos, na edição e no Plano, e tudo volta ao desligar.

**O que os testes não cobrem:** o Safari de verdade. Aqui só tenho o motor do Chrome. Os comportamentos próprios do iPhone (instalação, armazenamento, barra de status) precisam do seu teste no aparelho: é o checklist do [guia de deploy](deploy.md#7-checklist-do-primeiro-dia-é-o-m0-confirmar-o-iphone).

---

## 5. O que ainda não foi feito

| Item | Por quê | Esforço |
|---|---|---|
| Lembretes por notificação | No iPhone, precisa do app instalado + servidor de push. O check de ontem cobre parte | Médio |
| Evolução visual da moedinha (itens, lugares) | Precisa de arte nova (dá pra gerar no Gemini como as 6 caras) | Médio |
| Registro por voz ou texto livre com IA | O texto simples ("sorvete 20") já funciona sem IA | Médio |
| Integração com Atalhos/Wallet | Você paga mais com Pix, que a Wallet não vê | Baixo valor pra você |
| Metas de compra com progresso de poupança | A lista de desejos cobre a parte de consciência | Médio |

---

## 6. Próximos passos

1. **Hoje, se quiser:** brincar com a [prévia](https://claude.ai/artifact/3q7UBam9pt6Kn8VsbqQdQ8) usando "Explorar com dados de exemplo".
2. **Deploy:** seguir o [guia](deploy.md). Se quiser o PR pra `main`, é só pedir.
3. **Instalar no iPhone** e passar pelo checklist.
4. **Mês 0 em dezembro:** usar de verdade, meta de guardar R$ 0, e me contar o que incomodou.
