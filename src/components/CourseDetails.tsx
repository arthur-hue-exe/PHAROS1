import { useEffect, useState } from 'react';
import {
  Clock, Tag, CheckCircle2, ChevronDown, ArrowLeft, ShoppingCart,
  MessageCircle, Shield, BookOpen, Award, Target, ClipboardList,
} from 'lucide-react';
import { courses, contactInfo, type Course } from '@/data/content';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/Toast';
import { useRouter } from '@/context/RouterContext';
import { triggerRevealScan } from '@/hooks/useScrollReveal';
import CourseCard from '@/components/CourseCard';
import EnrollModal from '@/components/EnrollModal';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-base font-medium text-white">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-pharos-red transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm leading-relaxed text-steel">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetails({ slug }: { slug: string }) {
  const course = courses.find((c) => c.slug === slug);
  const { addCourse } = useCart();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    triggerRevealScan();
  }, [slug]);

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-noir px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Curso não encontrado</h1>
        <p className="mt-3 text-steel">O curso que você procura não está disponível.</p>
        <button onClick={() => navigate({ name: 'home' })} className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </button>
      </div>
    );
  }

  const related = courses.filter((c) => c.id !== course.id).slice(0, 3);
  const waLink = `https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(
    `Olá! Tenho interesse no curso ${course.title}.`
  )}`;

  const handleAdd = () => {
    addCourse(course);
    showToast(`${course.title} adicionado ao carrinho`);
  };

  const handleMatricula = () => {
    setShowEnrollModal(true);
  };

  return (
    <div className="min-h-screen bg-noir pt-16 md:pt-20">
      {showEnrollModal && (
        <EnrollModal
          courseTitle={course.title}
          onClose={() => setShowEnrollModal(false)}
        />
      )}
      {/* Hero / breadcrumb */}
      <div className="relative border-b border-white/10 bg-graphite">
        <div className="absolute inset-0">
          <img
            src={course.image}
            alt={course.imageAlt}
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-graphite/90 to-graphite/60" />
        </div>
        <div className="container-x relative z-10 py-10 md:py-14">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="mb-5 flex items-center gap-1.5 text-sm text-steel transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para cursos
          </button>
          <span className="inline-block rounded-full border border-pharos-red/40 bg-pharos-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pharos-red">
            {course.category}
          </span>
          <h1 className="reveal mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          <div className="reveal mt-5 flex flex-wrap items-center gap-5 text-sm text-steel">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-pharos-red" />
              {course.workload}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-pharos-red" />
              {course.modality}
            </span>
            {course.offerBadge && (
              <span className="rounded-full bg-pharos-red px-3 py-0.5 text-xs font-bold uppercase text-white">
                {course.offerBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container-x py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section className="reveal">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <BookOpen className="h-5 w-5 text-pharos-red" />
                Sobre o curso
              </h2>
              <p className="mt-4 text-base leading-relaxed text-steel">{course.description}</p>
            </section>

            {/* Objectives */}
            <section className="reveal">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <Target className="h-5 w-5 text-pharos-red" />
                Objetivos
              </h2>
              <ul className="mt-4 space-y-2.5">
                {course.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-steel">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pharos-red" />
                    {obj}
                  </li>
                ))}
              </ul>
            </section>

            {/* Syllabus */}
            <section className="reveal">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <ClipboardList className="h-5 w-5 text-pharos-red" />
                Conteúdo programático
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {course.syllabus.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-graphite/60 px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-noir font-display text-xs font-bold text-pharos-red">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-steel">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            <section className="reveal">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <Shield className="h-5 w-5 text-pharos-red" />
                Requisitos
              </h2>
              <ul className="mt-4 space-y-2.5">
                {course.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-steel">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pharos-red" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>

            {/* Certification */}
            <section className="reveal rounded-xl border border-pharos-red/20 bg-pharos-red/5 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <Award className="h-5 w-5 text-pharos-red" />
                Certificação
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-steel">{course.certification}</p>
            </section>

            {/* FAQ */}
            <section className="reveal">
              <h2 className="font-display text-xl font-semibold text-white">Perguntas frequentes</h2>
              <div className="mt-4 rounded-xl border border-white/10 bg-graphite/60 px-5">
                {course.faqs.map((faq, i) => (
                  <AccordionItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>
          </div>

          {/* Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-white/10 bg-graphite-2/60 p-6">
                {course.oldPrice && (
                  <div className="text-sm text-steel line-through">
                    De {formatPrice(course.oldPrice)}
                  </div>
                )}
                <div className="font-display text-3xl font-bold text-white">
                  {formatPrice(course.price)}
                </div>
                <div className="mt-1 text-sm text-steel">
                  ou {course.installments}x de {formatPrice(course.installmentValue)} sem juros
                </div>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-steel">
                      <Clock className="h-4 w-4 text-pharos-red" />
                      Carga horária
                    </span>
                    <span className="font-medium text-white">{course.workload}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-steel">
                      <Tag className="h-4 w-4 text-pharos-red" />
                      Modalidade
                    </span>
                    <span className="font-medium text-white">{course.modality}</span>
                  </div>
                </div>

                <button onClick={handleMatricula} className="btn-primary mt-6 w-full">
                  Matricule-se já
                </button>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 w-full">
                  <MessageCircle className="h-4 w-4" />
                  Falar pelo WhatsApp
                </a>
                <button onClick={handleAdd} className="btn-ghost mt-2 w-full">
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky bar */}
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-noir/95 p-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-bold text-white">
                {formatPrice(course.price)}
              </div>
              <div className="text-xs text-steel">
                {course.installments}x de {formatPrice(course.installmentValue)}
              </div>
            </div>
            <button onClick={handleMatricula} className="btn-primary flex-1 max-w-[60%]">
              Matricule-se já
            </button>
          </div>
        </div>
      </div>

      {/* Related courses */}
      <section className="border-t border-white/10 bg-graphite py-16">
        <div className="container-x">
          <h2 className="reveal font-display text-2xl font-bold text-white sm:text-3xl">
            Cursos relacionados
          </h2>
          <div className="reveal-stagger mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c: Course) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
