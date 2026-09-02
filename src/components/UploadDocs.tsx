/**
 * UploadDocs — página de envio de documentos.
 * Rota protegida: só acessível com e-mail verificado.
 * Documentos aceitos: CNH, RG, Título de Eleitor, Comprovante de Residência.
 * Armazenamento via Supabase Storage (bucket privado "documents").
 */
import { useState, useCallback, useEffect } from 'react';
import { Upload, FileCheck, Loader2, ArrowLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

type DocType = 'cnh' | 'rg' | 'titulo_eleitor' | 'comprovante_residencia' | 'certidao' | 'oficio';

interface DocSlot {
  type: DocType;
  label: string;
  description: string;
  file: File | null;
  status: 'idle' | 'uploading' | 'done' | 'error';
  errorMsg: string;
  /** Apenas para certidao: indica se o usuário solicitou impressão */
  printRequested?: boolean;
}

/** Slots base — exibidos para TODOS os usuários (particular e empresa) */
const BASE_SLOTS: DocSlot[] = [
  { type: 'cnh', label: 'CNH', description: 'Carteira Nacional de Habilitação (frente e verso em uma imagem ou PDF)', file: null, status: 'idle', errorMsg: '' },
  { type: 'rg', label: 'RG', description: 'Documento de Identidade (frente e verso)', file: null, status: 'idle', errorMsg: '' },
  { type: 'titulo_eleitor', label: 'Título de Eleitor', description: 'Título de eleitor (frente e verso)', file: null, status: 'idle', errorMsg: '' },
  { type: 'comprovante_residencia', label: 'Comprovante de Residência', description: 'Conta de água, luz ou telefone com no máx. 90 dias', file: null, status: 'idle', errorMsg: '' },
  { type: 'certidao', label: 'Certidão', description: 'Certidão exigida para matrícula (PDF ou imagem legível)', file: null, status: 'idle', errorMsg: '', printRequested: false },
];

/** Slot adicional — exibido SOMENTE para conta Empresa */
const OFICIO_SLOT: DocSlot = {
  type: 'oficio',
  label: 'Ofício',
  description: 'Ofício da empresa solicitante (PDF ou imagem legível)',
  file: null,
  status: 'idle',
  errorMsg: '',
};

/** Monta a lista de slots de acordo com o tipo de conta */
function buildSlots(accountType: 'particular' | 'empresa'): DocSlot[] {
  return accountType === 'empresa'
    ? [...BASE_SLOTS, OFICIO_SLOT]
    : [...BASE_SLOTS];
}

export default function UploadDocs() {
  const { user, profile, refreshProfile } = useAuth();
  const { navigate, route } = useRouter();

  // Curso passado via rota (vem do cadastro ou EnrollModal)
  // Fallback: usa o curso já salvo no profile caso a rota tenha perdido o parâmetro
  const routeCourseSlug = route.name === 'upload-docs' ? (route.courseSlug ?? null) : null;
  const routeCourseName = route.name === 'upload-docs' ? (route.courseName ?? null) : null;
  const courseSlug = routeCourseSlug ?? profile?.course_slug ?? null;
  const courseName = routeCourseName ?? profile?.course_name ?? null;
  // Slots inicializados com base no account_type do profile.
  // Começa com BASE_SLOTS como fallback — corrigido assim que o profile carrega.
  const [slots, setSlots] = useState<DocSlot[]>(() => buildSlots('particular'));
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Proteção de rota via useEffect (respeita regras de hooks)
  useEffect(() => {
    if (!user) {
      navigate({ name: 'register' });
    } else if (profile?.documents_uploaded) {
      // Documentos já enviados — redireciona para confirmação
      navigate({ name: 'docs-sent' });
    }
    // Removido: bloqueio por email_verified — usuário pode enviar docs sem confirmar e-mail
  }, [user, profile, navigate]);

  // Atualiza os slots quando o account_type do profile estiver disponível
  useEffect(() => {
    if (!profile) return;
    setSlots(buildSlots(profile.account_type ?? 'particular'));
  }, [profile?.account_type]);

  const handleFileChange = useCallback((type: DocType, file: File | null) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSlots((prev) => prev.map((s) =>
        s.type === type ? { ...s, errorMsg: 'Formato inválido. Use JPG, PNG, WEBP ou PDF.' } : s
      ));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSlots((prev) => prev.map((s) =>
        s.type === type ? { ...s, errorMsg: 'Arquivo muito grande. Máximo 5 MB.' } : s
      ));
      return;
    }
    setSlots((prev) => prev.map((s) =>
      s.type === type ? { ...s, file, status: 'idle', errorMsg: '' } : s
    ));
  }, []);

  const uploadFile = useCallback(async (slot: DocSlot): Promise<boolean> => {
    if (!slot.file || !user) return false;

    setSlots((prev) => prev.map((s) =>
      s.type === slot.type ? { ...s, status: 'uploading' } : s
    ));

    const ext = slot.file.name.split('.').pop() ?? 'bin';
    const storagePath = `${user.id}/${slot.type}_${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, slot.file, { contentType: slot.file.type, upsert: false });

    if (storageErr) {
      setSlots((prev) => prev.map((s) =>
        s.type === slot.type ? { ...s, status: 'error', errorMsg: storageErr.message } : s
      ));
      return false;
    }

    const { error: dbErr } = await supabase.from('documents').insert({
      user_id: user.id,
      document_type: slot.type,
      storage_path: storagePath,
      file_name: slot.file.name,
      file_size: slot.file.size,
      mime_type: slot.file.type,
      print_requested: slot.type === 'certidao' ? (slot.printRequested ?? false) : false,
    });

    if (dbErr) {
      setSlots((prev) => prev.map((s) =>
        s.type === slot.type ? { ...s, status: 'error', errorMsg: dbErr.message } : s
      ));
      return false;
    }

    setSlots((prev) => prev.map((s) =>
      s.type === slot.type ? { ...s, status: 'done', errorMsg: '' } : s
    ));
    return true;
  }, [user]);

  const handleSubmit = useCallback(async () => {
    const missing = slots.filter((s) => !s.file);
    if (missing.length > 0) {
      setGlobalError('Adicione todos os documentos antes de enviar.');
      return;
    }
    setGlobalError('');
    setSubmitting(true);

    const results = await Promise.all(slots.map(uploadFile));
    const allOk = results.every(Boolean);

    if (allOk) {
      // Salvar o curso escolhido no profile (apenas se foi passado via rota)
      if (courseSlug && courseName && user) {
        await supabase
          .from('profiles')
          .update({ course_slug: courseSlug, course_name: courseName })
          .eq('id', user.id);
      }
      await supabase.rpc('mark_documents_uploaded');
      await refreshProfile();
      navigate({ name: 'docs-sent' });
    } else {
      setGlobalError('Alguns arquivos falharam. Verifique os erros e tente novamente.');
    }
    setSubmitting(false);
  }, [slots, uploadFile, refreshProfile, navigate, courseSlug, courseName, user]);

  // ── Renderização condicional APÓS todos os hooks ───────────────────────────

  // Guard: se não autenticado ou já enviou docs — spinner enquanto redireciona
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
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mb-6 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>

        <div className="rounded-2xl border border-white/10 bg-graphite-2/80 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10">
            <Upload className="h-7 w-7 text-pharos-red" />
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            Envio de documentos
          </h1>
          <p className="mt-2 text-sm text-steel">
            Envie os documentos abaixo para concluir o processo de matrícula.
            Formatos aceitos: JPG, PNG, WEBP e PDF. Máximo 5 MB por arquivo.
          </p>

          <div className="mt-7 space-y-4">
            {slots.map((slot) => (
              <DocUploadSlot
                key={slot.type}
                slot={slot}
                onChange={(file) => handleFileChange(slot.type, file)}
                onRemove={() => setSlots((prev) => prev.map((s) =>
                  s.type === slot.type ? { ...s, file: null, status: 'idle', errorMsg: '' } : s
                ))}
                onPrintChange={slot.type === 'certidao' ? (value) => setSlots((prev) =>
                  prev.map((s) => s.type === 'certidao' ? { ...s, printRequested: value } : s)
                ) : undefined}
              />
            ))}
          </div>

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
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Enviando documentos...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar documentos
              </>
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
  onPrintChange?: (value: boolean) => void;
}

function DocUploadSlot({ slot, onChange, onRemove, onPrintChange }: SlotProps) {
  const inputId = `doc-upload-${slot.type}`;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        slot.status === 'done'
          ? 'border-green-500/40 bg-green-500/5'
          : slot.status === 'error'
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-white/10 bg-graphite/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {slot.status === 'done' ? (
              <FileCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Upload className="h-4 w-4 text-pharos-red" />
            )}
            <span className="font-display text-sm font-semibold text-white">{slot.label}</span>
            {slot.status === 'uploading' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin-slow text-pharos-red" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-steel">{slot.description}</p>

          {slot.file && (
            <p className="mt-1.5 text-xs text-steel/80 truncate max-w-xs">
              📎 {slot.file.name}
            </p>
          )}
          {slot.errorMsg && (
            <p className="mt-1.5 text-xs text-red-400">{slot.errorMsg}</p>
          )}

          {/* Opção de impressão — exclusiva para Certidão */}
          {slot.type === 'certidao' && onPrintChange && (
            <div className="mt-3 rounded-lg border border-white/10 bg-graphite/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-steel mb-2">🖨️ Quer que imprima?</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name={`print-${slot.type}`}
                    value="sim"
                    checked={slot.printRequested === true}
                    onChange={() => onPrintChange(true)}
                    className="accent-pharos-red"
                  />
                  <span className="text-xs text-white">Sim</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name={`print-${slot.type}`}
                    value="nao"
                    checked={slot.printRequested === false}
                    onChange={() => onPrintChange(false)}
                    className="accent-pharos-red"
                  />
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
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-steel transition-colors hover:border-red-400 hover:text-red-400"
              aria-label="Remover arquivo"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
