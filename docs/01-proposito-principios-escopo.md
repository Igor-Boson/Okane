# Okane — Propósito, Princípios e Escopo

> **Status:** 🟡 Rascunho v0.2 (decisões D1–D10 respondidas), esperando green light no resto
> **Etapa:** 1 de 4 (**Propósito + Princípios + Escopo** → Features → Arquitetura → Implementação)
> **Data:** 25/11/2026

---

## Como revisar

Cada item tem um ID (`PR-1`, `P3`, `E2`, `D5`...). Responde do jeito mais fácil pra você, por exemplo:

```
✅ PR-1..PR-4, P1, P2, P4
❌ P6: quero que o app me xingue mesmo
🔁 D6: pet no MVP sim, mas só com 2 estados
```

O que você não responder continua como **proposta**, não como decisão. Depois que você aprovar um bloco, eu marco ✅ aqui e sigo pra próxima etapa.

### Painel de aprovação

| Bloco | Itens | Status |
|---|---|---|
| 2. Propósito | PR-1 a PR-4 | 🟡 proposta |
| 3. A tensão do atrito | (conceito) | 🟡 proposta |
| 4. Princípios | P1 a P8 | 🟡 proposta |
| 6. Conceito do pet | PET | 🟡 proposta |
| 7. Jornadas | J1 a J5 | 🟡 proposta |
| 8. Escopo | E1 a E4 | 🟡 proposta |
| 10. Decisões | D1 a D11 | ✅ D1–D8, D10 · ⏳ D9 (reformulada), D11 (nova) |

---

## 0. Resumo em 30 segundos

O Okane é um app pessoal de gastos que **faz cada gasto pesar na hora em que ele acontece**, e não só no fim do mês, quando você abre a fatura.

Três ideias sustentam o app:

1. **Atrito mecânico perto de zero, atrito reflexivo de propósito.** Registrar precisa ser rápido (valor → salvar, uns 5 segundos). Em troca, o app te dá um momento curto de consciência: quanto aquilo pesa no seu dia e se valeu a pena.
2. **Um número responde "tô bem?":** quanto você ainda pode gastar hoje, com 🟢 / 🟡 / 🔴.
3. **Um bichinho que vive de você registrar, não de você gastar pouco.** Ser honesto alimenta o pet. O orçamento só mexe no humor dele.

---

## 1. O problema (o que eu entendi)

| # | O que você disse | O que eu li por trás |
|---|---|---|
| 1 | "É muito fácil comprar alguma coisa, comprei e acabou" | Pagar no digital (aproximação, Pix) tira a "dor de pagar". O gasto não é sentido. |
| 2 | "Depois fico pensando: caralho, comprei muita coisa" | A consciência existe, mas chega **tarde** (olhando pra trás) e **toda de uma vez** (dá susto, não ensina). |
| 3 | "Preencher gasto + categoria é um atrito alto" | O custo de registrar é o que mata esse tipo de app. Se demora, você para. |
| 4 | "Não gostei da divisão do app do banco" | As categorias do banco são genéricas e não refletem como **você** pensa no seu dinheiro. Além disso, o banco registra sem você participar, então você não fica mais consciente de nada. |
| 5 | "Colocar mais atrito, mais peso na hora da compra, pode ser bom" | Você quer o peso **de volta**, na dose certa. |
| 6 | "Gamificação vem me ajudando" | Motivação externa funciona com você. O desafio é manter isso por meses. |
| 7 | "Você está no limite / com folga / gastando demais" | Você quer **direção**, não relatório. Uma resposta, não um gráfico. |

**A pesquisa confirma isso.** Pagamentos eletrônicos, principalmente por aproximação, "doem menos" que dinheiro vivo e vêm junto com menos noção do quanto se gasta e com gasto maior ([DNB, 2022][dnb]; [Pain of paying][pop]). Um estudo da Cornell mostrou que, depois de adotar a compra com 1 clique, os clientes passaram a gastar em média ~28,5% a mais ([GCN][gcn]).

👉 **O Okane existe pra devolver, de forma controlada, o peso que o pagamento digital tirou.**

---

## 2. Propósito

### PR-1: Frase de propósito

> **O Okane existe pra eu sentir cada gasto na hora em que ele acontece, e não só quando a fatura chega.**

### PR-2: Objetivo principal vs. consequência

- **Objetivo principal: consciência.** Saber sem esforço quanto gastei, em quê e se valeu a pena.
- **Consequência esperada: gastar menos**, principalmente com coisas que, olhando depois, não valeram.
- **Por que separar as duas coisas:** se a meta for "gastar menos", o app vira juiz e você passa a esconder gasto dele. Se a meta for "enxergar", gastar menos vem junto e os dados continuam honestos.

### PR-3: Como saber se está funcionando

| Sinal | Meta inicial | Como medir |
|---|---|---|
| Você continua usando | Ainda em uso depois de **90 dias** | Dias com registro por semana |
| Registrar é rápido | Gasto comum em **≤ 5 segundos** | Tempo entre abrir o app e salvar |
| Os registros estão completos | **≥ 90%** dos gastos do mês registrados | Comparar com a fatura/extrato uma vez por mês |
| Consciência antes de comprar | Você abre o app **antes** de algumas compras não essenciais | Uso do "posso gastar?" (J1) |
| Mudança de comportamento | Gasto com coisas marcadas como "não valeu" **cai** mês a mês | Revisão semanal/mensal |

> ⚠️ O inimigo nº 1 não é gastar demais. É **largar o app na terceira semana**. Todo o resto vem depois disso.

### PR-4: O que o Okane NÃO é

- Não é planilha de contabilidade: registrar sempre importa mais que acertar o centavo.
- Não é app de investimento nem de patrimônio.
- Não é gerenciador de conta bancária: não precisa bater o saldo com o banco.
- Não é produto pra vender: é feito pra **uma** pessoa, você.

---

## 3. A tensão central: atrito

Você pediu duas coisas que parecem opostas: **menos atrito** pra registrar e **mais atrito** pra pesar a compra. Na verdade são dois atritos diferentes:

| | Atrito mecânico | Atrito reflexivo |
|---|---|---|
| **O que é** | Esforço que não acrescenta nada: digitar, navegar, escolher entre 30 categorias, preencher data | Um momento curto de pensar: "quanto isso pesa?", "valeu a pena?" |
| **O que causa** | Cansa, e você para de registrar | Gera consciência e muda comportamento |
| **Estratégia** | **Eliminar** (meta: perto de zero) | **Dosar** (curto, relevante, nunca chato) |
| **Exemplo** | Valor primeiro, categoria sugerida, atalho "☕ Café R$ 8" | "Esse sorvete = 40% do teu dia" / "Valeu a pena? 👍 👎" |

**Regras do atrito reflexivo:**

- Custa no máximo **1 toque**, e dá pra pular.
- Aparece **onde importa**: gasto não essencial ou acima de certo valor. Conta de luz não precisa de reflexão.
- Muda de forma pra não virar ruído. Se for sempre a mesma pergunta, você para de ler.
- Às vezes funciona melhor **depois**. Perguntar "valeu a pena?" 2 ou 3 dias depois é mais honesto, porque na hora todo sorvete vale a pena.

---

## 4. Princípios

Princípios são as regras que vamos usar pra **desempatar decisões** daqui pra frente. Se uma feature fere um princípio, ela não entra, ou então a gente muda o princípio de forma consciente.

### P1: Registrar em segundos
Fluxo padrão: abrir → digitar valor → (descrição opcional) → salvar. A categoria já vem **sugerida**. Meta: ≤ 5 s, e ≤ 3 toques pra gastos que se repetem.
- ✔️ Valor primeiro, teclado numérico já aberto, atalhos pros gastos frequentes, app abre direto na tela de registro.
- ✖️ Formulário com campo obrigatório além do valor; escolher conta, carteira e data a cada gasto.

### P2: Atrito reflexivo curto e de propósito
Todo gasto relevante vem com um **micromomento de consciência** (no máximo 1 toque, e dá pra pular).
- ✔️ Mostrar o impacto ("sobram R$ 23 hoje"), perguntar se valeu a pena, mostrar o custo em horas de trabalho.
- ✖️ Questionário, sermão, bloqueio, confirmação dupla.

### P3: Honestidade acima de desempenho
O app **sempre recompensa registrar**, inclusive gasto alto. Gastar demais é informação, não falta.
- **Por quê:** se registrar um gasto grande deixa o pet triste, você vai "esquecer" de registrar. Isso tem nome: **efeito avestruz**, a tendência de evitar informação financeira ruim (Karlsson, Loewenstein & Seppi, 2009). Os dados viram lixo e o app morre.
- ✔️ Registrar alimenta o pet. O orçamento só afeta o humor dele, e de forma reversível.
- ✖️ Punir por registrar, pet que morre, perder progresso pra sempre.

### P4: Uma resposta, não um relatório
A pergunta "tô bem?" se responde em **1 segundo de olhada**: quanto ainda dá pra gastar hoje, mais uma cor (🟢 folga / 🟡 no limite / 🔴 passou).
- ✔️ Tela inicial = número do dia + status. Gráficos ficam em segundo plano, pra quando você quiser.
- ✖️ Dashboard com 8 gráficos logo na abertura.

### P5: Categorias suas, e poucas
As categorias são **suas**, não do banco. Poucas (sugestão: de 6 a 10), com emoji. O app aprende com o uso: "sorvete" → 🍦 Comer fora.
- ✖️ Árvore de subcategorias; 40 categorias já prontas.

### P6: Gentil, mas honesto
Tom de amigo sincero: nem frio feito banco, nem culpando feito mãe. Fala a verdade sem humilhar.
- Pode ter um modo "sem filtro" opcional, se você curtir (o Cleo tem um modo "roast").
- ✖️ Culpa, vergonha, notificação passivo-agressiva, dark patterns.

### P7: Leve por padrão
Abre na hora, funciona sem internet (sorveteria sem sinal), tem poucas telas, não exige cadastro, não tem anúncio. Cada feature nova precisa **compensar o próprio peso**.
- ✖️ Colocar uma feature só "porque o Mobills tem".

### P8: Seus dados são seus
Dados financeiros pessoais ficam sob seu controle e podem ser exportados (CSV/JSON) a qualquer momento. Nada de vender dado e nada de terceiro sem necessidade.

---

## 5. Inspirações

| Referência | O que faz bem | O que vamos pegar | O que evitar |
|---|---|---|---|
| **Kakeibo** (método japonês de 1904, num caderno à mão) | Registrar à mão vira um ato de consciência. Categorias por **intenção**: necessidade, desejo, cultura, imprevisto. Quatro perguntas por mês: *quanto tenho? quanto quero guardar? quanto estou gastando? como posso melhorar?* | Ritual mensal com perguntas; separar necessidade de desejo | Ser todo manual e trabalhoso |
| **YNAB** | "Dê um trabalho a cada real"; foco em "quanto ainda tenho disponível"; transforma gastos anuais em mensais | Planejar o mês antes de gastar; reservar dinheiro pros gastos irregulares | Curva de aprendizado altíssima; orçamento base zero é pesado demais pra gente |
| **PocketGuard** | Um número: quanto sobra pra gastar | O número do dia (P4) | Depender de conexão com o banco |
| **Monefy / Money Manager** | Registro rapidíssimo: abre, digita o valor, toca no ícone, pronto | O fluxo de registro (P1) | Visual datado; quase nenhuma reflexão |
| **Fortune City** | Cada registro constrói uma cidade. Ganhou Red Dot e "Best App" no Google Play ([Sparkful][fc]) | Recompensa por **registrar** | Reviews dizem que o app foca mais em construir a cidade que em ensinar sobre dinheiro ([YourStory][fc-review]). O jogo não pode virar o objetivo |
| **Finch** (pet de autocuidado) | O pet cresce conforme você cumpre metas. Tom gentil, sem ranking nem pressão ([Engadget][finch]) | Personalidade e tom do pet; progresso que se acumula | Customização demais vira distração |
| **Duolingo** | Sequência de dias (streak) e opção de "congelar" a sequência | Sequência de dias registrando, com perdão | Notificação manipuladora; ansiedade de perder a sequência |
| **Cleo** | Assistente de finanças com personalidade (modo "roast") | Humor; mensagens que você *quer* ler | Depende de banco conectado (EUA/Reino Unido) |
| **Copilot Money** | Caixa de revisão: as transações chegam e você só confirma; o app aprende as categorias | Revisão rápida do dia e conferência com a fatura | Pago, focado nos EUA |
| **Mobills / Organizze** (BR) | Cartão de crédito com fatura, Open Finance, importam notificações do banco ([Canaltech][ct]) | Modelo de cartão, fatura e parcela (realidade brasileira) | Tela demais, anúncio, upsell, cara de contabilidade |
| **Atalhos do iPhone + Wallet** | A automação "Transação" ("Wallet" no iOS 26) dispara quando você paga por aproximação e passa **valor e estabelecimento** ([iDrop News][ios]) | Abrir o Okane já com o valor preenchido logo depois de pagar: registro em 1 toque + reflexão | Há relatos de instabilidade (timeout, valor vazio às vezes), então não pode ser o único caminho ([Apple Dev Forums][ios-bug]) |

**Resumo do benchmark:** entre os que olhei, os apps brasileiros resolvem **controle**, e os gringos resolvem **design** ou **gamificação**. Nenhum foca em **consciência na hora da compra**. É aí que o Okane entra.

---

## 6. Conceito do pet (validar a direção, não o visual)

**PET:** um bichinho cujo estado é um espelho **gentil** do seu comportamento:

| Atributo | Movido por | Por quê |
|---|---|---|
| **Fome** | Registrar. Cada registro alimenta; um dia sem registro deixa ele com fome | Recompensa o hábito e a honestidade (P3) |
| **Humor** | O ritmo do orçamento: folga = feliz, no limite = preocupado, passou = abatido | É o feedback de "tô bem?" com cara emocional (P4) |
| **Crescimento** | Constância ao longo de semanas: ele evolui, ganha itens, conhece lugares | Motivação de longo prazo, contra o abandono |
| **Voz** | É ele quem fala as mensagens do app | Dá personalidade e tom ao app (P6) |

**Regras inegociáveis:**

- **Ele nunca morre.** No pior caso fica doente ou dormindo, e se recupera. Se ele morre, você desiste do app (o efeito "já que estraguei, que se dane").
- **Humor ruim se recupera rápido.** Um dia bom já melhora.
- **Registrar um gasto alto nunca piora a fome.** Só o humor pode cair, e isso mostra o orçamento, não o ato de registrar.

> Nome, espécie e visual ficam pra etapa de features. Aqui eu só preciso do ✅ na **mecânica**.

---

## 7. Jornadas (os momentos de uso)

| ID | Momento | O que acontece | Tempo |
|---|---|---|---|
| **J1** | **Antes de comprar** (opcional) | Abre e vê "você pode gastar R$ 47 hoje", e decide com isso na cabeça | 2 s |
| **J2** | **Na hora ou logo depois** | Registra o valor (+ descrição), vê o impacto e responde "valeu a pena?" se quiser | 5–10 s |
| **J3** | **Fim do dia** | Pet + resumo do dia + "esqueceu algum gasto?" | 30 s |
| **J4** | **Fim da semana** | Revisão "valeu a pena?" dos gastos não essenciais da semana | 2 min |
| **J5** | **Virada do mês** | Ritual: renda do mês, gastos fixos e quanto quer guardar definem o número diário. Reflexão do mês que passou (perguntas do Kakeibo) e conferência com a fatura | 10 min |

---

## 8. Escopo

### E1: Premissas

- **Usuário único:** você (D10).
- **iPhone + PWA** (D1): o app é instalado pela opção "Adicionar à Tela de Início" do Safari. A etapa 3 confirma a escolha e valida as limitações do PWA no iOS.
- **Pagamento:** quase tudo é **débito ou Pix**, com algumas **parcelas em aberto** (D2). Fatura de cartão não é prioridade. As parcelas importam porque são o gasto mais invisível que existe: R$ 1.200 em 10x "parece" R$ 120.
- **Renda fixa mensal** (D3).
- **Só gastos** (D4): a renda é planejada, mas o saldo das contas não é acompanhado.
- **Celular primeiro:** o registro acontece na rua, no celular.
- **Custo de operação perto de zero:** é um projeto pessoal.
- **Funciona offline.**

### E2: Modelo de orçamento (proposta)

**O número do dia**, recalculado todo dia:

```
livre no mês = renda do mês − gastos fixos − parcelas do mês − meta de guardar
pode hoje    = (livre no mês − já gasto no mês) ÷ dias que faltam
```

- Como a renda é fixa (D3), o número **já funciona desde o primeiro dia**, sem precisar chutar nada. O único chute é a meta de guardar (ver D9).

- Gastou pouco hoje? Amanhã o número sobe, porque a folga acumula. Gastou muito? O número cai, mas **o app nunca te trava**: ele só mostra.
- **Status:** 🟢 gastando abaixo do ritmo do mês / 🟡 perto / 🔴 acima.
- **Gastos fixos** (aluguel, luz, assinaturas) são planejados uma vez e não pedem reflexão.
- **Limite por categoria:** opcional, fica pra depois.
- **Primeiro mês com meta de guardar = 0** (proposta, ver D9): você vê quanto sobra de verdade e só então define quanto quer guardar.

*(As fórmulas exatas ficam pra etapa de implementação. Aqui o que conta é o modelo mental.)*

### E3: Camadas (o que entra quando)

#### 🥇 MVP: dá pra usar no dia a dia em poucas semanas
Objetivo: validar o ciclo central **registrar → sentir → ajustar** com o mínimo possível.

- Registro rápido: valor, descrição opcional, categoria sugerida, data automática
- Atalhos de gastos frequentes (1 toque)
- Categorias editáveis, poucas, com emoji
- Planejamento do mês: renda, gastos fixos, meta de guardar
- **Parcelas em aberto como compromissos:** valor da parcela + quantas faltam, descontadas automaticamente a cada mês (D2)
- Número do dia + status 🟢🟡🔴
- Micro-reflexão depois de registrar (impacto no dia)
- Lista de gastos do dia e do mês, com edição e exclusão
- Pet v0 (D6): fome + humor, poucos estados, nunca morre, **fala com personalidade e tem tom alternável** (D7)
- Sequência de dias registrados, com perdão
- Funciona offline; exporta CSV

#### 🥈 v1: completo pra realidade brasileira

- Registrar uma compra parcelada nova: a reflexão mostra o **valor total**, e o orçamento conta a parcela do mês (D5)
- Revisão semanal "valeu a pena?" + relatório do que "não valeu" (J4)
- Lembrete de fechamento do dia (J3)
- Ritual mensal com perguntas (J5)
- Conferência com a fatura/extrato (marcar o que ficou faltando)
- **Lista de desejos com quarentena:** quer algo não essencial? Coloca na lista. Se depois de X dias ainda quiser, compra sem culpa.
- **Metas de compra** (D8): um item da lista de desejos vira meta (ex.: "comprar a roupa X"), com quanto falta guardar e quando dá pra comprar.
- Custo em horas de trabalho (opcional)
- Pet v1: evolução, itens, reações mais ricas

#### 🥉 Depois (talvez; só entra se o uso pedir)

- Registro por texto livre ou voz ("sorvete 20") com IA
- Integração com Atalhos/Wallet no iPhone. Ela **só pega pagamento por aproximação (Apple Pay)**, não Pix. Num PWA, provavelmente precisaria de um backendzinho: o Atalho envia o gasto e ele aparece pra revisão quando você abre o app.
- Importar extrato (OFX/CSV) pra conferir automaticamente
- Cartão de crédito com fatura e data de fechamento (só se você passar a usar crédito)
- Limite por categoria
- Insights automáticos ("você gasta 40% a mais com delivery às sextas")
- Widget na tela inicial / no relógio

### E4: Fora de escopo (não-objetivos)

| O quê | Por quê |
|---|---|
| Conexão automática com o banco (Open Finance) | Tira justamente o atrito reflexivo, que é o coração do app. Categoriza do jeito do banco (o que você não curtiu). Exige um agregador pago e põe dados sensíveis na mão de terceiros |
| Investimentos, patrimônio, saldo de contas | É outro problema e só adiciona peso |
| Várias pessoas / família / conta compartilhada | É pra um usuário só, pelo menos por enquanto |
| Várias moedas | Não é como você usa |
| Imposto de renda, notas fiscais | Não é contabilidade |
| Social, ranking, comparação com outras pessoas | Comparar gera vergonha ou competição, não consciência |
| Monetização (anúncio, premium) | O app é pra você |

---

## 9. Riscos

| Risco | Chance | Como mitigar |
|---|---|---|
| Largar o app depois de 2–3 semanas | **Alta** | P1 (5 s), pet + sequência com perdão, lembrete no fim do dia |
| Esquecer de registrar | **Alta** | Fechamento do dia ("esqueceu algo?"), conferência mensal com a fatura e, mais pra frente, automação com a Wallet |
| Esconder gasto pra não "decepcionar" o pet | Média | P3: registrar é sempre positivo |
| A reflexão virar ruído (você para de ler) | Média | Variar as mensagens, mostrar só em gasto relevante, 1 toque |
| A culpa te fazer evitar o app | Média | P6, pet nunca morre, número recalcula sem bronca |
| Inchar e virar um Mobills | **Alta** (dev empolgado 😅) | Lista de não-objetivos (E4) + P7 |
| Meta de guardar irreal no começo | Média | Primeiro mês com meta = 0 (D9) |
| Limitações do PWA no iOS (notificação, armazenamento local) | Média | Validar na etapa 3; backup/exportação desde o MVP (P8) |

---

## 10. Decisões

| ID | Pergunta | Decisão | O que muda |
|---|---|---|---|
| **D1** | iPhone ou Android? | ✅ **iPhone, PWA** (melhor custo-benefício) | Sem App Store. A integração com a Wallet fica pra depois e passaria por um backend |
| **D2** | Como você paga? Parcela muito? | ✅ **Débito/Pix**, com algumas parcelas em aberto | Fatura de cartão sai da v1. **Parcelas em aberto entram no MVP** como compromissos mensais |
| **D3** | Renda fixa ou variável? | ✅ **Fixa** | O número do dia funciona desde o dia 1 |
| **D4** | Só gastos ou também saldo? | ✅ **Só gastos** + renda planejada | Nada de bater saldo com o banco |
| **D5** | Como pesa uma compra parcelada? | ✅ **Reflexão mostra o total; orçamento conta a parcela** | Parcelas futuras aparecem como "comprometidas" |
| **D6** | Pet no MVP? | ✅ **Sim**, versão simples | Pet v0 no MVP |
| **D7** | Tom do pet | ✅ **Com personalidade, alternável** | Dois tons (ex.: fofo / sem filtro) desde o MVP |
| **D8** | Meta concreta? | ✅ **Mais pra frente**, metas de compra (ex.: "roupa X") | Metas de compra na v1, ligadas à lista de desejos |
| **D9** | ~~Primeiro mês só observando?~~ Reformulada abaixo | ⏳ | |
| **D10** | Mais alguém vai usar? | ✅ **Não** | Usuário único |
| **D11** | Em que dia cai seu salário? | ⏳ **nova** | Proposta: o "mês" do Okane vai **de um pagamento ao próximo**, não do dia 1 ao dia 30 |

### D9 reformulada

Como a renda é fixa, o número do dia já sai certo desde o começo: `renda − fixos − parcelas − meta de guardar`, dividido pelos dias. O único valor chutado é a **meta de guardar**. Se você chutar R$ 800 e na real só sobrarem R$ 300, o app fica 🔴 o mês inteiro e você desanima.

**Proposta:** no primeiro mês, meta de guardar = R$ 0. O número do dia mostra só "renda − fixos − parcelas". No fim do mês o app mostra quanto sobrou de verdade, e **aí** você define a meta pro mês seguinte com base no real.

---

## 11. Próximos passos

1. **Você:** green light ou ajustes em PR, P, PET, J e E, além de responder D9 e D11.
2. **Etapa 2 (Features):** detalhar o MVP: fluxos, rascunho das telas, regras do pet e do orçamento.
3. **Etapa 3 (Arquitetura):** stack e infraestrutura de um PWA offline-first (D1), validando as limitações do iOS.
4. **Etapa 4:** implementação.

---

## Fontes

- [Paying in a blink of an eye: it hurts less, but you spend more (De Nederlandsche Bank, 2022)][dnb]
- [Pain of paying (Wikipedia)][pop]
- [Tap to pay and the decades-long dismantling of friction (GCN)][gcn]
- [Fortune City (Sparkful)][fc]
- [Fortune City's game-like approach works but leaves users a little confused (YourStory)][fc-review]
- [This self-care virtual pet is helping me get my act together (Engadget)][finch]
- [Organizze ou Mobills: qual o melhor aplicativo para controlar gastos (Canaltech)][ct]
- [This new iOS 17 shortcut will help you keep track of your spending (iDrop News)][ios]
- [Shortcuts Automation Trigger Transaction Timeouts (Apple Developer Forums)][ios-bug]
- Karlsson, Loewenstein & Seppi (2009). *The ostrich effect: Selective attention to information.* Journal of Risk and Uncertainty.

[dnb]: https://www.dnb.nl/en/publications/research-publications/working-paper-2022/760-paying-in-a-blink-of-an-eye-it-hurts-less-but-you-spend-more/
[pop]: https://en.wikipedia.org/wiki/Pain_of_paying
[gcn]: https://gcn.com/tap-to-pay-decades-long-dismantling/21902/
[fc]: https://sparkful.app/fortune-city
[fc-review]: https://yourstory.com/2022/06/app-friday-fortune-city-game-like-approach-personal-finance
[finch]: https://www.engadget.com/apps/this-self-care-virtual-pet-is-helping-me-get-my-act-together-160027169.html
[ct]: https://canaltech.com.br/apps/organizze-ou-mobills-qual-aplicativo-melhor-para-controlar-gastos/
[ios]: https://www.idropnews.com/ios-17/this-new-ios-17-shortcut-will-help-you-keep-track-of-your-spending/197589/
[ios-bug]: https://developer.apple.com/forums/thread/765516
