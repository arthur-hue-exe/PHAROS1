import { useState } from 'react';
import { Clock, Tag, ArrowRight, GraduationCap } from 'lucide-react';
import type { Course } from '@/data/content';
import { useRouter } from '@/context/RouterContext';
import EnrollModal from '@/components/EnrollModal';

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CourseCard({ course }: { course: Course }) {
  const { navigate } = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleDetails = () => navigate({ name: 'course', slug: course.slug });

  return (
    <>
      {showModal && (
        <EnrollModal
          courseTitle={course.title}
          onClose={() => setShowModal(false)}
        />
      )}

      <article
        className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-graphite-2/60 transition-all duration-300 hover:-translate-y-1 hover:border-pharos-red/50 hover:shadow-[0_12px_40px_-12px_rgba(225,6,0,0.3)]"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={course.image}
            alt={course.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite-2 via-graphite-2/20 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-noir/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {course.category}
          </span>
          {course.offerBadge && (
            <span className="absolute right-3 top-3 rounded-full bg-pharos-red px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {course.offerBadge}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-semibold leading-snug text-white">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-steel">
            {course.shortDescription}
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs text-steel">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-pharos-red" />
              {course.workload}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-pharos-red" />
              {course.modality}
            </span>
          </div>

          {/* Price */}
          <div className="mt-5 border-t border-white/10 pt-4">
            {course.oldPrice && (
              <div className="text-xs text-steel line-through">
                De {formatPrice(course.oldPrice)}
              </div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-white">
                {formatPrice(course.price)}
              </span>
            </div>
            <div className="text-xs text-steel">
              ou {course.installments}x de {formatPrice(course.installmentValue)} sem juros
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={handleDetails}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-pharos-red hover:text-pharos-red"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-pharos-red text-white transition-colors hover:bg-pharos-red-dark"
              aria-label={`Matricular-se em ${course.title}`}
              title="Matricule-se já"
            >
              <GraduationCap className="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </>
  );
}
