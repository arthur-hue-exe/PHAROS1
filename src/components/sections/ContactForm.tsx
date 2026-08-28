import { useState, useCallback } from 'react';
import { Mail, MapPin, MessageCircle, Send, CheckCircle2, AlertCircle, Loader2, Navigation } from 'lucide-react';
import { contactInfo, courses } from '@/data/content';

type FormState = {
  name: string;
  phone: string;
  email: string;
  course: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type Status = 'idle' | 'loading' | 'success' | 'error';

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', email: '', course: '', message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const validateField = useCallback((field: keyof FormState, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Informe seu nome';
        if (value.trim().length < 3) return 'Nome muito curto';
        return '';
      case 'phone': {
        const digits = value.replace(/\D/g, '');
        if (!digits) return 'Informe seu telefone';
        if (digits.length < 10) return 'Telefone incompleto';
        return '';
      }
      case 'email':
        if (!value.trim()) return 'Informe seu e-mail';
        if (!validateEmail(value)) return 'E-mail inválido';
        return '';
      case 'message':
        if (!value.trim()) return 'Escreva uma mensagem';
        if (value.trim().length < 10) return 'Mensagem muito curta';
        return '';
      default:
        return '';
    }
  }, []);

  const handleChange = (field: keyof FormState, raw: string) => {
    const value = field === 'phone' ? maskPhone(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    (['name', 'phone', 'email', 'message'] as const).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true, message: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    setStatus('loading');
    try {
      // Simulated submission — replace with real API integration later
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus('success');
      setForm({ name: '', phone: '', email: '', course: '', message: '' });
      setTouched({});
    } catch {
      setStatus('error');
    }
  };

  const resetStatus = () => {
    setStatus('idle');
  };

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.mapsQuery)}`;
  const waLink = `https://wa.me/${contactInfo.whatsapp}`;

  return (
    <section id="contato" className="relative border-t border-white/5 bg-graphite py-20 md:py-28">
      <div className="container-x">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="section-label justify-center">
            <span className="h-px w-8 bg-pharos-red" />
            Fale Conosco
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Entre em Contato
          </h2>
          <p className="mt-4 text-steel">
            Tire suas dúvidas, solicite informações ou inicie sua matrícula.
            Nossa equipe está pronta para atender você.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="reveal reveal-left lg:col-span-3">
            {status === 'success' ? (
              <div className="animate-scale-in flex flex-col items-center rounded-2xl border border-green-500/30 bg-green-500/5 p-10 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h3 className="mt-4 font-display text-xl font-semibold text-white">
                  Solicitação recebida!
                </h3>
                <p className="mt-2 max-w-sm text-sm text-steel">
                  Sua mensagem foi enviada com sucesso. Nossa equipe entrará em
                  contato em breve.
                </p>
                <button onClick={resetStatus} className="btn-secondary mt-6">
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-graphite-2/60 p-6 md:p-8"
                noValidate
              >
                {status === 'error' && (
                  <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    Ocorreu um erro no envio. Tente novamente ou nos contate pelo WhatsApp.
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="input-label">Nome *</label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Seu nome completo"
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="input-label">Telefone / WhatsApp *</label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="(62) 00000-0000"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="input-label">E-mail *</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="seu@email.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="course" className="input-label">Curso de interesse</label>
                    <select
                      id="course"
                      value={form.course}
                      onChange={(e) => handleChange('course', e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione um curso</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.title}>{c.title}</option>
                      ))}
                      <option value="Outro">Outro / Não sei ainda</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="message" className="input-label">Mensagem *</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    className={`input-field resize-none ${errors.message ? 'border-red-500' : ''}`}
                    placeholder="Conte-nos como podemos ajudar..."
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin-slow" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar mensagem
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact info + map */}
          <div className="reveal reveal-right lg:col-span-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                  <div>
                    <div className="text-sm font-semibold text-white">Endereço</div>
                    <p className="mt-1 text-sm text-steel">{contactInfo.address}</p>
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-pharos-red transition-colors hover:text-white"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Abrir rota no Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                  <div>
                    <div className="text-sm font-semibold text-white">E-mail</div>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="mt-1 block text-sm text-steel transition-colors hover:text-pharos-red"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-5">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-pharos-red" />
                  <div>
                    <div className="text-sm font-semibold text-white">WhatsApp</div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm text-steel transition-colors hover:text-pharos-red"
                    >
                      {contactInfo.whatsappDisplay}
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-graphite-2/60 p-5">
                <div className="text-sm font-semibold text-white">Horário de atendimento</div>
                <p className="mt-1 text-sm text-steel">{contactInfo.hours}</p>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-xl border border-white/10">
                <iframe
                  title="Localização da PHAROS"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(contactInfo.mapsQuery)}&output=embed`}
                  className="h-56 w-full grayscale"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
