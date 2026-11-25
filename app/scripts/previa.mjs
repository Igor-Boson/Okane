// Junta o build de prévia (dist-previa) num HTML único pra publicar como artifact:
// CSS e JS embutidos, fontes como data URI. As imagens da moedinha vão como arquivos ao lado (pet/*.webp).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const dir = 'dist-previa';
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\.\/([^"]+\.css)"[^>]*>/g)].map(m => m[1]);
const js = [...html.matchAll(/<script type="module"[^>]*src="\.\/([^"]+\.js)"[^>]*><\/script>/g)].map(m => m[1]);
if (!css.length || !js.length) throw new Error('Não achei CSS/JS no index.html da prévia');

let estilo = '';
for (const f of css) {
  const pasta = dirname(join(dir, f));
  estilo += readFileSync(join(dir, f), 'utf8').replace(/url\(([^)]+\.woff2)\)/g, (_, u) => {
    const caminho = join(pasta, u.replace(/^["']|["']$/g, ''));
    return `url(data:font/woff2;base64,${readFileSync(caminho).toString('base64')})`;
  });
}
const codigo = js.map(f => readFileSync(join(dir, f), 'utf8')).join('\n').replace(/<\/script/gi, '<\\/script');

const saida = `<meta charset="utf-8">
<title>Okane</title>
<meta name="theme-color" content="#1C1E3B">
<style>${estilo}</style>
<div id="app"></div>
<script type="module">${codigo}</script>
`;
writeFileSync(join(dir, 'artifact.html'), saida);
console.log(`artifact.html: ${(saida.length / 1024).toFixed(0)} KB`);
