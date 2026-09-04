/**
 * UploadDocs — página de envio de documentos.
 * Rota protegida: só acessível após login.
 * Armazenamento via Supabase Storage (bucket privado "documents").
 *
 * Documentos únicos (1 arquivo): CNH, RG, Título, Comprovante, Ofício (empresa), Dispensa
 * Documentos múltiplos (até 10): Certidão — cada certidão é um slot independente
 */
import { useState, useCallback, useEffect } from 'react';
import { Upload, FileCheck, Loader2, ArrowLeft, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CERTIDOES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Tipos de documentos únicos (um slot fixo cada)
type SingleDocType =
  | 'cnh'
  | 'rg'
  | 'titulo_eleitor'
  | 'comprovante_residencia'
  | 'dispensa'
  | 'oficio';

// Tipo interno de slot — 'certidao' usa slots dinâmicos com id único
interface DocSlot {
  /** ID único do slot (para certidões múltiplas: certidao_1, certidao_2…) */
  id: string;
  /** Tipo salvo no banco */
  document_type: SingleDocType | 'certidao';
  label: string;
  description: string;
  file: File | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  errorMsg: string;
  /** Apenas para certidao: indica se o usuário solicitou impressão */
  printRequested?: boolean;
}

function makeSingleSlot(
  type: SingleDocType,
  label: string,
  description: string
): DocSlot {
  return { id: type, document_type: type, label, description, file: null, status: 'idle', errorMsg: '' };
}

function makeCertidaoSlot(index: number): DocSlot {
  return {
    id: `certidao_${index}`,
    document_type: 'certidao',
    label: index === 1 ? 'Certidão' : `Certidão ${index}`,
    description: 'Certidão exigida para matrícula (PDF ou imagem legível)',
    file: null,
    status: 'idle',
    errorMsg: '',
    printRequested: false,
  };
}

/** Slots fixos base (exceto certidões e ofício) */
const BASE_FIXED: DocSlot[] = [
  makeSingleSlot('cnh', 'CNH', 'Carteira Nacional de Habilitação (frente e verso em uma imagem ou PDF)'),
  makeSingleSlot('rg', 'RG', 'Documento de Identidade (frente e verso)'),
  makeSingleSlot('titulo_eleitor', 'Título de Eleitor', 'Título de eleitor (frente e verso)'),
  makeSingleSlot('comprovante_residencia', 'Comprovante de Residência', 'Conta de água, luz ou telefone com no máx. 90 dias'),
  makeSingleSlot('dispensa', 'Dispensa', 'Dispensa militar ou documento equivalente'),
];

const OFICIO_SLOT: DocSlot = makeSingleSlot('oficio', 'Ofício', 'Ofício da empresa solicitante (PDF ou imagem legível)');

/** Monta os slots iniciais conforme tipo de conta */
function buildInitialSlots(accountType: 'particular' | 'empresa'): DocSlot[] {
  const base = [...BASE_FIXED, makeCertidaoSlot(1)];
  return accountType === 'empresa' ? [...base, OFICIO_SLOT] : base;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function UploadDocs() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate, route } = useRouter();

  const routeCourseSlug = route.name === 'upload-docs' ? (route.courseSlug ?? null) : null;
  const routeCourseName = route.name === 'upload-docs' ? (route.courseName ?? null) : null;
  const courseSlug = routeCourseSlug ?? profile?.course_slug ?? null;
  const courseName = routeCourseName ?? profile?.course_name ?? null;

  const [slots, setSlots] = useState<DocSlot[]>(() => buildInitialSlots('particular'));
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Proteção de rota
  useEffect(() => {
    if (!user) navigate({ name: 'register' });
    else if (profile?.documents_uploaded) navigate({ name: 'docs-sent' });
  }, [user, profile, navigate]);

  // Atualiza slots quando account_type carrega
  useEffect(() => {
    if (!profile) return;
    setSlots(buildInitialSlots(profile.account_type ?? 'particular'));
  }, [profile?.account_type]);

  // Número atual de certidões
  const certidaoCount = slots.filter((s) => s.document_type === 'certidao').length;

  // ── Adicionar mais uma certidão ──────────────────────────────────────────
  const addCertidao = useCallback(() => {
    if (certidaoCount >= MAX_CERTIDOES) return;
    const nextIndex = certidaoCount + 1;
    setSlots((prev) => {
      // Insere após a última certidão
      const lastCertIdx = prev.map((s) => s.document_type).lastIndexOf('certidao');
      const next = [...prev];
      next.splice(lastCertIdx + 1, 0, makeCertidaoSlot(nextIndex));
      return next;
    });
  }, [certidaoCount]);

  // ── Remover uma certidão extra (só as adicionadas, não a primeira) ────────
  const removeCertidao = useCallback((id: string) => {
    setSlots((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      // Renumera os labels das certidões
      let certCount = 0;
      return remaining.map((s) => {
        if (s.document_type !== 'certidao') return s;
        certCount++;
        return { ...s, id: `certidao_${certCount}`, label: certCount === 1 ? 'Certidão' : `Certidão ${certCount}` };
      });
    });
  }, []);

  // ── Handlers de arquivo ───────────────────────────────────────────────────
  const handleFileChange = useCallback((slotId: string, file: File | null) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, errorMsg: 'Formato inválido. Use JPG, PNG, WEBP ou PDF.' } : s));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, errorMsg: 'Arquivo muito grande. Máximo 5 MB.' } : s));
      return;
    }
    setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, file, status: 'idle', errorMsg: '' } : s));
  }, []);

  // ── Upload de um slot ─────────────────────────────────────────────────────
  const uploadSlot = useCallback(async (slot: DocSlot): Promise<boolean> => {
    if (!slot.file || !user) return false;

    setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, status: 'uploading' } : s));

    const ext = slot.file.name.split('.').pop() ?? 'bin';
    // Usa o id do slot para garantir caminho único (ex: certidao_2_timestamp)
    const storagePath = `${user.id}/${slot.id}_${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, slot.file, { contentType: slot.file.type, upsert: false });

    if (storageErr) {
      setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, status: 'error', errorMsg: storageErr.message } : s));
      return false;
    }

    const { error: dbErr } = await supabase.from('documents').insert({
      user_id: user.id,
      document_type: slot.document_type,
      storage_path: storagePath,
      file_name: slot.file.name,
      file_size: slot.file.size,
      mime_type: slot.file.type,
      print_requested: slot.document_type === 'certidao' ? (slot.printRequested ?? false) : false,
    });

    if (dbErr) {
      setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, status: 'error', errorMsg: dbErr.message } : s));
      return false;
    }

    setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, status: 'done', errorMsg: '' } : s));
    return true;
  }, [user]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const missing = slots.filter((s) => !s.file);
    if (missing.length > 0) {
      setGlobalError('Adicione todos os documentos antes de enviar.');
      return;
    }
    setGlobalError('');
    setSubmitting(true);

    const results = await Promise.all(slots.map(uploadSlot));
    const allOk = results.every(Boolean);

    if (allOk) {
      if (courseSlug && courseName && user) {
        await supabase.from('profiles').update({ course_slug: courseSlug, course_name: courseName }).eq('id', user.id);
      }
      await supabase.rpc('mark_documents_uploaded');
      await refreshProfile();
      navigate({ name: 'docs-sent' });
    } else {
      setGlobalError('Alguns arquivos falharam. Verifique os erros e tente novamente.');
    }
    setSubmitting(false);
  }, [slots, uploadSlot, refreshProfile, navigate, courseSlug, courseName, user]);

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!user || profile?.documents_uploaded) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin-slow text-pharos-red" />
      </div>
    );
  }

  const allSelected = slots.every((s) => s.file !== null);

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20 pb-12">
      <div className="container-x py-10 max-w-2xl mx-auto">
        <button onClick={() => navigate({ name: 'home' })} className="mb-6 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10">
            <Upload className="h-7 w-7 text-pharos-red" />
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold text-white">Envio de documentos</h1>
          <p className="mt-2 text-sm text-steel">
            Envie os documentos abaixo para concluir o processo de matrícula.
            Formatos aceitos: JPG, PNG, WEBP e PDF. Máximo 5 MB por arquivo.
          </p>

          <div className="mt-7 space-y-4">
            {slots.map((slot) => (
              <DocUploadSlot
                key={slot.id}
                slot={slot}
                onChange={(file) => handleFileChange(slot.id, file)}
                onRemove={() => {
                  if (slot.document_type === 'certidao' && certidaoCount > 1) {
                    removeCertidao(slot.id);
                  } else {
                    setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, file: null, status: 'idle', errorMsg: '' } : s));
                  }
                }}
                canDelete={slot.document_type === 'certidao' && certidaoCount > 1}
                onPrintChange={slot.document_type === 'certidao' ? (value) =>
                  setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, printRequested: value } : s))
                  : undefined}
              />
            ))}
          </div>

          {/* Botão adicionar certidão */}
          {certidaoCount < MAX_CERTIDOES && (
            <button
              type="button"
              onClick={addCertidao}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-white/20 px-4 py-2 text-xs text-steel transition-colors hover:border-pharos-red hover:text-pharos-red"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar outra Certidão ({certidaoCount}/{MAX_CERTIDOES})
            </button>
          )}

          {globalError && (
            <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {globalError}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allSelected || submitting}
            className="btn-primary mt-6 w-full"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin-slow" />Enviando documentos...</>
            ) : (
              <><Upload className="h-4 w-4" />Enviar documentos</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente: slot de upload ───────────────────────────────────────────

interface SlotProps {
  slot: DocSlot;
  onChange: (file: File) => void;
  onRemove: () => void;
  canDelete?: boolean;
  onPrintChange?: (value: boolean) => void;
}

function DocUploadSlot({ slot, onChange, onRemove, canDelete = false, onPrintChange }: SlotProps) {
  const inputId = `doc-upload-${slot.id}`;

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      slot.status === 'done' ? 'border-green-500/40 bg-green-500/5'
      : slot.status === 'error' ? 'border-red-500/40 bg-red-500/5'
      : 'border-white/10 bg-graphite/50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {slot.status === 'done' ? (
              <FileCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Upload className="h-4 w-4 text-pharos-red" />
            )}
            <span className="font-display text-sm font-semibold text-white">{slot.label}</span>
            {slot.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin-slow text-pharos-red" />}
          </div>
          <p className="mt-0.5 text-xs text-steel">{slot.description}</p>
          {slot.file && <p className="mt-1.5 text-xs text-steel/80 truncate max-w-xs">📎 {slot.file.name}</p>}
          {slot.errorMsg && <p className="mt-1.5 text-xs text-red-400">{slot.errorMsg}</p>}

          {/* Opção de impressão — exclusiva para Certidão */}
          {slot.document_type === 'certidao' && onPrintChange && (
            <div className="mt-3 rounded-lg border border-white/10 bg-graphite/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-steel mb-2">🖨️ Quer que imprima?</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="radio" name={`print-${slot.id}`} value="sim" checked={slot.printRequested === true} onChange={() => onPrintChange(true)} className="accent-pharos-red" />
                  <span className="text-xs text-white">Sim</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="radio" name={`print-${slot.id}`} value="nao" checked={slot.printRequested === false} onChange={() => onPrintChange(false)} className="accent-pharos-red" />
                  <span className="text-xs text-white">Não</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {slot.file ? (
            <button
              onClick={onRemove}
              title={canDelete ? 'Remover esta certidão' : 'Remover arquivo'}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-red-400 hover:text-red-400"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Botão de remover slot de certidão extra (sem arquivo ainda) */}
              {canDelete && (
                <button
                  onClick={onRemove}
                  title="Remover esta certidão"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-red-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-pharos-red hover:text-pharos-red"
              >
                Selecionar
                <input
                  id={inputId}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChange(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
