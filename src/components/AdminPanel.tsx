/**
 * AdminPanel — painel administrativo do PHAROS.
 *
 * Abas:
 *  • Clientes  — lista de usuários cadastrados + detalhes + download de documentos
 *  • Cursos    — gerenciamento de disponibilidade dos cursos
 *
 * Autenticação: JWT obtido via Edge Function admin-login (AdminContext).
 * Downloads: signed URLs temporárias (1h) geradas pela Edge Function admin-user-docs.
 * Disponibilidade: alterada via Edge Function admin-update-course.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, LogOut, Users, FileText, Eye, Loader2,
  ArrowLeft, CheckCircle2, Clock, AlertCircle, Download,
  BookOpen, ToggleLeft, ToggleRight, RefreshCw, Search,
  XCircle, ExternalLink, Building2, User,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from '@/context/RouterContext';
import { EDGE_BASE } from '@/lib/supabase';
import AdminLogin from './AdminLogin';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  email_verified: boolean;
  documents_uploaded: boolean;
  documents_uploaded_at: string | null;
  created_at: string;
  /** 'particular' | 'empresa' — fallback 'particular' para BDs sem migration */
  account_type: 'particular' | 'empresa';
  company_name: string | null;
  cnpj: string | null;
  /** Candidatos vinculados — presente apenas quando account_type === 'empresa' */
  enrollees: EnrolleeRecord[];
}

interface EnrolleeRecord {
  id: string;
  company_id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  course: string | null;
  course_slug: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface DocRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  download_url: string | null;
  download_error: string | null;
}

interface CourseRecord {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  is_available: boolean;
  updated_at: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DOC_LABELS: Record<string, string> = {
  cnh: 'CNH',
  rg: 'RG',
  titulo_eleitor: 'Título de Eleitor',
  comprovante_residencia: 'Comprovante de Residência',
};

const ENROLLEE_STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const ENROLLEE_STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  confirmed: 'bg-green-500/10 border-green-500/20 text-green-400',
  cancelled: 'bg-white/5 border-white/10 text-steel',
};

type Tab = 'clients' | 'courses';

// ── Root: guarda de autenticação ──────────────────────────────────────────────

export default function AdminPanel() {
  const { adminToken, logout } = useAdmin();
  const { navigate } = useRouter();

  if (!adminToken) return <AdminLogin />;

  return (
    <AdminDashboard
      token={adminToken}
      onLogout={logout}
      onBack={() => navigate({ name: 'home' })}
    />
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────

function AdminDashboard({
  token,
  onLogout,
  onBack,
}: {
  token: string;
  onLogout: () => void;
  onBack: () => void;
}) {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('clients');

  return (
    <div className="min-h-screen bg-noir">
      {/* ── Top bar ── */}
      <div className="border-b border-white/10 bg-graphite sticky top-0 z-40">
        <div className="container-x flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao site</span>
            </button>
            <span className="text-white/20">/</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-pharos-red" />
              <span className="font-display text-base font-semibold text-white">
                PHAROS Admin
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-steel transition-colors hover:border-pharos-red hover:text-pharos-red"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="container-x">
          <div className="flex gap-1 border-t border-white/10 pt-0">
            <TabButton
              active={activeTab === 'clients'}
              onClick={() => setActiveTab('clients')}
              icon={<Users className="h-4 w-4" />}
              label="Clientes"
            />
            <TabButton
              active={activeTab === 'courses'}
              onClick={() => setActiveTab('courses')}
              icon={<BookOpen className="h-4 w-4" />}
              label="Cursos"
            />
          </div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="container-x py-8">
        {activeTab === 'clients' && (
          <ClientsTab token={token} navigate={navigate} />
        )}
        {activeTab === 'courses' && (
          <CoursesTab token={token} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-pharos-red text-white'
          : 'border-transparent text-steel hover:text-white hover:border-white/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ABA: CLIENTES
// ════════════════════════════════════════════════════════════════════════════════

function ClientsTab({
  token,
  navigate,
}: {
  token: string;
  navigate: (r: { name: 'admin-user'; userId: string } | { name: 'admin' }) => void;
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ── Busca usuários ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-list-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Sessão expirada. Recarregue a página e faça login novamente.'
            : data.error ?? `Erro ${res.status} ao carregar usuários.`
        );
        return;
      }
      setUsers(Array.isArray(data) ? data.map((u) => ({
        ...u,
        account_type: (u.account_type as 'particular' | 'empresa') ?? 'particular',
        company_name: u.company_name ?? null,
        cnpj: u.cnpj ?? null,
        enrollees: Array.isArray(u.enrollees) ? u.enrollees : [],
      })) : []);
    } catch {
      setError(
        navigator.onLine
          ? 'Edge Function admin-list-users inacessível. Verifique se está publicada.'
          : 'Sem conexão com a internet.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Abre detalhes de um usuário ─────────────────────────────────────────────
  const openUser = async (u: UserRecord) => {
    setSelectedUser(u);
    setDocs([]);
    setDocsError('');
    navigate({ name: 'admin-user', userId: u.id });
    setDocsLoading(true);
    try {
      const res = await fetch(`${EDGE_BASE}/admin-user-docs?userId=${u.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) {
        setDocsError(data.error ?? 'Erro ao carregar documentos.');
        setDocs([]);
      } else {
        setDocs(Array.isArray(data) ? data : []);
      }
    } catch {
      setDocsError('Erro de rede ao carregar documentos.');
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const closeUser = () => {
    setSelectedUser(null);
    setDocs([]);
    setDocsError('');
    navigate({ name: 'admin' });
  };

  // ── Download de documento ───────────────────────────────────────────────────
  const handleDownload = async (doc: DocRecord) => {
    if (!doc.download_url) return;
    setDownloadingId(doc.id);
    try {
      // Abre em nova aba — o header Content-Disposition: attachment força o download
      window.open(doc.download_url, '_blank', 'noopener,noreferrer');
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  // ── Filtro de busca ─────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q)
    );
  });

  // ── Renderização ────────────────────────────────────────────────────────────
  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        docs={docs}
        docsLoading={docsLoading}
        docsError={docsError}
        downloadingId={downloadingId}
        onDownload={handleDownload}
        onBack={closeUser}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-pharos-red" />
          <h2 className="font-display text-xl font-bold text-white">Clientes</h2>
          {!loading && (
            <span className="rounded-full bg-pharos-red/10 border border-pharos-red/20 px-2 py-0.5 text-xs font-bold text-pharos-red">
              {filtered.length}
              {search && users.length !== filtered.length && ` / ${users.length}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="input-field pl-9 pr-3 py-2 text-sm w-56"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel hover:text-white"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-steel hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Estados */}
      {loading ? (
        <div className="flex items-center gap-2 text-steel py-8">
          <Loader2 className="h-5 w-5 animate-spin-slow" />
          Carregando clientes...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
          <AlertCircle className="mb-2 h-5 w-5" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-steel py-8">
          {search ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado ainda.'}
        </p>
      ) : (
        <div className="rounded-xl border border-white/10 bg-graphite-2/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-graphite/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel hidden md:table-cell">
                    E-mail
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel hidden lg:table-cell">
                    Telefone
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-steel">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-steel">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel hidden sm:table-cell">
                    Cadastro
                  </th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUser(u)}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-xs font-bold text-pharos-red">
                          {(u.name ?? u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-white">{u.name ?? '—'}</span>
                          {u.account_type === 'empresa' && u.company_name && (
                            <div className="text-xs text-steel truncate max-w-[140px]">{u.company_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-steel hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-4 text-steel hidden lg:table-cell">
                      {u.phone ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <AccountTypeBadge accountType={u.account_type} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <UserStatusBadge user={u} />
                    </td>
                    <td className="px-5 py-4 text-xs text-steel hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-4">
                      <Eye className="h-4 w-4 text-steel" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detalhe do usuário ────────────────────────────────────────────────────────

function UserDetail({
  user,
  docs,
  docsLoading,
  docsError,
  downloadingId,
  onDownload,
  onBack,
}: {
  user: UserRecord;
  docs: DocRecord[];
  docsLoading: boolean;
  docsError: string;
  downloadingId: string | null;
  onDownload: (doc: DocRecord) => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para lista
      </button>

      {/* Card do usuário */}
      <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-lg font-bold text-pharos-red">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-white truncate">
                {user.name ?? '—'}
              </h2>
              <AccountTypeBadge accountType={user.account_type} />
            </div>
            {user.account_type === 'empresa' && user.company_name && (
              <p className="text-sm font-semibold text-pharos-red">{user.company_name}</p>
            )}
            <p className="text-sm text-steel">{user.email}</p>
            {user.phone && <p className="text-sm text-steel">{user.phone}</p>}
            {user.cnpj && <p className="text-xs text-steel/70">CNPJ: {user.cnpj}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <StatusBadge ok={user.email_verified} label="E-mail verificado" />
          <StatusBadge ok={user.documents_uploaded} label="Documentos enviados" />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-steel/70">
          <span>
            Cadastrado em{' '}
            {new Date(user.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {user.documents_uploaded_at && (
            <span>
              Docs enviados em{' '}
              {new Date(user.documents_uploaded_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Documentos */}
      <h3 className="mt-7 flex items-center gap-2 font-display text-lg font-semibold text-white">
        <FileText className="h-5 w-5 text-pharos-red" />
        Documentos enviados
      </h3>

      {docsLoading ? (
        <div className="mt-4 flex items-center gap-2 text-steel">
          <Loader2 className="h-4 w-4 animate-spin-slow" />
          Carregando documentos...
        </div>
      ) : docsError ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {docsError}
        </div>
      ) : docs.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Nenhum documento enviado ainda.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-graphite-2/60 p-4 gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold text-white">
                  {DOC_LABELS[doc.document_type] ?? doc.document_type}
                </div>
                <div className="text-xs text-steel truncate">{doc.file_name}</div>
                <div className="text-xs text-steel/60 mt-0.5">
                  {doc.file_size
                    ? `${(doc.file_size / 1024).toFixed(0)} KB · `
                    : ''}
                  {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                  {' · '}
                  <span className="uppercase">
                    {doc.mime_type?.includes('pdf')
                      ? 'PDF'
                      : doc.mime_type?.split('/')[1]?.toUpperCase() ?? 'Arquivo'}
                  </span>
                </div>
                {doc.download_error && (
                  <div className="text-xs text-red-400 mt-1">{doc.download_error}</div>
                )}
              </div>

              {doc.download_url ? (
                <button
                  onClick={() => onDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-pharos-red/10 border border-pharos-red/30 px-3 py-2 text-xs font-semibold text-pharos-red transition-colors hover:bg-pharos-red hover:text-white disabled:opacity-60"
                  title={`Baixar ${doc.file_name}`}
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Baixar</span>
                </button>
              ) : (
                <span className="shrink-0 flex items-center gap-1 text-xs text-steel/50">
                  <ExternalLink className="h-3.5 w-3.5" />
                  URL indisponível
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Seção de candidatos — só aparece para empresas ── */}
      {user.account_type === 'empresa' && (
        <EnrolleesSection enrollees={user.enrollees} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ABA: CURSOS
// ════════════════════════════════════════════════════════════════════════════════

function CoursesTab({ token }: { token: string }) {
  const { updateCourseAvailability } = useAdmin();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Busca cursos diretamente do Supabase (leitura pública via anon key) ──────
  // A tabela courses tem policy de leitura pública, então não precisa de
  // Edge Function — basta chamar a API REST do Supabase.
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Usa a REST API do Supabase diretamente (leitura pública pelo anon key)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/courses?select=id,slug,name,category,is_available,updated_at&order=name.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? `Erro ${res.status} ao carregar cursos.`);
        return;
      }

      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro de rede ao carregar cursos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Toggle disponibilidade ──────────────────────────────────────────────────
  const handleToggle = async (course: CourseRecord) => {
    setTogglingSlug(course.slug);
    setSuccessMsg('');
    const newValue = !course.is_available;
    const ok = await updateCourseAvailability(course.slug, newValue);
    if (ok) {
      setCourses((prev) =>
        prev.map((c) =>
          c.slug === course.slug ? { ...c, is_available: newValue } : c
        )
      );
      setSuccessMsg(
        `"${course.name}" marcado como ${newValue ? 'DISPONÍVEL' : 'INDISPONÍVEL'}.`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError('Falha ao atualizar disponibilidade. Verifique o token e tente novamente.');
      setTimeout(() => setError(''), 5000);
    }
    setTogglingSlug(null);
  };

  // ── Resumo ──────────────────────────────────────────────────────────────────
  const available   = courses.filter((c) => c.is_available).length;
  const unavailable = courses.filter((c) => !c.is_available).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-pharos-red" />
          <h2 className="font-display text-xl font-bold text-white">Gerenciar Cursos</h2>
        </div>
        <button
          onClick={fetchCourses}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-steel hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Resumo */}
      {!loading && courses.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <SummaryCard label="Total" value={courses.length} color="text-white" />
          <SummaryCard label="Disponíveis" value={available} color="text-green-400" />
          <SummaryCard label="Indisponíveis" value={unavailable} color="text-red-400" />
        </div>
      )}

      {/* Feedback */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Estados */}
      {loading ? (
        <div className="flex items-center gap-2 text-steel py-8">
          <Loader2 className="h-5 w-5 animate-spin-slow" />
          Carregando cursos...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
          <AlertCircle className="mb-2 h-5 w-5" />
          {error}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-steel py-8">
          Nenhum curso cadastrado. Execute a migration SQL para seed inicial.
        </p>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-graphite-2/60 p-4 gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm font-semibold text-white">
                    {course.name}
                  </span>
                  {course.category && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-steel">
                      {course.category}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {course.is_available ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      DISPONÍVEL
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      INDISPONÍVEL
                    </span>
                  )}
                  <span className="text-[10px] text-steel/50">
                    · atualizado {new Date(course.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleToggle(course)}
                disabled={togglingSlug === course.slug}
                className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  course.is_available
                    ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
                title={course.is_available ? 'Marcar como indisponível' : 'Marcar como disponível'}
              >
                {togglingSlug === course.slug ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
                ) : course.is_available ? (
                  <ToggleRight className="h-3.5 w-3.5" />
                ) : (
                  <ToggleLeft className="h-3.5 w-3.5" />
                )}
                {course.is_available ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes utilitários ───────────────────────────────────────────────

function UserStatusBadge({ user }: { user: UserRecord }) {
  if (user.documents_uploaded) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-500 whitespace-nowrap">
        <CheckCircle2 className="h-3 w-3" />
        Completo
      </span>
    );
  }
  if (user.email_verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500 whitespace-nowrap">
        <Clock className="h-3 w-3" />
        Pendente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-semibold text-steel whitespace-nowrap">
      <AlertCircle className="h-3 w-3" />
      Não verificado
    </span>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-500">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-steel">
      <Clock className="h-3 w-3" />
      {label} pendente
    </span>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-4 text-center">
      <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-steel">{label}</div>
    </div>
  );
}

// ── AccountTypeBadge ──────────────────────────────────────────────────────────

function AccountTypeBadge({ accountType }: { accountType: 'particular' | 'empresa' }) {
  if (accountType === 'empresa') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400 whitespace-nowrap">
        <Building2 className="h-3 w-3" />
        Empresa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-steel whitespace-nowrap">
      <User className="h-3 w-3" />
      Particular
    </span>
  );
}

// ── EnrolleesSection — candidatos da empresa no detalhe do admin ──────────────

const ENROLLEE_STATUS_LABEL_LOCAL: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const ENROLLEE_STATUS_CLASS_LOCAL: Record<string, string> = {
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  confirmed: 'bg-green-500/10 border-green-500/20 text-green-400',
  cancelled: 'bg-white/5 border-white/10 text-steel',
};

function EnrolleesSection({ enrollees }: { enrollees: EnrolleeRecord[] }) {
  return (
    <div className="mt-7">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white mb-4">
        <Users className="h-5 w-5 text-pharos-red" />
        Candidatos pré-matriculados
        <span className="rounded-full bg-pharos-red/10 border border-pharos-red/20 px-2 py-0.5 text-xs font-bold text-pharos-red">
          {enrollees.length}
        </span>
      </h3>

      {enrollees.length === 0 ? (
        <p className="text-sm text-steel">Nenhum candidato cadastrado ainda.</p>
      ) : (
        <div className="space-y-3">
          {enrollees.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-white/10 bg-graphite-2/60 p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-sm font-semibold text-white">
                      {e.name}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        ENROLLEE_STATUS_CLASS_LOCAL[e.status] ?? ENROLLEE_STATUS_CLASS_LOCAL.pending
                      }`}
                    >
                      {ENROLLEE_STATUS_LABEL_LOCAL[e.status] ?? e.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-steel">
                    {e.cpf && <span>CPF: {e.cpf}</span>}
                    {e.phone && <span>Tel: {e.phone}</span>}
                  </div>
                  {e.course && (
                    <div className="mt-1 text-xs text-steel/80">
                      Curso:{' '}
                      <span className="text-white">{e.course}</span>
                    </div>
                  )}
                  {e.notes && (
                    <div className="mt-1 text-xs text-steel/60 italic">{e.notes}</div>
                  )}
                  <div className="mt-1 text-[10px] text-steel/50">
                    Cadastrado em{' '}
                    {new Date(e.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
