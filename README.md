# VoteMe

Votação pra qualquer decisão em grupo: crie em segundos, mande o link, ninguém precisa de conta.

**Stack:** Next.js 16 (App Router, Cache Components, Server Actions) + Supabase (Postgres + Realtime) + Tailwind v4.

## Rodar localmente

> **Primeira vez?** Siga o passo a passo detalhado em [SETUP.md](SETUP.md) (Supabase → local → GitHub → Vercel).

```bash
nvm use            # Node 22 (ver .nvmrc)
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase
npm run dev
```

### Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano free serve).
2. **SQL Editor** → rode, em ordem, cada arquivo de [`supabase/migrations/`](supabase/migrations/).
3. **Project Settings → API Keys** → copie a URL, a *publishable key* e a *secret key* pro `.env.local`.
4. Realtime: nada a fazer. Usamos *broadcast* em canais públicos, que já vem habilitado.

## Deploy na Vercel

1. Suba o repositório pro GitHub e importe na Vercel.
2. Em **Settings → Environment Variables**, crie as mesmas 3 variáveis do `.env.example`.
3. Deploy. Pronto.

## Como funciona

| Conceito | Implementação |
|---|---|
| Votar sem conta | Cookie `httpOnly` aleatório por navegador → `sha256(poll_id:cookie)` em `ballots.voter_hash`, com `unique(poll_id, voter_hash)` |
| Criar sem conta | Link de admin secreto (`/p/<slug>/admin?k=<token>`); só o hash fica no banco. O link também fica salvo no `localStorage` do criador |
| Segurança | RLS ligado **sem policies**: o browser não lê nem escreve nenhuma tabela. Tudo passa por Server Actions com a secret key |
| Integridade | `create_poll` e `cast_vote` são funções Postgres transacionais que validam regras (prazo, nº de escolhas, abstenção, nome) |
| Ao vivo | O servidor manda um *broadcast* sem dados no canal `poll:<id>`; o cliente faz `router.refresh()`. Resultado oculto continua oculto |
| Apuração | `src/lib/polls/tally.ts`: métodos plugáveis (hoje só `plurality`). Abstenção conta participação mas não concorre |
| Preview no WhatsApp | `generateMetadata` por votação (título vira o card do link; a 1ª imagem de opção vira a foto) |
| Opções com imagem | Só o link (https) fica em `poll_options.image_url`; cada aparelho carrega a imagem |
| Animações | `motion` + keyframes em `globals.css`; tudo respeita `prefers-reduced-motion` |
| Novidades | `src/content/releases.ts` (a versão do `package.json` tem que bater, há teste) |

### Estrutura

```
supabase/migrations/      schema + funções SQL
src/lib/polls/            domínio: tipos, apuração, queries, server actions
src/lib/supabase/         clientes (server = secret key, browser = só realtime)
src/components/           UI (formulários, resultados, compartilhar, admin)
src/app/                  rotas: /, /nova, /p/[slug], /p/[slug]/admin
```

## Roadmap

- **P1:** contas (Supabase Auth + Google) pra levar as votações entre aparelhos · grupos · ranking · disponibilidade de datas · modo telão (QR + resultado em tela cheia) · imagem OG dinâmica · upload de imagem (hoje é só link)
- **P2:** convites individuais (1 link = 1 voto) · voto ponderado (`ballots.weight` já existe) · quórum · auditoria/ata · modo formal (assembleias, Lei 14.309/2022)
- **Pendências técnicas:** rate limit no voto/criação (ex.: Upstash) · testes de componentes/E2E · região da Vercel perto do Supabase (`gru1`)
