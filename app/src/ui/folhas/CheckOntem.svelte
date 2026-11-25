<script lang="ts">
  import { urlPet } from '../imagens';
  import { estado } from '../../dados/estado.svelte';
  import { fala } from '../../dominio/falas';
  import { ui } from '../ui.svelte';

  let { data }: { data: string } = $props();
  const frase = fala('ontem', estado.ajustes.tom);

  async function zero() {
    await estado.marcarDiaSemGasto(data);
    ui.fechar();
    ui.festejar(fala('zero', estado.ajustes.tom));
    ui.avisar('Dia sem gastos registrado ✨');
  }

  function esqueci() {
    ui.dataRegistro = data;
    ui.aba = 'inicio';
    ui.fechar();
    ui.avisar('Registro aberto com a data de ontem');
  }
</script>

<div class="pilha">
  <div class="fala"><img src={urlPet('preocupado')} alt="" /><p>{frase}</p></div>
  <div class="btn-linha">
    <button class="btn ouro" type="button" onclick={zero}>✨ Sim, zero gasto!</button>
    <button class="btn suave" type="button" onclick={esqueci}>😅 Esqueci, vou registrar</button>
  </div>
</div>
