import { tratarBackup } from '../../../server/backup';

interface Env {
  /** KV namespace ligado no painel da Cloudflare (Settings → Bindings → KV). */
  OKANE_BACKUP?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ctx => {
  if (!ctx.env.OKANE_BACKUP) {
    return new Response(JSON.stringify({ erro: 'Backup ainda não configurado no servidor' }), {
      status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const p = ctx.params.rota;
  const rota = Array.isArray(p) ? p : p ? [p] : [];
  return tratarBackup(ctx.request, ctx.env.OKANE_BACKUP, rota);
};
