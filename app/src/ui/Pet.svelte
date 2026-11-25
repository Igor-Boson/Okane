<script lang="ts">
  import { urlPet } from './imagens';
  import type { ImagemPet } from '../dominio/pet';

  let { imagem, tamanho = 80, animado = true }: { imagem: ImagemPet; tamanho?: number; animado?: boolean } = $props();
</script>

<span class="pet" style="width:{tamanho}px;height:{tamanho}px">
  {#key imagem}
    <img class="pop" class:balanca={animado} src={urlPet(imagem)} alt="" width={tamanho} height={tamanho} />
  {/key}
  {#if imagem === 'dormindo'}<span class="zz" aria-hidden="true">z z</span>{/if}
</span>

<style>
  .pet { position: relative; display: inline-block; flex: 0 0 auto; }
  img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, .25)); }
  .balanca { animation: pop .45s cubic-bezier(.3, 1.6, .5, 1), balanca 3.2s ease-in-out .45s infinite; }
  .pop { animation: pop .45s cubic-bezier(.3, 1.6, .5, 1); }
  @keyframes pop { 0% { transform: scale(.85) } 100% { transform: scale(1) } }
  @keyframes balanca { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
  .zz { position: absolute; right: -4px; top: -4px; font-family: var(--f-display); font-weight: 800; color: var(--hero-muted); font-size: 14px; letter-spacing: .05em; animation: zz 2.4s ease-in-out infinite; }
  @keyframes zz { 0%, 100% { opacity: .4; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-4px) } }
</style>
