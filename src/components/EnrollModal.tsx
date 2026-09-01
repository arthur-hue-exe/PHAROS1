import { X, FileText, UserPlus } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';

interface Props {
  courseTitle: string;
  courseSlug?: string;
  onClose: () => void;
}

export default function EnrollModal({ courseTitle, courseSlug, onClose }: Props) {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();

  const handleConfirm = () => {
    onClose();
    if (!user) {
      navigate({ name: 'register' });
      return;
    }
    // Verificação de e-mail removida do fluxo obrigatório
    if (!profile?.documents_uploaded) {
      navigate({ name: 'upload-docs', courseSlug, courseName: courseTitle });
      return;
    }
    navigate({ name: 'docs-sent' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-noir/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-scale-in relative w-full max-w-md rounded-2xl border border-white/10 bg-graphite-2 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-steel transition-colors hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-pharos-red/30 bg-pharos-red/10">
          <FileText className="h-7 w-7 text-pharos-red" />
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold text-white">
          Prosseguir com matrícula
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-steel">
          Para prosseguir com a matrícula no curso{' '}
          <span className="font-semibold text-white">{courseTitle}</span>, é necessário se
          cadastrar e enviar os documentos exigidos. Deseja prosseguir?
        </p>

        <ul className="mt-5 space-y-2 rounded-lg border border-white/10 bg-graphite/60 px-4 py-3 text-sm text-steel">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pharos-red" />
            Criação de cadastro (e-mail, senha e telefone)
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pharos-red" />
            Validação do e-mail via código OTP
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pharos-red" />
            Envio de documentos: CNH, RG, Título de Eleitor e Comprovante de Residência
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onClose} className="btn-secondary flex-1">
            Agora não
          </button>
          <button onClick={handleConfirm} className="btn-primary flex-1">
            <UserPlus className="h-4 w-4" />
            Prosseguir
          </button>
        </div>
      </div>
    </div>
  );
}
