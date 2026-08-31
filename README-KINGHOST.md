# Deploy na KingHost — PHAROS

## Visão geral

O PHAROS é uma aplicação **React/Vite 100% estática** (SPA).
Toda a lógica de backend roda no **Supabase** (banco, auth, storage, Edge Functions).
A KingHost hospeda apenas o frontend — não há Node.js, PHP ou servidor de aplicação necessário.

---

## Pré-requisitos no Supabase

Antes de fazer o deploy, garanta que no seu projeto Supabase:

- [ ] Migration SQL executada (`supabase/migrations/20240101000000_pharos_initial.sql`)
- [ ] Migration SQL executada (`supabase/migrations/20240102000000_company_enrollees.sql`)
- [ ] Bucket `documents` criado (privado)
- [ ] Bucket `course-images` criado (público)
- [ ] Edge Functions publicadas:
  - `admin-login`
  - `admin-list-users`
  - `admin-user-docs`
  - `admin-update-course`
- [ ] Secrets configurados nas Edge Functions:
  - `ADMIN_USER`
  - `ADMIN_PASSWORD`
  - `ADMIN_JWT_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`

---

## Passo 1 — Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (ou `.env.local`):

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...sua_anon_key...
```

**Onde encontrar:**
- `VITE_SUPABASE_URL` → Supabase Dashboard → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` → Supabase Dashboard → Settings → API → anon / public

> ⚠️ O prefixo `VITE_` é obrigatório. Sem ele, o Vite não expõe a variável ao browser.  
> ⚠️ Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em variáveis `VITE_`.

---

## Passo 2 — Gerar o build

```bash
npm install
npm run build
```

O build gera a pasta `dist/` com todos os arquivos estáticos prontos para upload.

---

## Passo 3 — Upload na KingHost

### Via Gerenciador de Arquivos (painel cPanel):

1. Acesse o **cPanel** da sua hospedagem KingHost
2. Abra o **Gerenciador de Arquivos**
3. Navegue até `public_html/` (ou o diretório do domínio/subdomínio)
4. **Delete** os arquivos antigos (se houver)
5. Faça upload de **todo o conteúdo** da pasta `dist/` para `public_html/`
   - Inclui: `index.html`, pasta `assets/`, `.htaccess`

### Via FTP/SFTP:

```bash
# Exemplo com rsync (substitua pelos dados da sua hospedagem)
rsync -avz --delete dist/ usuario@seudominio.com.br:/public_html/
```

### Verificar se o `.htaccess` foi enviado:

O arquivo `dist/.htaccess` **deve estar presente** em `public_html/`.
Ele é gerado automaticamente a partir de `public/.htaccess` durante o build.

---

## Passo 4 — Verificar o deploy

Abra o site e confirme:

- [ ] Página inicial carrega
- [ ] Cursos aparecem
- [ ] `https://seudominio.com.br/#/admin` abre o login do painel
- [ ] Login administrativo funciona (chama `admin-login` no Supabase)
- [ ] `https://seudominio.com.br/#/empresa/matriculas` funciona após login

---

## Estrutura do `dist/` após o build

```
dist/
├── index.html          ← Ponto de entrada da SPA
├── .htaccess           ← Regras Apache (SPA fallback + cache + segurança)
└── assets/
    ├── index-[hash].js   ← Bundle JavaScript (hash imutável)
    └── index-[hash].css  ← Estilos (hash imutável)
```

---

## Como funciona o roteamento na KingHost

O PHAROS usa **HashRouter** — todas as rotas incluem `#`:

| Rota | URL real |
|---|---|
| Página inicial | `https://dominio.com.br/` |
| Painel admin | `https://dominio.com.br/#/admin` |
| Empresa | `https://dominio.com.br/#/empresa/matriculas` |
| Curso | `https://dominio.com.br/#/curso/formacao-de-vigilante` |

O servidor Apache (KingHost) nunca vê o fragmento `#...` — serve sempre `index.html`.
O React lê o fragmento e renderiza a rota correta no browser.

O `.htaccess` garante que mesmo se alguém acessar `https://dominio.com.br/qualquer-coisa`,
o servidor devolva `index.html` em vez de um 404.

---

## Atualizar o site (redeploy)

1. Faça as alterações no código
2. Execute `npm run build`
3. Faça upload do conteúdo de `dist/` novamente para `public_html/`
   (substitua os arquivos existentes — os assets com hash novo serão servidos automaticamente)

---

## Variáveis de ambiente — diferença entre ambientes

| Arquivo | Usado em |
|---|---|
| `.env.local` | Desenvolvimento local (`npm run dev`) |
| `.env` | Build de produção (`npm run build`) |
| Painel da KingHost | Não aplicável (build é feito localmente antes do upload) |

> Como a KingHost hospeda apenas arquivos estáticos, as variáveis de ambiente
> são **embutidas no bundle** durante o `npm run build`.
> Não é possível alterar variáveis sem fazer um novo build e re-upload.

---

## Suporte e dúvidas

- **Frontend:** hospedado na KingHost (arquivos estáticos)
- **Backend / banco / auth / storage:** Supabase (`https://supabase.com`)
- **Edge Functions:** Supabase Edge Functions (Deno)
- **WhatsApp:** `(62) 99679-0101`
- **E-mail:** `Secretaria@pharosescoladevigilante.com.br`
