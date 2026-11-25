<script lang="ts">
  import { onMount } from 'svelte';
  import { ligarBackupAutomatico } from './dados/backup';
  import { estado } from './dados/estado.svelte';
  import Instalar from './ui/Instalar.svelte';
  import PrimeiroUso from './ui/PrimeiroUso.svelte';
  import Principal from './ui/Principal.svelte';

  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  const instalado = nav.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const precisaInstalar = ios && !instalado;

  onMount(() => {
    void estado.carregar();
    ligarBackupAutomatico();
  });
</script>

<div class="casca">
  {#if estado.erroCarga}
    <div class="pagina centro">
      <img class="pet-carga" src="/pet/preocupado.webp" alt="" />
      <h1>Não consegui abrir seus dados</h1>
      <p class="nota">{estado.erroCarga}</p>
      <p class="nota">Feche o app e abra de novo. Se continuar, restaure pelo código de recuperação.</p>
    </div>
  {:else if !estado.carregado}
    <div class="pagina centro" aria-busy="true">
      <img class="pet-carga" src="/pet/feliz.webp" alt="" />
    </div>
  {:else if precisaInstalar && !estado.ajustes.semInstalar && !estado.ajustes.inicio}
    <Instalar />
  {:else if !estado.ajustes.inicio}
    <PrimeiroUso />
  {:else}
    <Principal />
  {/if}
</div>

<style>
  .centro { min-height: 100%; place-content: center; justify-items: center; text-align: center; background: var(--surface); }
  .pet-carga { width: 120px; height: 120px; object-fit: contain; }
</style>
