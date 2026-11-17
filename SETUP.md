# Guia de setup do VoteMe

Guia pra colocar o VoteMe no ar do zero, sem precisar conhecer Supabase nem Vercel.

| Etapa | O que é | Tempo |
|---|---|---|
| [1. Supabase](#1-criar-o-projeto-no-supabase) | Criar o banco de dados | ~10 min |
| [2. Tabelas](#2-criar-as-tabelas) | Rodar um arquivo SQL | ~2 min |
| [3. Chaves](#3-copiar-as-chaves) | Copiar 3 valores | ~3 min |
| [4. Rodar no PC](#4-rodar-no-seu-computador) | Testar localmente | ~10 min |
| [5. GitHub](#5-subir-o-código-pro-github) | Guardar o código online | ~5 min |
| [6. Vercel](#6-publicar-na-vercel) | Colocar o site no ar | ~5 min |
| [7. Teste final](#7-teste-final-com-a-galera) | Votar de verdade | — |

Se algo der errado em qualquer etapa, veja [Problemas comuns](#problemas-comuns) no fim.

---

## Antes de começar

Você vai precisar de:

- [ ] Uma conta no **GitHub** (se não tiver, crie em [github.com/signup](https://github.com/signup), é grátis). Ela serve pra entrar no Supabase e na Vercel também, então é **um login só pra tudo**.
- [ ] O **VS Code** aberto na pasta `C:\Dev\voteme`.
- [ ] Um **bloco de notas** aberto pra anotar as coisas que vão aparecendo (senha do banco, chaves).

### Entendendo as peças (30 segundos)

```
  Celular / navegador
         │  abre o link
         ▼
  ┌──────────────┐        ┌──────────────────┐
  │   Vercel     │ ─────▶ │    Supabase      │
  │ (o site, o   │        │ (banco de dados: │
  │  código Next)│ ◀───── │  votações, votos)│
  └──────────────┘        └──────────────────┘
```

- **Supabase** é onde ficam os dados (votações, opções, votos). Também avisa as telas quando chega voto novo (o "ao vivo").
- **Vercel** é onde o site roda e fica acessível pra qualquer pessoa na internet.
- **GitHub** guarda o código. A Vercel pega o código de lá automaticamente.

---

## 1. Criar o projeto no Supabase

1. Acesse **[supabase.com](https://supabase.com)** e clique em **Start your project** (ou **Sign in**).
2. Escolha **Continue with GitHub** e autorize.
3. Se ele pedir pra criar uma **organização**:
   - **Name:** qualquer coisa, ex.: `Davi`
   - **Type:** `Personal`
   - **Plan:** `Free - $0/month`
   - Clique em **Create organization**.
4. Agora crie o projeto (**New project**):
   - **Project name:** `voteme`
   - **Database Password:** clique em **Generate a password** e **copie pro seu bloco de notas**. Não vamos usar agora, mas é a senha-mestra do banco e não dá pra ver de novo depois (só redefinir).
   - **Region:** escolha **South America (São Paulo)**, que é mais perto, então fica mais rápido.
   - Se aparecerem **opções de segurança** (algo como *"Data API"*, *"Expose tables automatically"*, *"Enable RLS automatically"*): **deixe tudo como veio por padrão**. A única coisa importante é que a **Data API** fique **ligada** e usando o schema **`public`** (é o padrão).
5. Clique em **Create new project**.
6. Espere 1 a 2 minutos enquanto ele prepara o banco (vai aparecer algo como *"Setting up project"*).

✅ **Pronto quando:** você vê o painel do projeto, com um menu lateral à esquerda (Table Editor, SQL Editor, etc.).

---

## 2. Criar as tabelas

O arquivo SQL já está pronto no projeto, é só colar e rodar.

1. No VS Code, abra o arquivo **`supabase/migrations/20261117000000_init.sql`**.
2. Selecione tudo (**Ctrl+A**) e copie (**Ctrl+C**).
3. No Supabase, no menu da esquerda, clique em **SQL Editor** (ícone de `>_`).
4. Clique em **New query** (ou no **+**).
5. Cole o conteúdo (**Ctrl+V**).
6. Clique em **Run** (ou **Ctrl+Enter**).

✅ **Pronto quando:** aparece embaixo **"Success. No rows returned"**.

**Confira:** no menu da esquerda, abra **Table Editor**. Devem aparecer 4 tabelas:

- `polls`: as votações
- `poll_options`: as opções de cada votação
- `ballots`: as cédulas (um por pessoa por votação)
- `ballot_choices`: o que cada cédula marcou

> ⚠️ **Vai aparecer um aviso de segurança e está tudo certo.** O Supabase pode mostrar alertas (no **Security Advisor** ou ao lado das tabelas) do tipo *"RLS enabled, no policies"*. **Isso é proposital:** significa que ninguém de fora consegue ler ou mexer nas tabelas direto. Só o nosso servidor acessa, usando a chave secreta. **Não crie policies.**

> 💡 Se você rodar o SQL duas vezes sem querer, vai dar erro *"relation already exists"*. Não tem problema, as tabelas já foram criadas na primeira vez.

### 2.1. Atualizações do banco (migrations)

Algumas versões do app trazem um SQL novo na pasta `supabase/migrations/`. Rode **cada arquivo uma vez**, **em ordem de nome**, do mesmo jeito (SQL Editor → New query → colar → Run):

| Arquivo | Versão | O que faz |
|---|---|---|
| `20261117000000_init.sql` | 1.0.0 | Cria as tabelas (é o da etapa 2) |
| `20261117010000_option_images.sql` | 1.2.0 | Permite opções com imagem |

Se você esquecer uma migration, o app continua funcionando, só o recurso novo fica indisponível (e ele avisa qual SQL falta).

---

## 3. Copiar as chaves

Precisamos de **3 valores**. Anote no bloco de notas:

### 3.1. URL do projeto

1. No Supabase, clique no botão **Connect** no topo da página **ou** vá em **Project Settings** (ícone de engrenagem, embaixo à esquerda) → **Data API**.
2. Copie a **Project URL**. Ela tem a cara `https://abcdefghijklmnop.supabase.co`, terminando em `.supabase.co`.
   Se o que você copiou termina em `/rest/v1/`, apague esse final. (O app até corrige sozinho, mas fica mais limpo.)

### 3.2. As duas chaves (API Keys)

1. Vá em **Project Settings** → **API Keys**.
2. Se aparecerem abas, use a de chaves novas (**"Publishable and secret API keys"**), não a de *"Legacy"*.
3. Copie:
   - **Publishable key**: começa com `sb_publishable_...`. É pública, pode aparecer no navegador.
   - **Secret key**: começa com `sb_secret_...`. Talvez você precise clicar no ícone de olho 👁 ou em **Reveal** pra ver.

> 🔒 **A secret key é a chave-mestra do banco.** Quem tiver ela pode ler e apagar tudo. Nunca mande no WhatsApp, nunca cole em print, nunca coloque no GitHub. Ela só vai em dois lugares: no arquivo `.env.local` do seu PC e nas configurações da Vercel.

> 💡 Se só existir a aba *"Legacy"* (chaves `anon` e `service_role` que começam com `eyJ...`), também funciona: use a **anon** no lugar da publishable e a **service_role** no lugar da secret.

---

## 4. Rodar no seu computador

### 4.1. Abrir o terminal

No VS Code: menu **Terminal → New Terminal** (ou **Ctrl+'**). Vai abrir um **PowerShell** já na pasta `C:\Dev\voteme`.

Confira a versão do Node:

```powershell
node -v
```

Tem que aparecer **v20 ou maior** (no seu PC aparece `v22.14.0` 👍).

> Se abrir o **Git Bash** em vez do PowerShell, o Node lá é o 16. Nesse caso rode `nvm use` antes (ele lê o arquivo `.nvmrc` e troca pro 22). Ou simplesmente troque pro PowerShell no **⌄** ao lado do **+** do terminal.

### 4.2. Criar o arquivo de configuração

```powershell
copy .env.example .env.local
```

Abra o **`.env.local`** no VS Code e preencha com o que você anotou:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxx
```

Cuidados:
- **Sem espaços** em volta do `=`.
- **Sem aspas.**
- A URL **sem barra no final** (`.supabase.co` e não `.supabase.co/`).
- Salve o arquivo (**Ctrl+S**).

> O `.env.local` **não vai pro GitHub** (o `.gitignore` já bloqueia). Por isso as chaves ficam seguras.

### 4.3. Ligar o servidor

```powershell
npm install
npm run dev
```

O `npm install` só precisa ser feito uma vez (ou quando mudarem as dependências). O `npm run dev` vai mostrar algo como:

```
▲ Next.js 16.4.6
- Local:    http://localhost:3000
- Network:  http://192.168.0.15:3000
✓ Ready
```

Deixe esse terminal aberto. **Pra desligar:** clique nele e aperte **Ctrl+C**.

### 4.4. Testar o fluxo completo

Abra **http://localhost:3000** no navegador e siga este roteiro:

- [ ] **Criar:** clique em **Criar votação**, escreva uma pergunta ("Onde vamos jantar?"), coloque 3 opções e clique em **Criar e pegar o link**.
  → Você cai no **painel do criador** (com link, botão de WhatsApp e QR Code).
- [ ] **Votar como outra pessoa:** copie o **Link pra votar** e abra numa **janela anônima** (**Ctrl+Shift+N** no Chrome/Edge). Vote.
  → Na janela anônima aparece *"✓ Seu voto foi registrado"*.
- [ ] **Ao vivo:** olhe a janela do painel **sem recarregar**. O resultado deve atualizar sozinho em 1 ou 2 segundos.
- [ ] **Voto duplicado:** na janela anônima, recarregue a página. O formulário não deve aparecer de novo.
- [ ] **Encerrar:** no painel, clique em **Encerrar votação agora**. Na janela anônima aparece **"Resultado final"**.
- [ ] **Desempate:** crie outra votação, vote em opções diferentes em duas janelas anônimas diferentes (feche e abra uma nova janela anônima entre os votos), encerre, e o painel deve oferecer **Criar rodada de desempate**.

**Conferir no banco:** no Supabase, **Table Editor → `polls`** deve mostrar as votações que você criou, e **`ballots`** os votos.

### 4.5. (Opcional) Testar pelo celular

Com o `npm run dev` rodando e o celular **na mesma Wi-Fi** do PC:

1. No celular, abra o endereço **Network** que apareceu no terminal (ex.: `http://192.168.0.15:3000`).
2. Se o **Firewall do Windows** perguntar se o Node.js pode acessar a rede, marque **Redes privadas** e clique em **Permitir**.

> Se não abrir no celular, pode pular. Depois do deploy na Vercel (etapa 6) você testa pelo celular de qualquer jeito.

---

## 5. Subir o código pro GitHub

### 5.1. Criar o repositório (no site)

1. Acesse **[github.com/new](https://github.com/new)**.
2. **Repository name:** `voteme`
3. Marque **Private** (o código fica só pra você; a Vercel funciona igual).
4. **Não marque** nada em *"Add a README"*, *".gitignore"* ou *"license"*, porque o projeto já tem.
5. Clique em **Create repository**.
6. Na página que abrir, copie a URL que termina em `.git`, ex.: `https://github.com/SEU-USUARIO/voteme.git`.

### 5.2. Enviar o código (no terminal do VS Code)

Se o `npm run dev` estiver rodando, abra **outro terminal** (clique no **+** do painel de terminal). Depois rode, **um comando de cada vez**:

```powershell
git status
```

👀 **Confira:** o `.env.local` **não pode** aparecer na lista. Se aparecer, pare e veja [Problemas comuns](#problemas-comuns).

```powershell
git add -A
git commit -m "MVP do VoteMe: criar, votar, resultado ao vivo, encerrar e desempatar"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/voteme.git
git push -u origin main
```

(Troque `SEU-USUARIO` pelo seu usuário do GitHub, ou cole a URL que você copiou.)

No `git push` deve abrir uma **janela do navegador pedindo pra entrar no GitHub**. Autorize. Isso é só na primeira vez.

✅ **Pronto quando:** você recarrega a página do repositório no GitHub e vê os arquivos (`src`, `supabase`, `README.md`…).

---

## 6. Publicar na Vercel

1. Acesse **[vercel.com/signup](https://vercel.com/signup)**.
2. Escolha o plano **Hobby** (grátis) e **Continue with GitHub**.
3. No painel, clique em **Add New… → Project**.
4. Na lista **Import Git Repository**, encontre `voteme` e clique em **Import**.
   - **Não aparece?** Clique em **Adjust GitHub App Permissions** (ou *"Configure GitHub App"*), dê acesso ao repositório `voteme` e volte.
5. Na tela **Configure Project**:
   - **Framework Preset:** deve detectar sozinho **Next.js**. Não mexa.
   - **Root Directory / Build settings:** deixe como está.
   - Abra **Environment Variables** e adicione as 3 variáveis, **com os mesmos nomes e valores do seu `.env.local`**:

     | Key | Value |
     |---|---|
     | `NEXT_PUBLIC_SUPABASE_URL` | `https://....supabase.co` |
     | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
     | `SUPABASE_SECRET_KEY` | `sb_secret_...` |

     > 💡 Atalho: copie **o conteúdo inteiro** do `.env.local` e cole no primeiro campo **Key**. A Vercel separa as 3 variáveis sozinha.
6. Clique em **Deploy** e espere 1 a 2 minutos.

✅ **Pronto quando:** aparece a tela de parabéns com uma prévia do site. Clique em **Continue to Dashboard** e depois no domínio, algo como **`voteme-xxxx.vercel.app`**. Esse é o seu site no ar.

### Daqui pra frente

Toda vez que você (ou eu) fizer mudanças e der `git push`, a **Vercel publica sozinha** a versão nova em ~1 minuto. Não precisa repetir esta etapa.

> ⚠️ **Mudou alguma variável de ambiente na Vercel?** Ela só vale depois de um novo deploy: **Deployments → ⋯ no último → Redeploy**.

---

## 7. Teste final com a galera

1. No celular, abra `https://voteme-xxxx.vercel.app` e crie uma votação de verdade.
2. No painel, toque em **WhatsApp** e mande pro grupo.
3. Veja se o **preview do link** mostra a pergunta (às vezes o WhatsApp demora alguns segundos pra gerar).
4. Acompanhe os votos chegando ao vivo. 🎉

> **Guarde o link do painel.** Como ainda não tem login, quem tem o link de admin controla a votação. Ele fica salvo no navegador onde você criou (aparece na home em *"Criadas neste aparelho"*), mas se trocar de celular ou limpar os dados do navegador, só com o link. Por isso o painel mostra o **"Seu link de administrador"** pra você copiar.

---

## Problemas comuns

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| Página de votação mostra erro / no terminal aparece **"Supabase não configurado"** | `.env.local` faltando ou com nome errado | Confira se o arquivo se chama exatamente `.env.local` (não `.env.local.txt`), está na raiz do projeto e foi salvo. **Pare e rode de novo** o `npm run dev`, porque ele só lê o arquivo ao iniciar. |
| Erro com **`PGRST125` / "Invalid path specified in request URL"** | URL copiada com `/rest/v1/` no final | Deixe só `https://xxxx.supabase.co` no `NEXT_PUBLIC_SUPABASE_URL` e reinicie o `npm run dev`. |
| Erro com **"Invalid API key"** ou **401** | Chave copiada errada (pela metade, com espaço) | Copie de novo do Supabase, use o botão de copiar em vez de selecionar. |
| Ao criar com imagem: **"Imagens ainda não estão ativadas no banco"** | Falta a migration `20261117010000_option_images.sql` | Rode ela no SQL Editor (etapa 2.1). |
| Erro com **"Could not find the function public.create_poll"** ou **"relation ... does not exist"** | O SQL da etapa 2 não rodou, ou rodou em outro projeto | Volte na etapa 2. Confira no Table Editor se as 4 tabelas existem. |
| Erro com **"permission denied"** | SQL rodado pela metade, ou está usando a publishable key no lugar da secret | Confira se `SUPABASE_SECRET_KEY` tem a chave **secret**. Se precisar, rode o SQL de novo num projeto novo. |
| Voto funciona, mas **não atualiza ao vivo** (só ao recarregar) | Realtime com acesso público desligado | Supabase → **Realtime → Settings** → deixe **"Allow public access"** ligado. (A página também se atualiza sozinha quando você volta pra aba.) |
| Funciona no PC mas **não na Vercel** | Variáveis não cadastradas na Vercel, ou cadastradas depois do deploy | Vercel → projeto → **Settings → Environment Variables**: confira as 3. Depois **Deployments → ⋯ → Redeploy**. |
| `git status` mostra o **`.env.local`** | Arquivo com nome diferente (ex.: `env.local` sem o ponto) | Renomeie pra `.env.local` exatamente. **Não faça commit** enquanto ele aparecer. |
| `git push` dá **"remote origin already exists"** | O `git remote add` já foi rodado antes | Rode `git remote set-url origin https://github.com/SEU-USUARIO/voteme.git` e tente o push de novo. |
| `npm run dev` diz que a **porta 3000 está em uso** | Outro servidor ainda ligado | Feche o outro terminal, ou use a porta que ele sugerir (ex.: 3001). |
| Depois de dias parado, o site dá erro de conexão com o banco | **O Supabase grátis pausa o projeto após 7 dias sem uso** | Entre no painel do Supabase e clique em **Restore project**. Volta em 1 ou 2 minutos, sem perder dados. |

Travou em algo que não está aqui? Me manda o print ou o texto do erro (**sem as chaves!**) que eu resolvo.

---

## Bom saber

- **Custos:** Supabase Free e Vercel Hobby são grátis e dão de sobra pro começo. Atenção: o plano Hobby da Vercel é pra **uso não comercial**. Se o VoteMe virar produto pago, precisa passar pro plano Pro.
- **Onde ver os dados:** Supabase → **Table Editor**. Dá pra ver, e até editar na mão, tudo o que foi votado.
- **Onde ver erros do site no ar:** Vercel → projeto → **Logs**.
- **Vazou a secret key?** Supabase → **Project Settings → API Keys** → gere uma nova e apague a antiga. Depois atualize o `.env.local` e a Vercel (com Redeploy).
