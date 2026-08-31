/**
 * CompanyEnrollees — painel da empresa para gerenciar pré-matrículas de candidatos.
 *
 * Fluxo:
 *  1. Empresa faz login/cadastro → redireciona para esta tela
 *  2. Empresa vê seus candidatos cadastrados
 *  3. Empresa pode adicionar novos candidatos
 *  4. Empresa pode remover candidatos pendentes
 *
 * Dados salvos em: tabela public.company_enrollees (company_id = auth.uid())
 * RLS garante que a empresa só vê/edita seus próprios candidatos.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Building2, UserPlus, Trash2, Loader2, ArrowLeft,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  MessageCircle, Home,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { courses } from '@/data/content';
import { whatsappLink } from '@/config/site';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Enrollee {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  course: string | null;
  course_slug: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

const STATUS_LABEL: Record<Enrollee['status'], string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const STATUS_CLASS: Record<Enrollee['status'], string> = {
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  confirmed: 'bg-green-500/10 border-green-500/20 text-green-400',
  cancelled: 'bg-white/5 border-white/10 text-steel',
};

function formatCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CompanyEnrollees() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const [enrollees, setEnrollees] = useState<Enrollee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Redireciona se não autenticado ou não for empresa
  useEffect(() => {
    if (!user) {
      navigate({ name: 'register' });
      return;
    }
    if (profile && profile.account_type !== 'empresa') {
      // Particular não deve acessar esta rota
      navigate({ name: 'upload-docs' });
    }
  }, [user, profile, navigate]);

  // ── Busca candidatos ─────────────────────────────────────────────────────
  const fetchEnrollees = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('company_enrollees')
      .select('id, name, cpf, phone, course, course_slug, notes, status, created_at')
      .eq('company_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      setError('Erro ao carregar candidatos. Tente novamente.');
      if (import.meta.env.DEV) console.error('[CompanyEnrollees] fetch:', err.message);
    } else {
      setEnrollees((data ?? []) as Enrollee[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEnrollees(); }, [fetchEnrollees]);

  // ── Remover candidato ────────────────────────────────────────────────────
  const handleRemove = async (id: string) => {
    const { error: err } = await supabase
      .from('company_enrollees')
      .delete()
      .eq('id', id)
      .eq('company_id', user!.id); // RLS dupla segurança

    if (err) {
      if (import.meta.env.DEV) console.error('[CompanyEnrollees] delete:', err.message);
      return;
    }
    setEnrollees((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Guards de renderização ───────────────────────────────────────────────
  if (!user || (profile && profile.account_type !== 'empresa')) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-slow text-pharos-red" />
      </div>
    );
  }

  const waLink = whatsappLink();

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 pb-12">
      <div className="container-x py-10 max-w-3xl mx-auto">

        {/* ── Header ── */}
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-6 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10">
              <Building2 className="h-6 w-6 text-pharos-red" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {profile?.company_name ?? 'Empresa'}
              </h1>
              <p className="text-sm text-steel">{profile?.email}</p>
              {profile?.cnpj && (
                <p className="text-xs text-steel/70 mt-0.5">CNPJ: {profile.cnpj}</p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-graphite/50 px-4 py-3">
            <p className="text-sm text-steel leading-relaxed">
              Cadastre os candidatos da sua empresa para pré-matrícula. Nossa equipe entrará
              em contato para confirmar as matrículas e orientar sobre os próximos passos.
            </p>
          </div>
        </div>

        {/* ── Resumo ── */}
        {!loading && enrollees.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <SummaryCard
              label="Total"
              value={enrollees.length}
              color="text-white"
            />
            <SummaryCard
              label="Aguardando"
              value={enrollees.filter((e) => e.status === 'pending').length}
              color="text-amber-400"
            />
            <SummaryCard
              label="Confirmados"
              value={enrollees.filter((e) => e.status === 'confirmed').length}
              color="text-green-400"
            />
          </div>
        )}

        {/* ── Botão adicionar ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Candidatos cadastrados</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-pharos-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pharos-red-dark"
          >
            {showForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Fechar formulário
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Adicionar candidato
              </>
            )}
          </button>
        </div>

        {/* ── Formulário de adição ── */}
        {showForm && (
          <AddEnrolleeForm
            companyId={user.id}
            onAdded={(e) => {
              setEnrollees((prev) => [e, ...prev]);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* ── Lista de candidatos ── */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-steel py-8">
            <Loader2 className="h-5 w-5 animate-spin-slow" />
            Carregando candidatos...
          </div>
        ) : enrollees.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-8 text-center">
            <UserPlus className="h-10 w-10 text-steel/40 mx-auto mb-3" />
            <p className="text-sm text-steel">Nenhum candidato cadastrado ainda.</p>
            <p className="text-xs text-steel/60 mt-1">
              Clique em "Adicionar candidato" para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollees.map((e) => (
              <EnrolleeCard
                key={e.id}
                enrollee={e}
                onRemove={() => handleRemove(e.id)}
              />
            ))}
          </div>
        )}

        {/* ── Rodapé ── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex-1"
          >
            <MessageCircle className="h-4 w-4" />
            Falar pelo WhatsApp
          </a>
          <button
            onClick={() => navigate({ name: 'home' })}
            className="btn-ghost flex-1"
          >
            <Home className="h-4 w-4" />
            Ir ao site
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: card de candidato ─────────────────────────────────────────

function EnrolleeCard({
  enrollee: e,
  onRemove,
}: {
  enrollee: Enrollee;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-semibold text-white">{e.name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_CLASS[e.status]}`}>
              {STATUS_CLASS[e.status] && (
                e.status === 'confirmed'
                  ? <CheckCircle2 className="inline h-3 w-3 mr-1" />
                  : e.status === 'pending'
                  ? <Clock className="inline h-3 w-3 mr-1" />
                  : <XCircle className="inline h-3 w-3 mr-1" />
              )}
              {STATUS_LABEL[e.status]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-steel">
            {e.cpf && <span>CPF: {e.cpf}</span>}
            {e.phone && <span>Tel: {e.phone}</span>}
          </div>
          {e.course && (
            <div className="mt-1 text-xs text-steel/80">
              Curso: <span className="text-white">{e.course}</span>
            </div>
          )}
          {e.notes && (
            <div className="mt-1 text-xs text-steel/60 italic">{e.notes}</div>
          )}
          <div className="mt-1 text-[10px] text-steel/50">
            Cadastrado em {new Date(e.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Só permite remover se status for pending */}
        {e.status === 'pending' && (
          <div className="shrink-0">
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Confirmar?</span>
                <button
                  onClick={() => { onRemove(); setConfirming(false); }}
                  className="rounded-md bg-red-500/20 border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs text-steel hover:text-white transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-red-400 hover:text-red-400"
                title="Remover candidato"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-componente: formulário de adição ──────────────────────────────────────

function AddEnrolleeForm({
  companyId,
  onAdded,
  onCancel,
}: {
  companyId: string;
  onAdded: (e: Enrollee) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCourse = courses.find((c) => c.slug === courseSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Informe o nome do candidato.'); return; }
    setError('');
    setLoading(true);

    const { data, error: err } = await supabase
      .from('company_enrollees')
      .insert({
        company_id: companyId,
        name: name.trim(),
        cpf: cpf.replace(/\D/g, '') || null,
        phone: phone.replace(/\D/g, '') || null,
        course: selectedCourse?.title ?? null,
        course_slug: courseSlug || null,
        notes: notes.trim() || null,
        status: 'pending',
      })
      .select('id, name, cpf, phone, course, course_slug, notes, status, created_at')
      .single();

    if (err || !data) {
      setError('Erro ao cadastrar candidato. Tente novamente.');
      if (import.meta.env.DEV) console.error('[AddEnrolleeForm]', err?.message);
    } else {
      onAdded(data as Enrollee);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-pharos-red/30 bg-pharos-red/5 p-6 mb-5">
      <h3 className="font-display text-base font-semibold text-white mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-pharos-red" />
        Novo candidato
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Nome completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Nome do candidato"
              required
            />
          </div>
          <div>
            <label className="input-label">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className="input-field"
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="input-label">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="input-field"
              placeholder="(62) 99999-9999"
            />
          </div>
          <div>
            <label className="input-label">Curso de interesse</label>
            <select
              value={courseSlug}
              onChange={(e) => setCourseSlug(e.target.value)}
              className="input-field"
            >
              <option value="">Selecione um curso</option>
              {courses
                .filter((c) => c.is_available)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="input-label">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input-field resize-none"
            placeholder="Turno preferido, observações sobre o candidato..."
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Salvando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Adicionar candidato
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-4 text-center">
      <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-steel">{label}</div>
    </div>
  );
}
