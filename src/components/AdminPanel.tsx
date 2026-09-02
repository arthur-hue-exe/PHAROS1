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
  XCircle, ExternalLink, Building2, User, Archive, ArchiveRestore,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from '@/context/RouterContext';
import { EDGE_BASE } from '@/lib/supabase';
import AdminLogin from './AdminLogin';

// Anon key necessária para o gateway do Supabase liberar Edge Functions com verify_jwt=false
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

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
  account_type: 'particular' | 'empresa';
  company_name: string | null;
  cnpj: string | null;
  course_slug: string | null;
  course_name: string | null;
  is_archived: boolean;
  archived_at: string | null;
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
  certidao: 'Certidão',
  oficio: 'Ofício',
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

type Tab = 'clients' | 'courses' | 'archived';

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
            <TabButton
              active={activeTab === 'archived'}
              onClick={() => setActiveTab('archived')}
              icon={<Archive className="h-4 w-4" />}
              label="Arquivados"
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
        {activeTab === 'archived' && (
          <ArchivedTab token={token} navigate={navigate} />
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
// ABA: CLIENTES — organizada por curso
// ════════════════════════════════════════════════════════════════════════════════

/** Agrupa usuários pelo curso (para particulares) ou por vários cursos (para empresas via enrollees) */
function groupByCourse(users: UserRecord[]): Map<string, { courseName: string; users: UserRecord[] }> {
  const map = new Map<string, { courseName: string; users: UserRecord[] }>();

  const addTo = (slug: string, name: string, u: UserRecord) => {
    if (!map.has(slug)) map.set(slug, { courseName: name, users: [] });
    map.get(slug)!.users.push(u);
  };

  for (const u of users) {
    if (u.account_type === 'empresa') {
      // Empresa pode ter candidatos em vários cursos
      const slugs = new Set<string>();
      for (const e of u.enrollees) {
        const slug = e.course_slug ?? '__sem_curso__';
        const name = e.course ?? 'Curso não informado';
        if (!slugs.has(slug)) { slugs.add(slug); addTo(slug, name, u); }
      }
      if (u.enrollees.length === 0) addTo('__sem_curso__', 'Curso não informado', u);
    } else {
      const slug = u.course_slug ?? '__sem_curso__';
      const name = u.course_name ?? 'Curso não informado';
      addTo(slug, name, u);
    }
  }

  // Ordena: sem_curso por último, resto alfabético
  return new Map([...map.entries()].sort(([a], [b]) => {
    if (a === '__sem_curso__') return 1;
    if (b === '__sem_curso__') return -1;
    return map.get(a)!.courseName.localeCompare(map.get(b)!.courseName, 'pt-BR');
  }));
}

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
  const [courseFilter, setCourseFilter] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // ── Estado do modal de arquivamento ─────────────────────────────────────────
  const [archiveTarget, setArchiveTarget] = useState<UserRecord | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState('');

  const { archiveUser } = useAdmin();

  // ── Confirmar arquivamento ─────────────────────────────────────────────────
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    const ok = await archiveUser(archiveTarget.id, true);
    setArchiving(false);
    setArchiveTarget(null);
    if (ok) {
      setUsers((prev) => prev.filter((u) => u.id !== archiveTarget.id));
      setArchiveSuccess('Usuário removido do painel.');
      setTimeout(() => setArchiveSuccess(''), 4000);
    } else {
      setError('Não foi possível remover o usuário do painel. Tente novamente.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // ── Busca usuários ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-list-users`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) setError('Token inválido ou expirado. Faça logout e login novamente.');
        else if (res.status === 404) setError('Edge Function admin-list-users não encontrada.');
        else if (res.status >= 500) setError(`Erro interno (${res.status}). Verifique os logs no Supabase.`);
        else setError(data.error ?? `Erro ${res.status} ao carregar usuários.`);
        return;
      }
      const normalized: UserRecord[] = Array.isArray(data) ? data.map((u) => ({
        ...u,
        account_type: (u.account_type as 'particular' | 'empresa') ?? 'particular',
        company_name: u.company_name ?? null,
        cnpj: u.cnpj ?? null,
        course_slug: u.course_slug ?? null,
        course_name: u.course_name ?? null,
        is_archived: u.is_archived ?? false,
        archived_at: u.archived_at ?? null,
        enrollees: Array.isArray(u.enrollees) ? u.enrollees : [],
      })) : [];
      setUsers(normalized);
      // Expande todos os grupos ao carregar pela primeira vez
      const slugs = new Set<string>();
      normalized.forEach(u => {
        if (u.account_type === 'empresa') u.enrollees.forEach(e => slugs.add(e.course_slug ?? '__sem_curso__'));
        else slugs.add(u.course_slug ?? '__sem_curso__');
      });
      setExpandedCourses(slugs);
    } catch {
      setError(navigator.onLine ? 'Erro de rede ao chamar admin-list-users.' : 'Sem conexão com a internet.');
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
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) { setDocsError(data.error ?? 'Erro ao carregar documentos.'); setDocs([]); }
      else setDocs(Array.isArray(data) ? data : []);
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

  // ── Download individual ─────────────────────────────────────────────────────
  const handleDownload = (doc: DocRecord) => {
    if (!doc.download_url) return;
    setDownloadingId(doc.id);
    window.open(doc.download_url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setDownloadingId(null), 1500);
  };

  // ── Baixar todos (abre cada URL em sequência) ───────────────────────────────
  const handleDownloadAll = async () => {
    if (!selectedUser || docsLoading) return;
    const validDocs = docs.filter(d => d.download_url);
    if (validDocs.length === 0) return;
    setDownloadingAll(true);
    // Abre cada URL com pequeno delay para não bloquear o browser
    for (let i = 0; i < validDocs.length; i++) {
      setTimeout(() => {
        window.open(validDocs[i].download_url!, '_blank', 'noopener,noreferrer');
      }, i * 400);
    }
    setTimeout(() => setDownloadingAll(false), validDocs.length * 400 + 500);
  };

  // ── Filtro de busca e curso ─────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      (u.name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q) ||
      (u.company_name ?? '').toLowerCase().includes(q) ||
      (u.course_name ?? '').toLowerCase().includes(q) ||
      u.enrollees.some(e => e.name.toLowerCase().includes(q) || (e.cpf ?? '').includes(q))
    );
    const matchesCourse = !courseFilter || (
      u.course_slug === courseFilter ||
      u.enrollees.some(e => e.course_slug === courseFilter)
    );
    return matchesSearch && matchesCourse;
  });

  const grouped = groupByCourse(filtered);

  // Lista de cursos únicos para o select de filtro
  const allCourses = Array.from(groupByCourse(users).entries()).map(([slug, { courseName }]) => ({ slug, courseName }));

  const toggleCourse = (slug: string) =>
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });

  // ── Renderização: detalhe do usuário ────────────────────────────────────────
  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        docs={docs}
        docsLoading={docsLoading}
        docsError={docsError}
        downloadingId={downloadingId}
        downloadingAll={downloadingAll}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        onBack={closeUser}
      />
    );
  }

  // ── Renderização: lista por curso ───────────────────────────────────────────
  return (
    <div>
      {/* Modal de confirmação de arquivamento */}
      {archiveTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-noir/80 backdrop-blur-sm" onClick={() => !archiving && setArchiveTarget(null)} />
          <div className="animate-scale-in relative w-full max-w-md rounded-2xl border border-white/10 bg-graphite-2 p-8 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 mx-auto">
              <Archive className="h-6 w-6 text-amber-400" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-white text-center">Remover usuário do painel?</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel text-center">
              <span className="font-semibold text-white">{archiveTarget.name ?? archiveTarget.email}</span> será removido da lista principal do painel administrativo, mas sua conta e todos os seus documentos permanecerão armazenados no sistema.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setArchiveTarget(null)} disabled={archiving} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleArchiveConfirm}
                disabled={archiving}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-amber-500/20 border border-amber-500/30 px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/30 disabled:opacity-60"
              >
                {archiving ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : <Archive className="h-4 w-4" />}
                Remover do painel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Feedback de sucesso */}
      {archiveSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {archiveSuccess}
        </div>
      )}

      {/* Cabeçalho + busca + filtro */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-pharos-red" />
          <h2 className="font-display text-xl font-bold text-white">Clientes por Curso</h2>
          {!loading && (
            <span className="rounded-full bg-pharos-red/10 border border-pharos-red/20 px-2 py-0.5 text-xs font-bold text-pharos-red">
              {filtered.length}{users.length !== filtered.length && ` / ${users.length}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por curso */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="input-field py-2 text-sm max-w-[180px]"
          >
            <option value="">Todos os cursos</option>
            {allCourses.map(({ slug, courseName }) => (
              <option key={slug} value={slug}>{courseName}</option>
            ))}
          </select>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, e-mail, CPF..."
              className="input-field pl-9 pr-3 py-2 text-sm w-48"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel hover:text-white">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-steel hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Estados de carregamento e erro */}
      {loading ? (
        <div className="flex items-center gap-2 text-steel py-8">
          <Loader2 className="h-5 w-5 animate-spin-slow" />Carregando clientes...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
          <AlertCircle className="mb-2 h-5 w-5" />{error}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-steel py-8">
          {search || courseFilter ? 'Nenhum cliente encontrado para este filtro.' : 'Nenhum cliente cadastrado ainda.'}
        </p>
      ) : (
        /* ── Grupos por curso ── */
        <div className="space-y-3">
          {[...grouped.entries()].map(([slug, { courseName, users: groupUsers }]) => {
            const isExpanded = expandedCourses.has(slug);
            const completeCount = groupUsers.filter(u => u.documents_uploaded).length;
            return (
              <div key={slug} className="rounded-xl border border-white/10 bg-graphite-2/60 overflow-hidden">
                {/* Cabeçalho do grupo */}
                <button
                  onClick={() => toggleCourse(slug)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-pharos-red shrink-0" />
                    <span className="font-display text-sm font-semibold text-white text-left">{courseName}</span>
                    <span className="rounded-full bg-pharos-red/10 border border-pharos-red/20 px-2 py-0.5 text-[10px] font-bold text-pharos-red">
                      {groupUsers.length} aluno{groupUsers.length !== 1 ? 's' : ''}
                    </span>
                    {completeCount > 0 && (
                      <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                        {completeCount} completo{completeCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <span className={`text-steel transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {/* Alunos do grupo */}
                {isExpanded && (
                  <div className="border-t border-white/10 divide-y divide-white/5">
                    {groupUsers.map((u) => {
                      // Conta documentos esperados por tipo de conta
                      const expectedDocs = u.account_type === 'empresa' ? 6 : 5;
                      return (
                        <div
                          key={u.id}
                          onClick={() => openUser(u)}
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-xs font-bold text-pharos-red">
                            {(u.name ?? u.email).charAt(0).toUpperCase()}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-white truncate">{u.name ?? '—'}</span>
                              <AccountTypeBadge accountType={u.account_type} />
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs text-steel truncate">{u.email}</span>
                              {u.account_type === 'empresa' && u.company_name && (
                                <span className="text-xs text-pharos-red/80 truncate">{u.company_name}</span>
                              )}
                            </div>
                          </div>
                          {/* Status docs */}
                          <div className="shrink-0 text-right">
                            {u.documents_uploaded ? (
                              <span className="text-xs font-semibold text-green-400">
                                Docs: {expectedDocs}/{expectedDocs}
                              </span>
                            ) : u.email_verified ? (
                              <span className="text-xs font-semibold text-amber-400">Pendente</span>
                            ) : (
                              <span className="text-xs text-steel">Não verificado</span>
                            )}
                          </div>
                          <Eye className="h-4 w-4 text-steel/50 shrink-0" />
                          {/* Botão remover do painel */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setArchiveTarget(u); }}
                            className="shrink-0 flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-steel hover:border-amber-500/40 hover:text-amber-400 transition-colors"
                            title="Remover do painel"
                          >
                            <Archive className="h-3 w-3" />
                            <span className="hidden sm:inline">Remover</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
  downloadingAll,
  onDownload,
  onDownloadAll,
  onBack,
}: {
  user: UserRecord;
  docs: DocRecord[];
  docsLoading: boolean;
  docsError: string;
  downloadingId: string | null;
  downloadingAll: boolean;
  onDownload: (doc: DocRecord) => void;
  onDownloadAll: () => void;
  onBack: () => void;
}) {
  const courseName = user.account_type === 'particular'
    ? (user.course_name ?? 'Curso não informado')
    : null; // empresas têm curso por candidato

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />Voltar para lista
      </button>

      {/* Card do usuário */}
      <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-lg font-bold text-pharos-red">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-white truncate">{user.name ?? '—'}</h2>
              <AccountTypeBadge accountType={user.account_type} />
            </div>
            {user.account_type === 'empresa' && user.company_name && (
              <p className="text-sm font-semibold text-pharos-red">{user.company_name}</p>
            )}
            {courseName && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-steel">
                <BookOpen className="h-3.5 w-3.5 text-pharos-red shrink-0" />
                <span className="font-medium text-white">{courseName}</span>
              </p>
            )}
            <p className="text-sm text-steel mt-0.5">{user.email}</p>
            {user.phone && <p className="text-sm text-steel">{user.phone}</p>}
            {user.cnpj && <p className="text-xs text-steel/70">CNPJ: {user.cnpj}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <StatusBadge ok={user.email_verified} label="E-mail verificado" />
          <StatusBadge ok={user.documents_uploaded} label="Documentos enviados" />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-steel/70">
          <span>Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          {user.documents_uploaded_at && (
            <span>Docs enviados em {new Date(user.documents_uploaded_at).toLocaleDateString('pt-BR')}</span>
          )}
        </div>
      </div>

      {/* Documentos */}
      <div className="mt-7 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <FileText className="h-5 w-5 text-pharos-red" />
          Documentos enviados
          {!docsLoading && docs.length > 0 && (
            <span className="text-xs font-normal text-steel">({docs.length} arquivo{docs.length !== 1 ? 's' : ''})</span>
          )}
        </h3>
        {/* Baixar todos */}
        {!docsLoading && docs.filter(d => d.download_url).length > 1 && (
          <button
            onClick={onDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-1.5 rounded-md bg-pharos-red px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-pharos-red-dark disabled:opacity-60"
          >
            {downloadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin-slow" /> : <Download className="h-3.5 w-3.5" />}
            Baixar todos
          </button>
        )}
      </div>

      {docsLoading ? (
        <div className="mt-4 flex items-center gap-2 text-steel"><Loader2 className="h-4 w-4 animate-spin-slow" />Carregando documentos...</div>
      ) : docsError ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{docsError}</div>
      ) : docs.length === 0 ? (
        <p className="mt-4 text-sm text-steel">Nenhum documento enviado ainda.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-graphite-2/60 p-4 gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="font-display text-sm font-semibold text-white">
                    {DOC_LABELS[doc.document_type] ?? doc.document_type}
                  </span>
                </div>
                <div className="text-xs text-steel truncate mt-0.5">{doc.file_name}</div>
                <div className="text-xs text-steel/60 mt-0.5">
                  {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB · ` : ''}
                  {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')} · {' '}
                  <span className="uppercase">{doc.mime_type?.includes('pdf') ? 'PDF' : doc.mime_type?.split('/')[1]?.toUpperCase() ?? 'Arquivo'}</span>
                </div>
                {doc.download_error && <div className="text-xs text-red-400 mt-1">{doc.download_error}</div>}
              </div>
              {doc.download_url ? (
                <button
                  onClick={() => onDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-pharos-red/10 border border-pharos-red/30 px-3 py-2 text-xs font-semibold text-pharos-red transition-colors hover:bg-pharos-red hover:text-white disabled:opacity-60"
                >
                  {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin-slow" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Baixar</span>
                </button>
              ) : (
                <span className="shrink-0 flex items-center gap-1 text-xs text-steel/50">
                  <ExternalLink className="h-3.5 w-3.5" />URL indisponível
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Candidatos (empresas) */}
      {user.account_type === 'empresa' && (
        <EnrolleesSection enrollees={user.enrollees} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ABA: ARQUIVADOS
// ════════════════════════════════════════════════════════════════════════════════

function ArchivedTab({
  token,
  navigate,
}: {
  token: string;
  navigate: (r: { name: 'admin-user'; userId: string } | { name: 'admin' }) => void;
}) {
  const { archiveUser } = useAdmin();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-list-users?archived=true`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? `Erro ${res.status}`); return; }
      setUsers(Array.isArray(data) ? data.map((u: UserRecord) => ({
        ...u,
        account_type: (u.account_type as 'particular' | 'empresa') ?? 'particular',
        company_name: u.company_name ?? null,
        cnpj: u.cnpj ?? null,
        course_slug: u.course_slug ?? null,
        course_name: u.course_name ?? null,
        is_archived: u.is_archived ?? true,
        archived_at: u.archived_at ?? null,
        enrollees: Array.isArray(u.enrollees) ? u.enrollees : [],
      })) : []);
    } catch {
      setError('Erro de rede ao carregar usuários arquivados.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);

  const handleRestore = async (u: UserRecord) => {
    setRestoringId(u.id);
    const ok = await archiveUser(u.id, false);
    setRestoringId(null);
    if (ok) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setSuccessMsg(`"${u.name ?? u.email}" restaurado para a lista principal.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError('Não foi possível restaurar o usuário. Tente novamente.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const openUser = async (u: UserRecord) => {
    setSelectedUser(u);
    setDocs([]);
    setDocsError('');
    navigate({ name: 'admin-user', userId: u.id });
    setDocsLoading(true);
    try {
      const res = await fetch(`${EDGE_BASE}/admin-user-docs?userId=${u.id}`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) { setDocsError(data.error ?? 'Erro ao carregar documentos.'); setDocs([]); }
      else setDocs(Array.isArray(data) ? data : []);
    } catch { setDocsError('Erro de rede.'); setDocs([]); }
    finally { setDocsLoading(false); }
  };

  const handleDownload = (doc: DocRecord) => {
    if (!doc.download_url) return;
    setDownloadingId(doc.id);
    window.open(doc.download_url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setDownloadingId(null), 1500);
  };

  const handleDownloadAll = async () => {
    const valid = docs.filter(d => d.download_url);
    if (valid.length === 0) return;
    setDownloadingAll(true);
    valid.forEach((d, i) => setTimeout(() => window.open(d.download_url!, '_blank', 'noopener,noreferrer'), i * 400));
    setTimeout(() => setDownloadingAll(false), valid.length * 400 + 500);
  };

  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        docs={docs}
        docsLoading={docsLoading}
        docsError={docsError}
        downloadingId={downloadingId}
        downloadingAll={downloadingAll}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
        onBack={() => { setSelectedUser(null); setDocs([]); navigate({ name: 'admin' }); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-amber-400" />
          <h2 className="font-display text-xl font-bold text-white">Usuários Arquivados</h2>
          {!loading && (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
              {users.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchArchived}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs text-steel hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400/80">
        Usuários arquivados não aparecem na lista principal. Conta, documentos e dados permanecem intactos.
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle className="mb-1 h-4 w-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-steel py-8">
          <Loader2 className="h-5 w-5 animate-spin-slow" />Carregando arquivados...
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-steel py-8">Nenhum usuário arquivado.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/10 bg-graphite-2/60 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-display text-sm font-bold text-amber-400">
                  {(u.name ?? u.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{u.name ?? '—'}</span>
                    <AccountTypeBadge accountType={u.account_type} />
                  </div>
                  <p className="text-xs text-steel mt-0.5 truncate">{u.email}</p>
                  {u.course_name && (
                    <p className="text-xs text-steel/70 mt-0.5">
                      <BookOpen className="inline h-3 w-3 mr-1 text-pharos-red" />
                      {u.course_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-steel/60">
                    <span>Cadastro: {new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                    {u.archived_at && (
                      <span>Arquivado: {new Date(u.archived_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openUser(u)}
                    className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-steel hover:text-white transition-colors"
                    title="Ver documentos"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Docs</span>
                  </button>
                  <button
                    onClick={() => handleRestore(u)}
                    disabled={restoringId === u.id}
                    className="flex items-center gap-1.5 rounded-md bg-green-500/10 border border-green-500/30 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-60"
                    title="Restaurar para lista principal"
                  >
                    {restoringId === u.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    )}
                    Restaurar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
