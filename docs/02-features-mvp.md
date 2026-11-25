# Okane: Features do MVP

> **Status:** ✅ **Aprovado** (v1.0) · [protótipo clicável](https://claude.ai/artifact/3q7UBam9pt6Kn8VsbqQdQ8) em `prototype/`
> **Etapa:** 2 de 4 (Propósito ✅ → **Features** → Arquitetura → Implementação)
> **Base:** [01: Propósito, princípios e escopo](01-proposito-principios-escopo.md)
> **Data:** 25/11/2026

---

## Como revisar

Igual à etapa 1: aprova, recusa ou ajusta pelos IDs (`T1`, `F2`, `R3`, `PET-R2`...). As decisões novas continuam a numeração da etapa 1 (**D13 a D20**) e estão todas na seção 9.

### Painel de aprovação

| Bloco | Itens | Status |
|---|---|---|
| 1. Mapa do app | T1 a T5, O1 | ✅ aprovado |
| 2. Registro e reflexão | F1 a F3 | ✅ aprovado |
| 3. Regras do orçamento | R1 a R8 | ✅ aprovado |
| 4. Regras do pet | PET-R1 a PET-R5 | ✅ aprovado |
| 5. Falas do pet | Exemplos nos 2 tons | ✅ aprovado |
| 6. Categorias iniciais | CAT | ✅ aprovado |
| 7. Primeiro uso | O1 | ✅ aprovado |
| 9. Decisões | D13 a D20 | ✅ todas respondidas |

> Os rascunhos de tela são **wireframes de texto**: mostram o que aparece e em que ordem, não o visual. O visual vem depois.

---

## 0. Resumo

- **Três abas:** Início, Gastos e Plano. O Início junta o número da semana, o pet e o teclado de registro na mesma tela: **abriu, digitou, tocou na categoria, pronto**.
- **Registrar = valor + 1 toque na categoria.** Tocar na categoria já salva. Descrição é opcional.
- **Depois de salvar** aparece um cartão rápido com o impacto na semana, a reação do pet e, nos gastos não essenciais, "valeu a pena?".
- **Na virada da semana**, o app fecha a semana e, se sobrou dinheiro, pergunta: **guardar ou usar nas próximas semanas?** É um momento de consciência que não custa nada.
- **O pet** come quando você registra (inclusive "hoje não gastei nada"), fica com o humor da semana e **nunca morre**. Fala em 2 tons: **Fofo** e **Sem filtro**.
- **Tudo é recalculado a partir dos registros.** Editar, apagar ou registrar algo de ontem nunca deixa a conta errada.

---

## 1. Mapa do app

```
           ┌──────────────┐
           │ Instalar (O0) │  ← só no Safari, antes de tudo
           └──────┬───────┘
           ┌──────▼───────┐
           │ Primeiro uso  │  O1: salário, fixos, parcelas, pet
           └──────┬───────┘
   ┌──────────────┼──────────────┐
┌──▼───┐      ┌───▼───┐      ┌───▼───┐
│Início│      │Gastos │      │ Plano │   ← 3 abas
│  T1  │      │  T2   │      │  T3   │
└──┬───┘      └───────┘      └───┬───┘
   │ cartões por cima do Início   │
   ├─ F2 Reflexão (após salvar)   └─ T4 Ajustes (⚙︎)
   ├─ F3 Check de ontem
   ├─ R2 Virada da semana
   └─ R3 Virada do mês
```

| ID | Tela | Pra quê |
|---|---|---|
| **T1** | **Início** | Ver "tô bem?" e registrar, tudo na mesma tela |
| **T2** | **Gastos** | Ver, editar e apagar o que foi registrado (semana / mês) |
| **T3** | **Plano** | Salário, fixos, parcelas, meta de guardar → quanto sobra por semana |
| **T4** | **Ajustes** | Categorias, atalhos, pet (nome e tom), exportar/backup |
| **T5** | **Pet** (cartão) | Tocar no pet mostra estado, sequência e "dias juntos" |

Reflexão, check de ontem, virada da semana e virada do mês **não são telas**. São cartões que sobem por cima do Início e somem sozinhos ou com 1 toque.

---

## 2. Registro e reflexão

### T1: Início

```
 Semana 23/11 – 29/11                          ⚙︎
 ────────────────────────────────────────────────
                 ( •‿• )
           "Tá indo bem, hein!"

            PODE GASTAR NESTA SEMANA
                    R$ 230
         🟢  ≈ R$ 46/dia até domingo
         ▓▓▓▓▓▓▓▓░░░░░░   R$ 170 de R$ 400
 ────────────────────────────────────────────────
  R$ 20
  o que foi? (opcional)
  [🍦 Besteirinha] [🍔 Comer fora] [🛒 Mercado] [⋯]

          1         2         3
          4         5         6
          7         8         9
          ,         0         ⌫
 ────────────────────────────────────────────────
     🏠 Início        📋 Gastos        🗓️ Plano
```
*(valores de exemplo)*

- **Metade de cima = resposta.** Metade de baixo = registro. É o P1 e o P4 na mesma tela.
- **Teclado próprio**, sempre aberto. O teclado do iPhone não sobe e não cobre nada.
- **Sem valor digitado**, os botões mostram **atalhos** com valor: `[☕ Café R$ 8] [🚌 Ônibus R$ 5]`. **1 toque e está registrado.**
- **Com valor digitado**, os botões mostram **categorias sugeridas** (F1).

### F1: Registrar

| Passo | O que acontece | Toques |
|---|---|---|
| 1 | Abre o app, que já está no Início com o teclado | 0 |
| 2 | Digita o valor (`2` `0`) | 2 |
| 3 | *(opcional)* Toca em "o que foi?" e escreve "sorvete". As sugestões de categoria se atualizam | — |
| 4 | Toca na categoria, **e isso já salva** | 1 |
| 5 | Sobe o cartão de reflexão (F2) | 0 |

**Total para um gasto comum: valor + 1 toque.** Pra um atalho: **1 toque**.

**Detalhes:**
- **Valor:** `20` = R$ 20,00. A vírgula serve pros centavos (`12,50`). Ver D13.
- **Data:** agora. Em "⋯ mais opções" dá pra trocar pra **ontem** ou escolher uma data.
- **Como a categoria é sugerida** (sem IA, só regras, nessa ordem):
  1. Descrição igual ou parecida com uma anterior → a mesma categoria daquela vez ("sorvete" → 🍦).
  2. Sem descrição → as categorias mais usadas **nesse horário e dia da semana** (sexta à noite ≠ segunda de manhã).
  3. Senão → as mais usadas no geral.
- **Atalhos:** quando o mesmo gasto (descrição + valor) aparece 3 vezes, o app sugere virar atalho. Também dá pra fixar na mão em Ajustes.
- **Desfazer:** o cartão de reflexão tem "desfazer" por alguns segundos, pro caso de toque errado.

### F2: Cartão de reflexão (depois de salvar)

**Gasto normal:**
```
 ────────────────────────────────────────────────
  ✅ 🍦 Sorvete · R$ 20                  desfazer
  Sobram R$ 210 na semana (≈ R$ 42/dia)

  ( •‿• )  "Anotado! Obrigado por me contar 💛"

  Valeu a pena?       👍         👎        pular
 ────────────────────────────────────────────────
```

**Gasto grande** (mais de 30% da cota da semana):
```
 ────────────────────────────────────────────────
  ⚠️ 🛍️ Tênis · R$ 180                   desfazer
  Isso é 45% da tua semana.
  Sobram R$ 50 (≈ R$ 10/dia)

  ( •︿• )  "Eita, esse foi grandinho... 👀"

  Valeu a pena?       👍         👎        pular
 ────────────────────────────────────────────────
```

**Regras:**
- **Impacto sempre aparece.** É o atrito reflexivo mínimo: custa zero toques.
- **"Valeu a pena?" só aparece em categoria não essencial.** Mercado, transporte e saúde não perguntam (ver CAT).
- **O cartão some sozinho** depois de alguns segundos, ou com um toque fora dele. Responder é opcional (P2).
- **As falas variam.** Cada situação tem várias frases, pra não virar ruído.
- **Nada bloqueia.** Não existe "tem certeza?".
- A **revisão atrasada** do "valeu a pena?" (2–3 dias depois, mais honesta) fica pra v1. Ver D14.

### F3: Check de ontem

Na primeira vez que você abre o app no dia, **se ontem não teve nenhum registro**:

```
 ────────────────────────────────────────────────
  ( •‿• )  "Ontem você não registrou nada.
            Foi dia sem gastos?"

  [✨ Sim, zero gasto!]    [😅 Esqueci, vou registrar]
 ────────────────────────────────────────────────
```

- **"Sim, zero gasto!"** registra um **dia sem gastos**: alimenta o pet e mantém a sequência.
- **"Esqueci"** abre o registro já com a data de ontem.
- Faz o papel do "fechamento do dia" (J3) **sem precisar de notificação**, que é o ponto fraco do PWA no iPhone.

### T2: Gastos

```
 Gastos                         [Semana] [Mês]
 ────────────────────────────────────────────────
  Total da semana: R$ 320 de R$ 400   🟡

  🍔 Comer fora   ▓▓▓▓▓▓▓▓▓░░  R$ 140
  🍦 Besteirinha  ▓▓▓▓░░░░░░░  R$ 62
  🛒 Mercado      ▓▓▓░░░░░░░░  R$ 58
  ...
 ────────────────────────────────────────────────
  Hoje · R$ 20
    🍦 Sorvete                 R$ 20    👍
  Ontem · R$ 0
    ✨ Dia sem gastos
  Seg 23/11 · R$ 300
    🛍️ Tênis                   R$ 180   👎
    🍔 iFood                   R$ 120
```

- Agrupado por dia, com o total de cada dia.
- Barras simples por categoria. **Sem gráfico complexo** (P4).
- Tocar num gasto permite editar (valor, descrição, categoria, data, valeu a pena) ou apagar, com desfazer.

---

## 3. Regras do orçamento

Base aprovada na etapa 1 (E2): **livre no mês = salário − fixos − parcelas − meta de guardar**, dividido em cotas semanais.

### R1: Status 🟢🟡🔴

| Status | Quando |
|---|---|
| 🟢 **Folga** | Gasto da semana ≤ ritmo esperado até hoje **+ 1 dia de tolerância** |
| 🟡 **No limite** | Acima do ritmo, mas ainda dentro da cota da semana |
| 🔴 **Passou** | Passou da cota da semana. O número fica negativo: "passou R$ 20" |

- **Ritmo esperado** = cota × (dias da semana já vividos ÷ 7).
- A **tolerância de 1 dia** evita ficar 🟡 por causa de um único gasto na segunda de manhã. Gasto real é irregular.
- *Exemplo:* cota de R$ 400, hoje é quarta (3º dia). Ritmo esperado = R$ 171, mais 1 dia de tolerância (R$ 57) = **R$ 228**. Gastou R$ 170 → 🟢; R$ 300 → 🟡; R$ 420 → 🔴.

### R2: Virada da semana

Na primeira vez que você abre o app na segunda, sobe o **fechamento da semana**:

```
 ────────────────────────────────────────────────
  Semana 23/11 – 29/11 fechada   🟢
  Gastou R$ 320 de R$ 400
  Quem mais levou: 🍔 Comer fora (R$ 140)
  👎 Não valeu: R$ 180
  Sequência: 12 dias registrando 🔥

  ( ^‿^ )  "Sobrou R$ 80! E aí?"

  [🐷 Guardar R$ 80]   [➡️ Usar nas próximas semanas]
 ────────────────────────────────────────────────
```

- **Sobrou → você escolhe:** **guardar** (sai do livre do mês e vai pro "guardado") ou **passar pra frente** (redistribui nas próximas semanas). Ver D15.
  - *Por quê:* passar a folga pra frente automaticamente cria um efeito ruim: a última semana do mês fica "rica" e dá vontade de gastar tudo. Fazer você escolher é atrito reflexivo bom.
  - Se você não escolher, **passa pra frente**, que é o que foi aprovado na etapa 1.
- **Estourou → sempre passa pra frente**, sem escolha. As próximas semanas ficam mais apertadas. O app mostra isso sem bronca.

### R3: Virada do mês

Na primeira vez que você abre o app no mês novo:

1. **Resumo do mês:** quanto gastou, quanto sobrou, quanto foi guardado.
2. **Sobra do mês vira "guardado"** e **não** passa pro mês seguinte. Cada mês começa limpo (ver D16).
3. **"Salário, fixos e parcelas iguais ao mês passado?"** → `[Sim, tudo igual]` `[Revisar]`. As parcelas já vêm com uma a menos.
4. **No fim do primeiro mês** (D9): "Sobraram R$ X. Quer guardar R$ Y por mês a partir de agora?", com sugestão de ~75% da sobra real.

### R4: Tudo é derivado dos registros

Nenhum saldo fica salvo. **Todos os números são recalculados a partir dos gastos e do plano**. Por isso:
- **Editar ou apagar** um gasto corrige tudo na hora, inclusive semanas já fechadas.
- **Registrar algo de dias atrás** cai na semana certa. Se aquela semana já fechou, a diferença passa pra semana atual.
- Não existe "saldo dessincronizado". É uma regra de arquitetura que nasce aqui.

### R5: Parcelas em aberto

- Cada parcela tem **nome, valor e quantas faltam**. Ex.: "Celular, R$ 200, faltam 4".
- Ela entra no plano de cada mês e diminui sozinha na virada do mês.
- **Última parcela = comemoração:** "Acabou o celular! 🎉 +R$ 200 livres por mês a partir de agora."
- Registrar uma **compra parcelada nova** fica pra v1 (D5). No MVP, uma compra parcelada nova é adicionada à mão no Plano.

### R6: Entrada extra (13º, freela, presente)

- **Por padrão não entra na cota semanal.** Vai direto pro "guardado".
- Você pode liberar uma parte de propósito: "Liberar R$ 300 desse 13º pros gastos de dezembro?". Ver D17.
- *Por quê:* dinheiro extra que cai direto na cota some do mesmo jeito que o resto.

### R7: Estouro

- **Semana estourada:** o número fica vermelho e negativo e as próximas semanas encolhem. Nada é bloqueado.
- **Mês estourado** (gastou mais que o livre): o app mostra sem drama: "Novembro passou R$ 150 do planejado". O pet fica abatido, mas **se recupera no mês seguinte**.

### R8: Semana que cruza a virada do mês

- A semana é sempre de segunda a domingo. Exemplo: 30/11 (seg) a 06/12 (dom).
- A cota dessa semana **soma a parte de cada mês**, proporcional aos dias. Cada gasto conta no mês da sua data.
- **Você só vê um número.** A conta por trás é problema do app.

---

## 4. Regras do pet

### PET-R1: Fome (registro)

| Estado | Quando |
|---|---|
| 😊 **Alimentado** | Teve registro (ou "dia sem gastos") hoje ou ontem |
| 🥺 **Com fome** | 1 dia inteiro sem nenhum registro |
| 😴 **Faminto / dormindo** | 2 dias ou mais sem registro |

- **Volta ao normal com 1 registro.** Não precisa "recuperar" nada.
- **Valor não importa:** R$ 5 e R$ 500 alimentam igual (P3).

### PET-R2: Humor (orçamento)

- Segue o status da semana: 🟢 **feliz** · 🟡 **preocupado** · 🔴 **abatido**.
- Na virada da semana, o humor **volta pro neutro**. Semana nova, vida nova.

### PET-R3: Sequência

- Conta os **dias seguidos com registro**, incluindo "dia sem gastos".
- **Registro atrasado vale:** se esqueceu ontem e registrou hoje com a data de ontem, ontem conta. Isso premia ser completo, não só aparecer.
- **Perdão:** 1 dia de folga por semana sem quebrar a sequência.

### PET-R4: Crescimento

- **MVP:** só um contador de "dias juntos" (dias com registro) e um nível simples, que sobe a cada 7 dias registrados.
- **v1:** evolução visual, itens e lugares.

### PET-R5: Nunca

- Nunca morre.
- Nunca perde nível ou progresso.
- Nunca reage mal a um **registro**. Só ao **ritmo** da semana.
- Nunca manda notificação de culpa.

**Estados visuais no MVP:** 3 expressões (feliz, preocupado, abatido) + 2 sobreposições (com fome, dormindo) + 1 especial (comemorando). São **6 desenhos** no total.

---

## 5. Falas do pet (exemplos)

O tom muda em Ajustes (D7). Regra do **Sem filtro**: zoa o **comportamento**, nunca a **pessoa** (P6).

| Situação | 🧸 Fofo | 🌶️ Sem filtro |
|---|---|---|
| Registro normal | "Anotado! Obrigado por me contar 💛" | "Anotado. Pelo menos você é honesto." |
| Gasto grande | "Eita, esse foi grandinho... só fica de olho 👀" | "R$ 180 de uma vez? Tá rico, é?" |
| Semana 🟢 | "Tô tão orgulhoso! Ainda sobram R$ 180" | "Olha só, controlado. Quem diria." |
| Semana 🔴 | "Passamos um pouquinho... semana que vem a gente acerta 🫂" | "Estourou. Agora segura a onda até domingo." |
| Dia sem gastos | "Um dia inteirinho sem gastar! 🎉" | "Zero reais. Tá passando bem?" |
| Com fome | "Tô com fominha... esqueceu de mim? 🥺" | "Dois dias sem registrar. Virou monge ou tá me escondendo coisa?" |
| Volta depois de sumir | "Você voltou!! Que bom 💛" | "Olha quem apareceu. Bora, sem drama." |
| Última parcela | "Acabou a parcela! Mais dinheiro livre pra gente 🎉" | "Uma dívida a menos. Não inventa outra." |

Cada situação vai ter de 5 a 10 variações por tom.

---

## 6. Categorias iniciais (CAT)

| Categoria | Inclui | Essencial? |
|---|---|---|
| 🛒 **Mercado** | supermercado, feira, padaria do dia a dia | ✅ não pergunta "valeu?" |
| 🍔 **Comer fora** | restaurante, delivery, almoço fora | |
| 🍦 **Besteirinha** | café, doce, sorvete, lanchinho | |
| 🚗 **Transporte** | Uber, ônibus, gasolina, estacionamento | ✅ |
| 🎉 **Lazer** | rolê, bar, cinema, jogos, viagem | |
| 🛍️ **Compras** | roupa, eletrônico, coisas pra casa | |
| 💊 **Saúde** | farmácia, consulta, exame | ✅ |
| 🎁 **Outros** | presente, imprevisto, o resto | |

- **Besteirinha** existe de propósito: é onde mora o gasto pequeno e invisível que soma muito no fim do mês.
- **Fixos não são categoria.** Aluguel, luz, internet e assinaturas moram no Plano (T3).
- Em Ajustes você pode renomear, trocar o emoji, marcar como essencial, reordenar ou arquivar. Ver D19.

---

## 7. Plano (T3) e primeiro uso (O1)

### T3: Plano

```
 Plano de dezembro
 ────────────────────────────────────────────────
  💰 Salário                          R$ 5.000

  📌 Fixos                            R$ 2.300
     Aluguel R$ 1.500 · Luz R$ 180 ·
     Internet R$ 120 · ...

  💳 Parcelas                         R$ 350
     Celular  R$ 200   faltam 4 · até mar/27
     Curso    R$ 150   faltam 2 · até jan/27

  🐷 Guardar                          R$ 0
     1º mês: só observando
 ────────────────────────────────────────────────
  Livre no mês                        R$ 2.350
  ≈ R$ 530 por semana
```
*(valores de exemplo)*

### O0: Instalar primeiro

- No iPhone, o app instalado na tela de início **guarda os dados separado do Safari**. Se você começar pelo Safari e instalar depois, os dados não vão junto (a etapa 3 confirma esse comportamento).
- Por isso, **aberto no Safari, o app só mostra como instalar**: Compartilhar → "Adicionar à Tela de Início". O resto acontece no app instalado.

### O1: Primeiro uso (≤ 2 minutos)

| Passo | O que pede | Pode pular? |
|---|---|---|
| 1 | Boas-vindas: "Registrar em segundos, sentir cada gasto." | — |
| 2 | Salário líquido | Não |
| 3 | Gastos fixos (com sugestões tocáveis: aluguel, luz, internet, celular, academia, streaming...) | Sim |
| 4 | Parcelas em aberto (nome, valor, quantas faltam) | Sim |
| 5 | Categorias (as 8 de cima, editáveis depois) | Sim |
| 6 | Pet: nome + tom (Fofo / Sem filtro) | Não (é rápido) |
| 7 | Resultado: "Você tem ≈ R$ 530 por semana." → Início | — |

---

## 8. T4: Ajustes

- **Categorias:** renomear, emoji, essencial sim/não, reordenar, arquivar.
- **Atalhos:** fixar e remover.
- **Pet:** nome e tom.
- **Dados:** exportar CSV, **backup completo** (arquivo) e restaurar backup (P8). No PWA, o backup é a garantia contra perder dados.
- **Sobre.**

*Fica pra v1:* lembretes por notificação, revisão semanal "valeu a pena?" atrasada, lista de desejos, metas de compra, custo em horas de trabalho e evolução visual do pet.

---

## 9. Decisões

> ✅ Todas aprovadas como recomendado. Na D18 a escolha foi a **moedinha**; na D20, **sim**, o Sem filtro pode ter palavrão leve.

| ID | Pergunta | Decisão |
|---|---|---|
| **D13** | Como funciona a digitação do valor? (a) `20` = R$ 20, com vírgula pros centavos (b) estilo maquininha: `2000` = R$ 20,00 | **(a)**: a maioria dos gastos é em reais redondos. Menos dígitos, mais rápido |
| **D14** | "Valeu a pena?" na hora já no MVP, e a revisão atrasada (mais honesta) na v1? | **Sim.** Já coleta o dado desde o dia 1 |
| **D15** | Sobrou dinheiro na semana: perguntar "guardar ou passar pra frente"? | **Sim, perguntar.** Se você não responder, passa pra frente |
| **D16** | Sobra do mês vira "guardado" e não passa pro mês seguinte? | **Sim.** Cada mês começa limpo |
| **D17** | Entrada extra (13º etc.) vai pro guardado por padrão, e você libera uma parte se quiser? | **Sim.** Lembrando que dezembro tem 13º |
| **D18** | Visual do pet | ✅ **Moedinha com carinha**, estilo 3D de brinquedo de vinil, gerada com o Gemini (Nano Banana Pro). Os 6 estados estão em `design/pet/` (PNG transparente 640px) e `prototype/pet/` (WebP 360px) |
| **D19** | As 8 categorias iniciais estão boas? | ✅ Sim |
| **D20** | O tom Sem filtro pode ter palavrão leve? | ✅ Sim, com moderação |

---

## 10. Próximos passos

1. ✅ **Etapa 2 aprovada.** Protótipo clicável publicado pra sentir o fluxo.
2. **Etapa 3 (Arquitetura):** stack do PWA, armazenamento local + backup, como os números são calculados (R4), confirmar os comportamentos do iOS (O0, notificações), deploy e custo.
3. **Etapa 4:** implementação, começando pelo ciclo **registrar → número da semana → reflexão** antes de qualquer outra coisa.
