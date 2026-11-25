interface Env { OKANE_BACKUP?: KVNamespace }

/** O app pergunta aqui se o backup na nuvem está disponível. */
export const onRequest: PagesFunction<Env> = async ctx =>
  new Response(JSON.stringify({ ok: true, backup: !!ctx.env.OKANE_BACKUP }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
