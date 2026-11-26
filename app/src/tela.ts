/**
 * Faixa embaixo das abas no app instalado do iPhone.
 *
 * Com a barra de status translúcida, algumas versões do iOS (26.x) desenham a página numa área
 * mais curta que a tela: falta a altura da barra de status (~47 px) embaixo. Nada da página
 * consegue pintar ali (testado no aparelho: até um elemento fixo com a altura da tela é cortado);
 * a faixa só mostra a cor de fundo da página, que é a mesma da barra de abas (app.css).
 *
 * O que dá pra fazer: perceber que a página já termina acima da barrinha do iPhone e tirar o
 * espaço extra que as abas reservam pra ela (--falta-tela desconta do --base). Assim as abas
 * ficam na altura normal e a faixa vira só a continuação delas.
 */
export function ajustarAlturaDaTela(): void {
  const nav = navigator as Navigator & { standalone?: boolean };
  const instalado = nav.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (!instalado) return;
  const raiz = document.documentElement;

  const medir = () => {
    const casca = document.querySelector<HTMLElement>('.casca');
    if (!casca) return;
    const deitado = innerWidth > innerHeight;
    const lado = [Math.min(screen.width, screen.height), Math.max(screen.width, screen.height)];
    const larguraTela = deitado ? lado[1] : lado[0];
    const alturaTela = deitado ? lado[0] : lado[1];
    const fim = Math.min(casca.getBoundingClientRect().bottom, innerHeight);
    const falta = alturaTela - fim;
    // só no app em tela cheia (não no iPad dividido) e só pra uma faixa do tamanho da barra de status
    if (Math.abs(innerWidth - larguraTela) <= 2 && falta >= 20 && falta <= 120) {
      raiz.style.setProperty('--falta-tela', `${Math.round(falta)}px`);
    } else {
      raiz.style.removeProperty('--falta-tela');
    }
  };

  medir();
  requestAnimationFrame(medir);
  addEventListener('resize', medir);
  addEventListener('orientationchange', () => setTimeout(medir, 300));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') medir();
  });
}

/** Números da tela pra diagnóstico (Ajustes → Sobre). */
export function infoDaTela(): string {
  const falta = getComputedStyle(document.documentElement).getPropertyValue('--falta-tela').trim();
  return `tela ${screen.width}×${screen.height} · app ${innerWidth}×${innerHeight}${falta ? ` · ajuste ${falta}` : ''}`;
}
