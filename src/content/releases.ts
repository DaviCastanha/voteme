/**
 * Notas de versão mostradas em "Novidades" (mais nova primeiro). Toda versão que muda algo que a
 * pessoa vê ganha uma entrada aqui, e o "version" do package.json tem que ser igual ao da primeira
 * (um teste confere). Escreva pra quem usa o app, não pra desenvolvedores.
 */
export interface Release {
  version: string;
  /** Data ISO (AAAA-MM-DD). */
  date: string;
  title: string;
  items: string[];
}

export const RELEASES: Release[] = [
  {
    version: "1.2.0",
    date: "2026-11-17",
    title: "Opções com imagem e um app mais vivo",
    items: [
      "Opções com imagem: ao criar a votação, toque no ícone de imagem ao lado de uma opção e cole o link de uma foto. A votação vira uma grade de cartões com as imagens.",
      "Só o link é guardado; cada aparelho carrega a imagem direto do site de origem. Se você colar o link da imagem no nome da opção, o app entende sozinho.",
      "Votar ficou mais gostoso: Sim e Não ganharam botões grandes com reação própria, e todo voto termina com uma confirmação animada.",
      "Resultados animados: as barras crescem, os números sobem e aparece um “+1” quando chega voto novo ao vivo.",
      "Quando a votação encerra, quem abre o resultado vê o vencedor sendo revelado (ou Aprovado, Rejeitado, Empate). Toque na tela pra pular.",
      "Se o seu celular ou computador estiver com “reduzir movimento” ligado, as animações ficam desligadas.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-11-17",
    title: "Excluir votações e Novidades",
    items: [
      "Agora dá pra excluir uma votação que você criou: pela lixeira em “Criadas neste aparelho”, na página inicial, ou pelo botão no fim do painel da votação.",
      "Ao excluir, os votos são apagados e o link para de funcionar para todo mundo. Não dá pra desfazer.",
      "Esta janela de Novidades: quando o VoteMe ganhar algo novo, ela aparece pra contar. Ela também fica no rodapé, junto com a versão do app.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-11-17",
    title: "Primeira versão",
    items: [
      "Crie uma votação em segundos: escolha única, múltipla escolha ou aprovar/rejeitar, com opção de abstenção.",
      "Mande o link pelo WhatsApp ou mostre o QR Code. Ninguém precisa de conta nem baixar app pra votar.",
      "Resultado ao vivo, atualizando sozinho na tela de todo mundo, ou escondido até o fim pra evitar efeito manada.",
      "Votação anônima ou com nome, prazo pra encerrar sozinha e opção de deixar a pessoa mudar o voto.",
      "Painel de quem criou: acompanhe os votos, veja quem participou, encerre quando quiser e, se der empate, abra uma rodada de desempate com um toque.",
    ],
  },
];

export const APP_VERSION = RELEASES[0].version;

/** Negativo quando a < b, positivo quando a > b (numérico, separado por pontos). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

/** Versões mais novas que `seen`, mais nova primeiro. */
export function releasesSince(seen: string | null): Release[] {
  if (!seen) return RELEASES;
  return RELEASES.filter((r) => compareVersions(r.version, seen) > 0);
}

export function formatReleaseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
