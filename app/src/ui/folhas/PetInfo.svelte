<script lang="ts">
  import { estado } from '../../dados/estado.svelte';
  import { imagemDoPet, progressoDoNivel } from '../../dominio/pet';
  import Pet from '../Pet.svelte';
  import { ui } from '../ui.svelte';

  const HUMOR = { feliz: 'Feliz', preocupado: 'Preocupada', abatido: 'Abatida' } as const;
  const FOME = { alimentado: 'Alimentada', fome: 'Com fome', faminto: 'Dormindo de fome' } as const;
  const imagem = $derived(imagemDoPet(estado.fome, estado.humor, ui.comemorando));
  const progresso = $derived(progressoDoNivel(estado.juntos));
</script>

<div class="pilha">
  <div class="centro">
    <Pet {imagem} tamanho={160} />
    <h2>{estado.ajustes.nomePet}</h2>
    <p class="nota">Nível {estado.nivel} · {estado.juntos} {estado.juntos === 1 ? 'dia junto' : 'dias juntos'}</p>
    <div class="nivel" aria-label="Progresso do nível"><span style="width:{progresso * 100}%"></span></div>
  </div>
  <div class="stats">
    <div class="stat"><div class="k">Humor</div><div class="v">{HUMOR[estado.humor]}</div></div>
    <div class="stat"><div class="k">Fome</div><div class="v">{FOME[estado.fome]}</div></div>
    <div class="stat"><div class="k">Sequência</div><div class="v">{estado.seq.dias} {estado.seq.dias === 1 ? 'dia' : 'dias'}{estado.seq.dias >= 2 ? ' 🔥' : ''}</div></div>
    <div class="stat"><div class="k">Folga da semana</div><div class="v">{estado.seq.perdaoUsado ? 'Usada' : 'Disponível'}</div></div>
  </div>
  <p class="nota">
    A fome depende de você registrar (inclusive “dia sem gastos”). O humor segue o ritmo da semana.
    Ela sobe de nível a cada 7 dias registrados, nunca morre e nunca perde progresso.
    Esquecer 1 dia por semana não quebra a sequência.
  </p>
</div>

<style>
  .centro { display: grid; justify-items: center; gap: 4px; text-align: center; }
  .nivel { width: 160px; height: 6px; border-radius: 9px; background: var(--surface-2); overflow: hidden; margin-top: 4px; }
  .nivel span { display: block; height: 100%; background: var(--gold-fill); }
</style>
