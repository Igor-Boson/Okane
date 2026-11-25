import { describe, expect, it } from 'vitest';
import { cifrar, decifrar, derivarChaves, gerarCodigo, normalizarCodigo } from './cripto';

describe('código de recuperação', () => {
  it('gera 20 caracteres em 4 grupos', () => {
    const c = gerarCodigo();
    expect(c).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{5}$/);
    expect(normalizarCodigo(c)).toBe(c);
  });
  it('aceita o código digitado de qualquer jeito', () => {
    expect(normalizarCodigo('abcde fghjk mnpqr stvwx')).toBe('ABCDE-FGHJK-MNPQR-STVWX');
    expect(normalizarCodigo('oooo1-iiiil-00000-11111')).toBe('00001-11111-00000-11111');
    expect(normalizarCodigo('curto')).toBeNull();
    expect(normalizarCodigo('UUUUU-UUUUU-UUUUU-UUUUU')).toBeNull();
  });
  it('o mesmo código sempre gera o mesmo endereço', async () => {
    const a = await derivarChaves('ABCDE-FGHJK-MNPQR-STVWX');
    const b = await derivarChaves('abcde fghjk mnpqr stvwx');
    const c = await derivarChaves('ABCDE-FGHJK-MNPQR-STVW0');
    expect(a.id).toMatch(/^[0-9a-f]{64}$/);
    expect(a.id).toBe(b.id);
    expect(a.id).not.toBe(c.id);
  });
});

describe('cifra', () => {
  it('ida e volta, e código errado não abre', async () => {
    const { chave } = await derivarChaves('ABCDE-FGHJK-MNPQR-STVWX');
    const dados = new TextEncoder().encode(JSON.stringify({ oi: 'mundo', n: Array.from({ length: 200 }, (_, i) => i) }));
    const blob = await cifrar(chave, dados);
    expect(new TextDecoder().decode(blob.slice(0, 4))).toBe('OKB1');
    expect(blob.length).toBeLessThan(dados.length); // comprimido
    expect(new TextDecoder().decode(await decifrar(chave, blob))).toBe(new TextDecoder().decode(dados));
    const outra = await derivarChaves('ZZZZZ-FGHJK-MNPQR-STVWX');
    await expect(decifrar(outra.chave, blob)).rejects.toThrow(/código/);
  });
  it('detecta adulteração', async () => {
    const { chave } = await derivarChaves('ABCDE-FGHJK-MNPQR-STVWX');
    const blob = await cifrar(chave, new TextEncoder().encode('segredo'));
    blob[blob.length - 1] ^= 1;
    await expect(decifrar(chave, blob)).rejects.toThrow();
  });
});
