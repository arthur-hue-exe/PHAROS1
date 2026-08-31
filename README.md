# PHAROS — Escola de Vigilantes

Site institucional e sistema de matrículas da PHAROS, escola de formação e capacitação de profissionais de segurança privada em Goiás.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase (Auth, Database, Storage, Edge Functions) · Vercel

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação local](#2-instalação-local)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Configuração do Supabase](#4-configuração-do-supabase)
5. [Migration SQL](#5-migration-sql)
6. [Storage Buckets](#6-storage-buckets)
7. [RLS e Policies](#7-rls-e-policies)
8. [Edge Functions](#8-edge-functions)
9. [Deploy na Vercel](#9-deploy-na-vercel)
10. [Painel administrativo](#10-painel-administrativo)
11. [Controle de disponibilidade dos cursos](#11-controle-de-disponibilidade-dos-cursos)
12. [Imagens dos cursos](#12-imagens-dos-cursos)
13. [Arquitetura e fluxo de dados](#13-arquitetura-e-fluxo-de-dados)
14. [Checklist de configuração](#14-checklist-de-configuração)

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| Supabase CLI | 1.x (`npm i -g supabase`) |
| Conta Supabase | gratuita ou paga |
| Conta Vercel | gratuita ou paga |

---

## 2. Instalação local

```bash
# Clone o repositório
git clone https://github.com/arthur-hue-exe/PHAROS1.git
cd PHAROS1

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves reais (veja seção 3)

# Inicie o servidor de desenvolvimento
npm run dev
```

O site abre em `http://localhost:5173`.  
O painel administrativo: `http://localhost:5173/#/admin`

---

## 3. Variáveis de ambiente

### Por que o prefixo `VITE_` é obrigatório

O Vite **não expõe** variáveis ao bundle do browser a menos que comecem com `VITE_`. Usar `NEXT_PUBLIC_` ou qualquer outro prefixo resulta em `undefined` no runtime, causando o erro "não foi possível conectar ao servidor".

### Arquivo `.env.local` (desenvolvimento)

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXXXX
```

Onde encontrar os valores:
- **VITE_SUPABASE_URL** → Supabase Dashboard → Settings → API → **Project URL**
- **VITE_SUPABASE_ANON_KEY** → Supabase Dashboard → Settings → API → **anon / public**

> ⚠️ Nunca use a `service_role` key em variáveis `VITE_`. Ela ficaria exposta ao browser.

### Variáveis das Edge Functions (Secrets — nunca no frontend)

Estas variáveis ficam **exclusivamente** nos Secrets do Supabase:

```bash
supabase secrets set ADMIN_USER=admin
supabase secrets set ADMIN_PASSWORD=uma_senha_forte_unica
supabase secrets set ADMIN_JWT_SECRET=segredo_aleatorio_minimo_32_chars
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
supabase secrets set SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
```

---

## 4. Configuração do Supabase

### 4.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha nome, senha do banco e região (preferencialmente São Paulo)
3. Aguarde o provisionamento (~2 min)

### 4.2 Autenticação

1. Dashboard → **Authentication** → **Settings**
2. Em **Site URL**: `https://seu-dominio.vercel.app`
3. Em **Additional redirect URLs**: adicione `http://localhost:5173` para dev
4. Habilite **Email confirmations** (recomendado para produção)

---

## 5. Migration SQL

Execute o SQL completo da migration no **SQL Editor** do Supabase Dashboard:

```
Dashboard → SQL Editor → New query
```

Cole o conteúdo do arquivo:
```
supabase/migrations/20240101000000_pharos_initial.sql
```

A migration cria:

| Objeto | Descrição |
|---|---|
| `public.profiles` | Perfis dos usuários (id, name, email, phone, email_verified, documents_uploaded) |
| `public.documents` | Metadados dos documentos enviados (storage_path, file_name, mime_type, etc.) |
| `public.courses` | Catálogo de cursos com campo `is_available` |
| `handle_new_user()` | Trigger: cria profile automaticamente ao criar usuário no Auth |
| `mark_documents_uploaded()` | RPC: marca documentos como enviados após upload completo |
| RLS em todas as tabelas | Row Level Security habilitado |
| 7 policies | Select/insert granulares por tabela |
| 2 buckets | `documents` (privado) e `course-images` (público) |
| Seed de 7 cursos | Cursos iniciais com `is_available = true` |

### Alternativa via CLI

```bash
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase db push
```

---

## 6. Storage Buckets

A migration já cria os buckets via SQL. Se preferir criar manualmente:

### Bucket `documents` (privado — documentos dos clientes)

```
Dashboard → Storage → New bucket
Nome: documents
Public: OFF
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
```

### Bucket `course-images` (público — imagens dos cursos)

```
Dashboard → Storage → New bucket
Nome: course-images
Public: ON
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
```

> ⚠️ Os dois buckets são **separados intencionalmente**. Documentos de clientes nunca compartilham permissões com imagens públicas de cursos.

---

## 7. RLS e Policies

A migration configura automaticamente todas as policies. Resumo:

### Tabela `profiles`

| Policy | Quem | Operação |
|---|---|---|
| `profiles: usuario le proprio perfil` | `auth.uid() = id` | SELECT |
| `profiles: usuario atualiza proprio perfil` | `auth.uid() = id` | UPDATE |

### Tabela `documents`

| Policy | Quem | Operação |
|---|---|---|
| `documents: usuario le proprios docs` | `auth.uid() = user_id` | SELECT |
| `documents: usuario insere proprios docs` | `auth.uid() = user_id` | INSERT |

### Tabela `courses`

| Policy | Quem | Operação |
|---|---|---|
| `courses: leitura publica` | qualquer visitante (anon) | SELECT |

> Writes na tabela `courses` só são possíveis via `service_role_key` dentro das Edge Functions. Usuários comuns não conseguem alterar `is_available` diretamente.

### Bucket `documents`

| Policy | Quem | Operação |
|---|---|---|
| Upload na própria pasta | `authenticated`, pasta = `auth.uid()` | INSERT |
| Leitura dos próprios arquivos | `authenticated`, pasta = `auth.uid()` | SELECT |
| Delete dos próprios arquivos | `authenticated`, pasta = `auth.uid()` | DELETE |

---

## 8. Edge Functions

### Funções disponíveis

| Função | Método | Descrição |
|---|---|---|
| `admin-login` | POST | Autentica admin, retorna JWT HS256 (8h) |
| `admin-list-users` | GET | Lista todos os perfis (requer JWT admin) |
| `admin-user-docs` | GET `?userId=` | Lista docs + gera signed URLs de download (requer JWT admin) |
| `admin-update-course` | PATCH | Altera `is_available` de um curso (requer JWT admin) |

### Deploy das funções

```bash
# Autentique com o Supabase CLI
supabase login

# Vincule ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Configure os Secrets ANTES de publicar
supabase secrets set ADMIN_USER=admin
supabase secrets set ADMIN_PASSWORD=SUA_SENHA_FORTE
supabase secrets set ADMIN_JWT_SECRET=SEU_SEGREDO_LONGO_ALEATORIO
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
supabase secrets set SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co

# Publique todas as funções de uma vez
supabase functions deploy admin-login
supabase functions deploy admin-list-users
supabase functions deploy admin-user-docs
supabase functions deploy admin-update-course
```

### Verificar Secrets configurados

```bash
supabase secrets list
```

### Testar localmente

```bash
supabase start
supabase functions serve admin-login --env-file .env.local
```

---

## 9. Deploy na Vercel

### 9.1 Conectar repositório

1. [vercel.com](https://vercel.com) → **New Project** → importe o repositório GitHub
2. Framework preset: **Vite** (detectado automaticamente)
3. Build command: `npm run build`
4. Output directory: `dist`

### 9.2 Variáveis de ambiente na Vercel

```
Settings → Environment Variables
```

Adicione **exatamente** estas duas variáveis:

| Nome | Valor | Ambientes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://SEU_PROJECT_ID.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_XXX...` | Production, Preview, Development |

> ⚠️ Sem essas variáveis o build compila mas o site não consegue conectar ao Supabase.

### 9.3 SPA Routing

O arquivo `vercel.json` já está configurado com o rewrite necessário para que rotas como `/#/admin` funcionem após refresh da página:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

O projeto usa **HashRouter** (rotas com `#`), então o servidor sempre serve `index.html` e o React resolve a rota no browser.

### 9.4 Realizar o deploy

```bash
# Via CLI
vercel --prod

# Ou simplesmente faça push para a branch main/master
git push origin main
```

---

## 10. Painel administrativo

### Acesso

```
https://seu-dominio.vercel.app/#/admin
```

Ou localmente: `http://localhost:5173/#/admin`

### Credenciais

As credenciais são definidas nos **Secrets das Edge Functions**:
- `ADMIN_USER` → usuário (ex: `admin`)
- `ADMIN_PASSWORD` → senha forte (defina você mesmo)

> Não há senha padrão. O sistema não funciona sem esses Secrets configurados.

### Funcionalidades

**Aba Clientes:**
- Lista todos os usuários cadastrados
- Busca por nome, e-mail ou telefone
- Status: Não verificado / Pendente (email ok, docs aguardando) / Completo
- Clique em um cliente para ver detalhes
- Botão **Baixar** em cada documento gera uma URL assinada temporária (1h) e abre o download

**Aba Cursos:**
- Lista todos os cursos com status atual
- Resumo: total / disponíveis / indisponíveis
- Botão **Desativar** → marca `is_available = false` no banco
- Botão **Ativar** → marca `is_available = true` no banco
- A alteração reflete imediatamente no site público

### Download de documentos

Os documentos ficam no bucket **privado** `documents`. O administrador não acessa URLs públicas — o sistema gera uma **URL assinada temporária** (válida por 1 hora) diretamente no servidor via Edge Function. O arquivo é baixado com o nome original do usuário.

---

## 11. Controle de disponibilidade dos cursos

### Como funciona

```
Admin clica "Desativar" no painel
    ↓
Frontend PATCH → Edge Function admin-update-course
    ↓
Edge Function verifica JWT admin
    ↓
Atualiza courses.is_available = false (via service_role)
    ↓
Frontend público busca cursos do Supabase em background
    ↓
is_available = false → badge INDISPONÍVEL + botão desabilitado
```

### Onde está o controle

| Camada | Local | Descrição |
|---|---|---|
| Banco | `public.courses.is_available` | Fonte de verdade |
| Migration | `supabase/migrations/...sql` | Seed inicial (todos `true`) |
| Edge Function | `supabase/functions/admin-update-course/` | Escrita segura (service_role) |
| Hook | `src/hooks/useCourses.ts` | Leitura e merge com dados estáticos |
| Card | `src/components/CourseCard.tsx` | Badge + botão desabilitado |
| Detalhes | `src/components/CourseDetails.tsx` | Banner + botão bloqueado |
| Painel | `src/components/AdminPanel.tsx` | Toggle ativar/desativar |

### Alterar disponibilidade sem código

1. Acesse `/#/admin`
2. Faça login
3. Clique na aba **Cursos**
4. Clique em **Desativar** ou **Ativar** no curso desejado
5. A alteração é salva imediatamente no banco e reflete no site

---

## 12. Imagens dos cursos

### Localização atual

As imagens dos cursos são **URLs externas do Pexels** — não há arquivos locais de imagem de cursos. Estão centralizadas em:

```
src/data/content.ts → courses[] → campo image
```

| Curso | URL da imagem |
|---|---|
| Atualização em Transporte de Valores | pexels.com/photos/28288101 |
| Aperfeiçoamento em Segurança Pessoal Privada | pexels.com/photos/8425354 |
| Atualização em Segurança Pessoal Privada | pexels.com/photos/8425052 |
| Supervisor Operacional e Liderança | pexels.com/photos/11783119 |
| Manutenção e Manuseio de Armas | pexels.com/photos/5202438 |
| Monitoramento CFTV | pexels.com/photos/30692441 |
| Segurança Bancária | pexels.com/photos/13674041 |

### Como substituir por imagens reais

**Opção 1 — Arquivo local (mais simples):**

1. Coloque a imagem em `src/assets/courses/nome-do-curso.webp`
2. Em `src/data/content.ts`, no objeto do curso, altere:
   ```ts
   image: '/src/assets/courses/nome-do-curso.webp',
   ```
3. Faça um novo deploy

**Opção 2 — Upload no Supabase Storage (sem deploy):**

1. Faça upload em Dashboard → Storage → `course-images`
2. Copie a URL pública do arquivo
3. Atualize o campo `image_url` na tabela `courses` diretamente no banco:
   ```sql
   update public.courses
   set image_url = 'https://SEU_PROJECT_ID.supabase.co/storage/v1/object/public/course-images/nome.webp'
   where slug = 'slug-do-curso';
   ```
4. Adapte o hook `useCourses.ts` para também retornar e mesclar `image_url` do banco

**Opção 3 — Pelo painel admin (futura extensão):**

A estrutura já está preparada. A tabela `courses` possui o campo `image_url`. Para ativar o upload pelo painel, adicione na aba Cursos do `AdminPanel.tsx` um input de arquivo que:
1. Faz upload para o bucket `course-images`
2. Atualiza `image_url` na tabela via Edge Function

### Hero section

A imagem do hero (`Hero.tsx`) é uma URL do Pexels hardcoded:
```
src/components/sections/Hero.tsx → linha com pexels.com/photos/4653119
```

Para substituir, edite diretamente esse arquivo.

---

## 13. Arquitetura e fluxo de dados

### Fluxo do cliente

```
Cliente acessa o site
    ↓
Vê os cursos (dados estáticos + is_available do Supabase)
    ↓
Clica em "Matricule-se"
    ↓
EnrollModal → RegisterForm → Supabase Auth (signUp)
    ↓
Trigger: handle_new_user() cria registro em profiles
    ↓
E-mail de confirmação enviado pelo Supabase
    ↓
Cliente confirma e-mail → email_verified = true no profile
    ↓
UploadDocs → upload para bucket "documents" (privado)
    ↓
Metadados salvos na tabela documents
    ↓
RPC mark_documents_uploaded() → documents_uploaded = true
    ↓
DocsSent (confirmação)
```

### Fluxo do administrador

```
Admin acessa /#/admin
    ↓
AdminLogin → POST admin-login → JWT retornado
    ↓
AdminPanel (aba Clientes)
    ↓
GET admin-list-users (service_role) → lista de profiles
    ↓
Clica em cliente
    ↓
GET admin-user-docs?userId= → lista + signed URLs (1h)
    ↓
Clica "Baixar" → window.open(signedUrl) → download no computador
```

### Estrutura de arquivos no Storage

```
bucket: documents (privado)
└── {user_id}/
    ├── cnh_1234567890.pdf
    ├── rg_1234567891.jpg
    ├── titulo_eleitor_1234567892.png
    └── comprovante_residencia_1234567893.pdf

bucket: course-images (público)
└── curso-formacao-x.webp
```

---

## 14. Checklist de configuração

### Supabase

- [ ] Projeto criado
- [ ] Migration SQL executada (`supabase/migrations/20240101000000_pharos_initial.sql`)
- [ ] Tabela `profiles` criada com trigger `handle_new_user`
- [ ] Tabela `documents` criada
- [ ] Tabela `courses` criada com seed dos 7 cursos
- [ ] RLS habilitado nas 3 tabelas
- [ ] 7 policies criadas conforme migration
- [ ] Bucket `documents` criado (privado, 5 MB)
- [ ] Bucket `course-images` criado (público, 10 MB)
- [ ] Policies de Storage criadas para bucket `documents`
- [ ] Auth → Site URL configurada para domínio da Vercel
- [ ] Auth → Additional redirect URLs com `http://localhost:5173`
- [ ] Secrets configurados:
  - [ ] `ADMIN_USER`
  - [ ] `ADMIN_PASSWORD`
  - [ ] `ADMIN_JWT_SECRET`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_URL`
- [ ] Edge Functions publicadas:
  - [ ] `admin-login`
  - [ ] `admin-list-users`
  - [ ] `admin-user-docs`
  - [ ] `admin-update-course`

### Vercel

- [ ] Projeto importado do GitHub
- [ ] Framework preset: Vite
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `vercel.json` presente na raiz (rewrite SPA)
- [ ] Deploy realizado com sucesso
- [ ] Rota `/#/admin` acessível após refresh da página
- [ ] Build sem erros (`npm run build`)

### Verificação funcional

- [ ] Site carrega sem erro de conexão
- [ ] Cadastro de usuário funciona
- [ ] E-mail de confirmação é recebido
- [ ] Upload de documentos funciona
- [ ] Login no painel admin funciona
- [ ] Lista de clientes carrega
- [ ] Download de documento funciona
- [ ] Ativar/desativar curso funciona e reflete no site

---

## Informações de contato

Altere em `src/config/site.ts`:

```ts
export const WHATSAPP_NUMBER = '5562996790101';   // +55 62 99679-0101
export const SITE_ADDRESS = 'R. Dez - Parque Santa Cecilia, ...';
export const SITE_EMAIL = 'sac@...';
```

Qualquer componente que precise dessas informações importa de `site.ts` — uma única alteração reflete em todo o sistema.

---

*PHAROS — Escola de Vigilantes. Goiás, Brasil.*
