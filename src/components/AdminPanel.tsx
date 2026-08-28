import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, LogOut, Users, FileText, Eye, Loader2,
  ArrowLeft, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from '@/context/RouterContext';
import { EDGE_BASE } from '@/lib/supabase';
import AdminLogin from './AdminLogin';

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  email_verified: boolean;
  documents_uploaded: boolean;
  documents_uploaded_at: string | null;
  created_at: string;
}

interface DocRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

const DOC_LABELS: Record<string, string> = {
  cnh: 'CNH',
  rg: 'RG',
  titulo_eleitor: 'Título de Eleitor',
  comprovante_residencia: 'Comprovante de Residência',
};

export default function AdminPanel() {
  const { adminToken, logout } = useAdmin();
  const { navigate } = useRouter();

  if (!adminToken) return <AdminLogin />;

  return <AdminDashboard onLogout={logout} onBack={() => navigate({ name: 'home' })} token={adminToken} />;
}

function AdminDashboard({ onLogout, onBack, token }: { onLogout: () => void; onBack: () => void; token: string }) {
  const { navigate } = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${EDGE_BASE}/admin-list-users`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erro ao carregar usuários'); return; }
      setUsers(data);
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUser = async (u: UserRecord) => {
    setSelectedUser(u);
    navigate({ name: 'admin-user', userId: u.id });
    setDocsLoading(true);
    try {
      const res = await fetch(`${EDGE_BASE}/admin-user-docs?userId=${u.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setDocs(res.ok ? data : []);
    } catch { setDocs([]); }
    finally { setDocsLoading(false); }
  };

  const closeUser = () => {
    setSelectedUser(null);
    setDocs([]);
    navigate({ name: 'admin' });
  };

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20">
      <div className="border-b border-white/10 bg-graphite">
        <div className="container-x flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Site
            </button>
            <span className="text-white/20">/</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-pharos-red" />
              <span className="font-display text-base font-semibold text-white">Painel Admin</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-steel transition-colors hover:border-pharos-red hover:text-pharos-red"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="container-x py-8">
        {selectedUser ? (
          <div className="max-w-2xl">
            <button onClick={closeUser} className="mb-5 flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </button>

            <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pharos-red/20 font-display text-lg font-bold text-pharos-red">
                  {(selectedUser.name ?? selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {selectedUser.name ?? '—'}
                  </h2>
                  <p className="text-sm text-steel">{selectedUser.email}</p>
                  {selectedUser.phone && (
                    <p className="text-sm text-steel">{selectedUser.phone}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <StatusBadge ok={selectedUser.email_verified} label="E-mail verificado" />
                <StatusBadge ok={selectedUser.documents_uploaded} label="Documentos enviados" />
              </div>

              <p className="mt-3 text-xs text-steel/70">
                Cadastrado em {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <h3 className="mt-7 flex items-center gap-2 font-display text-lg font-semibold text-white">
              <FileText className="h-5 w-5 text-pharos-red" />
              Documentos enviados
            </h3>

            {docsLoading ? (
              <div className="mt-4 flex items-center gap-2 text-steel">
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Carregando documentos...
              </div>
            ) : docs.length === 0 ? (
              <p className="mt-4 text-sm text-steel">Nenhum documento enviado ainda.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-graphite-2/60 p-4">
                    <div>
                      <div className="font-display text-sm font-semibold text-white">
                        {DOC_LABELS[doc.document_type] ?? doc.document_type}
                      </div>
                      <div className="text-xs text-steel">{doc.file_name}</div>
                      {doc.file_size && (
                        <div className="text-xs text-steel/70">
                          {(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <span className="rounded-full bg-pharos-red/10 px-2 py-0.5 text-xs font-semibold text-pharos-red border border-pharos-red/20">
                      {doc.mime_type?.includes('pdf') ? 'PDF' : 'Imagem'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pharos-red" />
                <h2 className="font-display text-xl font-bold text-white">Colaboradores</h2>
                {!loading && (
                  <span className="rounded-full bg-pharos-red/10 border border-pharos-red/20 px-2 py-0.5 text-xs font-bold text-pharos-red">
                    {users.length}
                  </span>
                )}
              </div>
              <button onClick={fetchUsers} className="btn-ghost text-xs">
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-steel">
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Carregando...
              </div>
            ) : error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-steel">Nenhum usuário cadastrado ainda.</p>
            ) : (
              <div className="rounded-xl border border-white/10 bg-graphite-2/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-graphite/60">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel">Nome</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel hidden sm:table-cell">E-mail</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-steel">Status</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
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
                            <span className="font-medium text-white">{u.name ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-steel hidden sm:table-cell">{u.email}</td>
                        <td className="px-5 py-4 text-center">
                          {u.documents_uploaded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-500">
                              <CheckCircle2 className="h-3 w-3" /> Completo
                            </span>
                          ) : u.email_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
                              <Clock className="h-3 w-3" /> Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-steel/10 border border-white/10 px-2 py-0.5 text-xs font-semibold text-steel">
                              <AlertCircle className="h-3 w-3" /> Não verificado
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <Eye className="h-4 w-4 text-steel" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-500">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-steel">
      <Clock className="h-3 w-3" /> {label} pendente
    </span>
  );
}
