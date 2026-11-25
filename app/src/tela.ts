/**
 * Altura da tela no app instalado (Tela de Início) do iPhone.
 *
 * Com a barra de status translúcida, algumas versões do iOS calculam a viewport mais curta que a
 * tela (sem a altura da barra de status, ~47 px). A casca, presa nas bordas, termina antes do fim
 * da tela e sobra uma faixa embaixo das abas. Aqui a gente mede: se a casca não chega no fim da
 * tela e a janela ocupa a tela inteira, força a altura pela tela (variável --altura-tela).
 */
export function ajustarAlturaDaTela(): void {
  const nav = navigator as Navigator & { standalone?: boolean };
  const instalado = nav.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (!instalado) return;
  const raiz = document.documentElement;

  const medir = () => {
    raiz.style.removeProperty('--altura-tela');
    const casca = document.querySelector<HTMLElement>('.casca');
    if (!casca) return;
    const deitado = innerWidth > innerHeight;
    const lado = [Math.min(screen.width, screen.height), Math.max(screen.width, screen.height)];
    const larguraTela = deitado ? lado[1] : lado[0];
    const alturaTela = deitado ? lado[0] : lado[1];
    if (Math.abs(innerWidth - larguraTela) > 2) return; // janela menor que a tela (iPad dividido): não mexe
    const falta = alturaTela - casca.getBoundingClientRect().bottom;
    if (falta > 2 && falta <= 120) raiz.style.setProperty('--altura-tela', `${alturaTela}px`);
  };

  medir();
  requestAnimationFrame(medir);
  addEventListener('resize', medir);
  addEventListener('orientationchange', () => setTimeout(medir, 300));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') medir();
  });
}
