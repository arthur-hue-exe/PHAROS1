# PHAROS — Escola de Vigilantes

Site institucional com fluxo completo de matrícula, verificação de identidade, upload de documentos e painel administrativo.

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend/Auth/DB:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Segurança (GSD):** Todas as chaves sensíveis em `.env`. Nenhuma credencial admin no frontend. Storage privado com RLS. Edge Functions como gateway.

---

## Setup rápido

### 1. Clone e instale dependências

```bash
cd PHAROS-main
npm install
```

### 2. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo:
   ```
   project/supabase/migrations/20260828114453_create_profiles_and_documents.sql
   ```
3. Copie a **URL** e a **anon key** do projeto (Settings → API)

### 3. Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Preencha:
```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> As demais variáveis (`ADMIN_USER`, `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`) são usadas **somente pelas Edge Functions** e devem ser configuradas nos Secrets do Supabase.

### 4. Configure os Secrets das Edge Functions

No painel Supabase → **Settings → Edge Functions → Secrets**, adicione:

| Variável | Valor |
|---|---|
| `ADMIN_USER` | `admin` |
| `ADMIN_PASSWORD` | `pharosadmin` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (Settings → API) |
| `SUPABASE_URL` | URL do projeto |
| `RESEND_API_KEY` | *(opcional)* Sua chave Resend para envio de e-mail |
| `EMAIL_FROM` | *(opcional)* `noreply@seudominio.com.br` |
| `ENVIRONMENT` | `development` em dev, vazio em prod |

### 5. Deploy das Edge Functions

```bash
npx supabase functions deploy admin-login --project-ref SEU_PROJECT_REF
npx supabase functions deploy admin-list-users --project-ref SEU_PROJECT_REF
npx supabase functions deploy admin-user-docs --project-ref SEU_PROJECT_REF
npx supabase functions deploy generate-otp --project-ref SEU_PROJECT_REF
npx supabase functions deploy verify-otp --project-ref SEU_PROJECT_REF
```

### 6. Rode o projeto

```bash
npm run dev
```

---

## Fluxo de Matrícula

```
Curso → [Matricule-se já] → Modal de confirmação
  ↓
Não tem conta → Cadastro (email + senha + telefone)
  ↓
Verificação de e-mail (código OTP 6 dígitos)
  ↓ (modo dev: código aparece no console)
Upload de documentos (CNH, RG, Título, Comprovante)
  ↓
"Documentos enviados — entraremos em contato em 24h"
```

## Painel Admin

Acesse: `/#/admin`

- Usuário: `admin`
- Senha: `pharosadmin`

> As credenciais são validadas **exclusivamente no servidor** via Edge Function. Nenhuma credencial fica exposta no código frontend.

---

## Segurança (GSD — Global Security Design)

| Camada | Proteção |
|---|---|
| Frontend | Apenas `VITE_SUPABASE_ANON_KEY` (segura para browser) |
| Storage | Bucket privado + RLS por `user_id` |
| Admin | Token de sessão em memória (nunca em localStorage) |
| Edge Functions | `SUPABASE_SERVICE_ROLE_KEY` nunca sai do servidor |
| Documentos | `storage_path` removido das respostas da API admin |
| Variáveis | Todas em `.env`, nunca commitadas |

---

## Estrutura de pastas

```
src/
├── components/
│   ├── sections/          # Seções da landing page
│   ├── AdminLogin.tsx      # Tela de login admin
│   ├── AdminPanel.tsx      # Dashboard admin
│   ├── CourseCard.tsx      # Card de curso com botão matricular
│   ├── CourseDetails.tsx   # Página detalhada do curso
│   ├── DocsSent.tsx        # Confirmação de documentos enviados
│   ├── EnrollModal.tsx     # Modal "prosseguir com matrícula"
│   ├── RegisterForm.tsx    # Cadastro / login de aluno
│   ├── UploadDocs.tsx      # Upload de documentos
│   └── VerifyEmail.tsx     # Verificação OTP
├── context/
│   ├── AdminContext.tsx    # Estado admin (token em memória)
│   ├── AuthContext.tsx     # Auth Supabase + perfil
│   ├── CartContext.tsx     # Carrinho de cursos
│   └── RouterContext.tsx   # Roteamento hash-based
├── data/
│   └── content.ts         # Cursos, textos, contatos
├── hooks/                 # useScroll, useScrollReveal, useCountUp
└── lib/
    └── supabase.ts        # Cliente Supabase (GSD: só anon key)

project/supabase/
├── functions/
│   ├── admin-login/       # Autenticação admin
│   ├── admin-list-users/  # Lista usuários (protegido)
│   ├── admin-user-docs/   # Docs de usuário (protegido)
│   ├── generate-otp/      # Gera e envia código OTP
│   └── verify-otp/        # Valida código OTP
└── migrations/            # SQL: tabelas, RLS, funções
```
