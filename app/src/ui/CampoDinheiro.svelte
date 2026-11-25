<script lang="ts">
  import { centavosParaTexto, paraCentavos } from '../dominio/dinheiro';

  let { valor, aoMudar, id, rotulo, largura = '110px' }: {
    valor: number; aoMudar: (centavos: number) => void; id?: string; rotulo?: string; largura?: string;
  } = $props();

  let texto = $state('');
  let focado = false;
  $effect(() => {
    const v = valor;
    if (!focado) texto = v ? centavosParaTexto(v) : '';
  });

  function confirmar() {
    focado = false;
    const c = paraCentavos(texto) ?? 0;
    texto = c ? centavosParaTexto(c) : '';
    if (c !== valor) aoMudar(c);
  }
</script>

<span class="dinheiro">
  <span class="rs">R$</span>
  <input
    class="entrada" {id} type="text" inputmode="decimal" autocomplete="off" placeholder="0" aria-label={rotulo}
    style="width:{largura}" bind:value={texto} onfocus={() => (focado = true)} onblur={confirmar}
    onkeydown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
  />
</span>
