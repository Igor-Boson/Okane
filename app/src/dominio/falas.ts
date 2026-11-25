import type { Tom } from './tipos';

/*
 * Falas da moedinha (docs/02, seção 5).
 * Sem filtro zoa o COMPORTAMENTO, nunca a PESSOA (P6). Palavrão leve, com moderação (D20).
 * Marcadores: {v} = valor em reais, {n} = número, {pct} = porcentagem.
 */

export type Situacao =
  | 'boasVindas' | 'primeiro' | 'registro' | 'grande' | 'volta'
  | 'folga' | 'limite' | 'passou'
  | 'zero' | 'fome' | 'faminto' | 'ontem'
  | 'sim' | 'nao'
  | 'sobra' | 'guardou' | 'frente' | 'sobraAutomatica' | 'estourouSemana'
  | 'mesSobrou' | 'mesEstourou' | 'ultimaParcela' | 'nivel'
  | 'desejoNovo' | 'desejoPronto' | 'desistiu' | 'comprou' | 'restaurado' | 'semDados';

type Banco = Record<Situacao, Record<Tom, string[]>>;

export const FALAS: Banco = {
  boasVindas: {
    fofo: ['Oi! Eu sou sua moedinha. Me conta cada gasto e eu te conto como tá a semana 💛'],
    sem: ['E aí. Eu sou a moedinha. Você me conta os gastos, eu te conto a verdade.'],
  },
  primeiro: {
    fofo: ['Primeiro registro! Começou bem 💛', 'Nosso primeiro gasto juntos! Que emoção.'],
    sem: ['Primeiro registro. Agora não tem mais volta.', 'Anotado. Bem-vindo à vida adulta.'],
  },
  registro: {
    fofo: ['Anotado! Obrigada por me contar 💛', 'Prontinho, tá registrado.', 'Anotei aqui. Bora!', 'Registrado! Tô de olho junto com você.', 'Feito! Cada registro me deixa mais forte 💪'],
    sem: ['Anotado. Pelo menos você é honesto.', 'Registrado. Não doeu, doeu?', 'Tá anotado. Eu tô de olho.', 'Ok, anotei. Próximo.', 'Registrado. Sua consciência agradece.'],
  },
  grande: {
    fofo: ['Eita, esse foi grandinho... só fica de olho 👀', 'Uau, esse pesou. Tudo bem, a gente ajusta.', 'Esse levou {pct}% da semana. Respira e segue 🫶'],
    sem: ['{v} de uma vez? Tá rico, é?', 'Porra, {v}. Espero que tenha valido.', '{pct}% da semana num gasto só. Ousado.'],
  },
  volta: {
    fofo: ['Você voltou!! Que bom, eu tava com saudade 💛', 'Ebaa, comida! Obrigada por lembrar de mim.'],
    sem: ['Olha quem apareceu. Bora, sem drama.', 'Finalmente. Achei que tinha me abandonado.'],
  },
  folga: {
    fofo: ['Tá indo bem, hein!', 'Tô orgulhosa de você!', 'Semana tranquila até aqui 💛', 'Folguinha boa. Continua assim!'],
    sem: ['Olha só, controlado. Quem diria.', 'Tá indo bem. Não estraga.', 'Semana no controle. Tô até desconfiada.', 'Folga. Aproveita sem torrar.'],
  },
  limite: {
    fofo: ['Hmm, tá apertando um pouquinho...', 'Vamos com calma até domingo?', 'Tá no limite. A gente consegue 🫶'],
    sem: ['Tá gastando rápido, hein.', 'Segura a onda aí, chefe.', 'No limite. Pensa duas vezes antes do próximo.'],
  },
  passou: {
    fofo: ['Passamos um pouquinho... semana que vem a gente acerta 🫂', 'Estourou, mas tudo bem. Amanhã é outro dia.'],
    sem: ['Estourou, porra. Agora segura até domingo.', 'Caralho, comprou muita coisa, hein?', 'Passou do limite. Parabéns, eu acho.'],
  },
  zero: {
    fofo: ['Um dia inteirinho sem gastar! 🎉', 'Dia sem gastos! Eu tô pulando de alegria!'],
    sem: ['Zero reais. Tá passando bem?', 'Dia sem gastar. Quem é você e o que fez com meu dono?'],
  },
  fome: {
    fofo: ['Tô com fominha... esqueceu de mim? 🥺', 'Ontem ninguém me contou nada... 🥺'],
    sem: ['Um dia sem registrar. Tá me escondendo coisa?', 'Cadê meus gastos? Tô com fome aqui.'],
  },
  faminto: {
    fofo: ['Zzz... me acorda registrando alguma coisa?', 'Dormi de fome... um registro me acorda 💤'],
    sem: ['Zzz... me acorda quando lembrar que eu existo.', 'Dois dias sem registrar. Virou monge ou tá me escondendo coisa?'],
  },
  ontem: {
    fofo: ['Ontem você não registrou nada. Foi dia sem gastos?'],
    sem: ['Ontem: nada registrado. Foi dia de monge ou você esqueceu?'],
  },
  sim: {
    fofo: ['Que bom! Gasto que vale a pena é gasto bem feito.', 'Valeu? Então foi dinheiro bem usado 💛'],
    sem: ['Valeu? Então tá valendo.', 'Se valeu, valeu. Sem culpa.'],
  },
  nao: {
    fofo: ['Anotado. Da próxima vez a gente pensa duas vezes 💛', 'Tudo bem. Perceber já é metade do caminho.'],
    sem: ['Pois é. Lembra disso na próxima.', 'Não valeu, né? Eu avisei. Mentira, não avisei. Mas aviso agora.'],
  },
  sobra: {
    fofo: ['Sobrou {v}! E aí?', 'Olha só, sobraram {v}! O que a gente faz?'],
    sem: ['Sobrou {v}. Vai guardar ou torrar?', '{v} sobrando. Decide aí.'],
  },
  guardou: {
    fofo: ['Guardadinho! 🐷', 'Guardado! Seu eu do futuro agradece 💛'],
    sem: ['Olha o adulto responsável.', 'Guardou. Respeito.'],
  },
  frente: {
    fofo: ['Beleza! As próximas semanas ficam mais folgadas.'],
    sem: ['Ok. Só não torra tudo na última semana.'],
  },
  sobraAutomatica: {
    fofo: ['Sobrou {v}! Vai direto pro guardado do mês 🐷'],
    sem: ['Sobrou {v}. Vai pro guardado, sem discussão.'],
  },
  estourouSemana: {
    fofo: ['Tudo bem. As próximas semanas ficam um pouquinho mais apertadas, e a gente segura junto.'],
    sem: ['Estourou. As próximas semanas pagam a conta.'],
  },
  mesSobrou: {
    fofo: ['Fechamos o mês com sobra! Tô muito orgulhosa 🎉'],
    sem: ['Mês fechado no azul. Não se acostuma.'],
  },
  mesEstourou: {
    fofo: ['O mês passou um pouco do planejado. Mês novo, vida nova 💛'],
    sem: ['O mês estourou. Bora fazer diferente nesse.'],
  },
  ultimaParcela: {
    fofo: ['Acabou a parcela! Mais dinheiro livre pra gente 🎉'],
    sem: ['Uma dívida a menos. Não inventa outra.'],
  },
  nivel: {
    fofo: ['Subi pro nível {n}! Obrigada por cuidar de mim ✨'],
    sem: ['Nível {n}. Tá ficando bom nisso.'],
  },
  desejoNovo: {
    fofo: ['Anotei o desejo. Daqui a uns dias a gente vê se ainda vale 💛'],
    sem: ['Quarentena ativada. Se ainda quiser depois, compra sem culpa.'],
  },
  desejoPronto: {
    fofo: ['A quarentena acabou. Ainda quer?'],
    sem: ['Passou a quarentena. E aí, ainda quer mesmo?'],
  },
  desistiu: {
    fofo: ['Desistiu! {v} que continuam com você 🎉'],
    sem: ['Desistiu. {v} salvos da impulsividade.'],
  },
  comprou: {
    fofo: ['Esperou e ainda quis? Então aproveita sem culpa 💛'],
    sem: ['Pensou, esperou, comprou. Assim que se faz.'],
  },
  restaurado: {
    fofo: ['Voltei! Tá tudo aqui, do jeitinho que você deixou 💛'],
    sem: ['Restaurado. Nem um centavo perdido.'],
  },
  semDados: {
    fofo: ['Ainda não tem nada aqui. Registra o primeiro gasto lá no Início!'],
    sem: ['Vazio. Vai lá registrar alguma coisa.'],
  },
};

export interface VarsFala { v?: string; n?: number; pct?: number }

/** Escolhe uma fala da situação, no tom dado. `sorteio` é injetável pra testes. */
export function fala(sit: Situacao, tom: Tom, vars: VarsFala = {}, sorteio: () => number = Math.random): string {
  const lista = FALAS[sit][tom];
  const s = lista[Math.floor(sorteio() * lista.length) % lista.length];
  return s
    .replace(/\{v\}/g, vars.v ?? '')
    .replace(/\{n\}/g, String(vars.n ?? ''))
    .replace(/\{pct\}/g, String(vars.pct ?? ''));
}
